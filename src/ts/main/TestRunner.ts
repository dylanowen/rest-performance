/// <reference path="../types/TestInterface.d.ts"/>

/// <reference path="../util/Ajax.ts"/>

type State = any;

interface TestSettingsState extends TestSettings {
    nextState: State
}

interface StateFunction {
    (state: State): TestSettingsState;
}

interface Generator<T> {
    (): {
        next(): {
            value: T
        }
    }
}

class TestRunner {
    private output: HTMLTextAreaElement;
    private tOutput: HTMLTextAreaElement;

    private inProgress: boolean = false;
    private workers: Worker[];
    private testResults: TestResult[];
    private testStartTime: number;
    private stateGenerator: any;
    private stateIterator: any;

    public constructor(output: HTMLTextAreaElement, tOutput: HTMLTextAreaElement, userStateFunction: StateFunction, initialState: any) {
        this.output = output;
        this.tOutput = tOutput;

        this.stateGenerator = function*(): IterableIterator<TestSettings> {
            let settings: TestSettingsState = userStateFunction(initialState);
            let state: State;

            while (settings != null && settings.requestUrl != null && settings.requestUrl.length > 0) {
                const yieldedSettings: TestSettingsState = JSON.parse(JSON.stringify(settings));
                delete yieldedSettings.nextState

                yield yieldedSettings;

                state = settings.nextState;
                settings = userStateFunction(state);
            } 

            return null;
        }
    }

    public run(threads: number = 1): void {
        if(this.inProgress) {
            console.error('Test already running');

            return;
        }
        
        this.prepareTest();
        
        var finishedThreads = 0;

        const joiner = (): void => {
            finishedThreads++;

            if (finishedThreads >= threads) {
                this.end();
            }
        }

        for (let i = 0; i < threads; i++) {
            const worker = new Worker('js/worker.js');

            worker.onmessage = this.startWorker.bind(this, joiner);

            worker.postMessage(i);

            this.workers.push(worker);
        }
    }

    private startWorker(callback: Function, e: MessageEvent): void {
        if (e.data != true) {
            throw 'Invalid worker bootup response: ' + e;
        }
        const worker: Worker = <Worker>e.target;

        console.log(e);

        //kick off the worker iteration
        this.iterateWorker(worker, callback)
    }

    private iterateWorker(worker: Worker, callback: Function): void {
        const testSettings: TestSettingsState = this.stateIterator.next().value;

        if (!this.inProgress || testSettings == null) {
            callback();
            return;
        }

        const resultIndex = this.testResults.length;
        this.testResults.push(null);//reserve our spot in the array

        this.output.value = resultIndex + '';

        //this is ok because we're always executing these in order
        worker.onmessage = (e:MessageEvent): void => {
            const result: TestResult = e.data;

            this.testResults[resultIndex] = result;

            this.iterateWorker(worker, callback);
        }

        //send the job to the worker
        worker.postMessage(testSettings);
    }

/*
    private iterator(threadId: number): void {
        const testSettings: TestSettingsState = this.stateIterator.next().value;



        if (!this.inProgress || testSettings == null) {
            this.end(); // this needs to be a join or something like that so I can keep track of each thread
            return;
        }

        const result: TestResult = {
            threadId: threadId,
            url: testSettings.requestUrl,
            status: Ajax.STATUS.CANCELED,
            time: -1,
        }
        this.testResults.push(result);
        this.output.value = this.testResults.length + '';

        const startTime = performance.now();
        Ajax.request({
            method: testSettings.method,
            url: testSettings.requestUrl,
            data: testSettings.data,
            callback: (status: Ajax.STATUS) => {
                result.time = performance.now() - startTime;
                result.status = status;

                this.iterator(threadId);
            }
        });
    }
    */

    private prepareTest(): void {
        this.output.value = '';
        this.tOutput.value = '';
        this.inProgress = true;
        this.workers = [];
        this.testResults = [];
        this.testStartTime = performance.now();
        this.stateIterator = this.stateGenerator();
    }

    public stop(): void {
        this.inProgress = false;
    }

    private end(): void {
        this.stop();

        const threads = this.workers.length;
        this.workers.forEach((worker: Worker): void => { worker.terminate() });

        let threadTimes: number[] = [];
        for (let i = 0; i < threads; i++) {
            threadTimes.push(0);
        }
        let output = '';
        let tOutput = '';
        for (let result of this.testResults) {
            output += result.threadId + ': ' + result.url + '\n' + result.status + ' -> ' + formatMs(result.time) + '\n\n';
            tOutput += result.time + '\n';
            threadTimes[result.threadId] += result.time;
        }
        const totalTime = threadTimes.reduce((prev: number, cur: number) => prev + cur);
        const average = totalTime / this.testResults.length;

        const testTime = formatMs(performance.now() - this.testStartTime);

        this.output.value = output + 'Total Time: ' + formatMs(totalTime) + '\nTotal Requests: ' + this.testResults.length + '\nAverage: ' + formatMs(average) + '\n\n' + 'Test Time: ' + testTime;
        this.tOutput.value = tOutput;

        this.output.scrollTop = this.output.scrollHeight;
        this.tOutput.scrollTop = this.tOutput.scrollHeight;
    }

    
}

const TIME_STEPS = [
    { step: 1000 * 60 * 60 * 24, type: 'd' },
    { step: 1000 * 60 * 60, type: 'h' },
    { step: 1000 * 60, type: 'm' },
    { step: 1000, type: 's' },
    { step: 1, type: 'ms' }
];
function formatMs(millis: number): string {
    millis = Math.round(millis);
    let output: string = '';
    let current: number = millis;
    let moreThanMs: boolean = false;

    for (let i of TIME_STEPS) {
        if (current >= i.step || output.length > 0) {
            if (i.type != 'ms') {
                moreThanMs = true;
            }

            const div = Math.floor(current / i.step);
            current = current % i.step

            output += div + i.type + ' ';
        }
    }

    return output + ((moreThanMs) ? '(' + millis + 'ms)' : '');
}