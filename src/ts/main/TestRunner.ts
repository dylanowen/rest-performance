/// <reference path="../util/Ajax.ts"/>

type State = any;

interface TestSettings {
    requestUrl?: string
    nextState: State
}

interface StateFunction {
    (state: State): TestSettings;
}

interface Generator<T> {
    (): {
        next(): {
            value: T
        }
    }
}

interface TestResult {
    threadId: number,
    url: string,
    status: Ajax.STATUS,
    time: number
}

class TestRunner {
    private output: HTMLTextAreaElement;
    private tOutput: HTMLTextAreaElement;
    private threads: number;

    private inProgress: boolean = false;
    private testResults: TestResult[];
    private stateGenerator: any;
    private stateIterator: any;

    public constructor(output: HTMLTextAreaElement, tOutput: HTMLTextAreaElement, userStateFunction: StateFunction, initialState: any) {
        this.output = output;
        this.tOutput = tOutput;

        const worker = new Worker('js/worker.js');

        worker.onmessage = (e: MessageEvent) => {
            console.log(e);
        };

        worker.postMessage(1)



        console.log(worker);

        this.stateGenerator = function*(): any {
            let settings: TestSettings = userStateFunction(initialState);
            let state: State;

            while (settings != null && settings.requestUrl != null && settings.requestUrl.length > 0) {
                yield settings;

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

        this.start();
        this.stateIterator = this.stateGenerator();

        for (let i = 0; i < threads; i++) {
            this.iterator(i);
        }
    }

    private iterator(threadId: number): void {
        const testSettings = this.stateIterator.next().value;

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
        //this.output.value = this.testResults.length + ': ' + testSettings.requestUrl + '\n';
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

    private start(): void {
        this.output.value = '';
        this.tOutput.value = '';
        this.inProgress = true;
        this.testResults = [];
    }

    public stop(): void {
        this.inProgress = false;
    }

    private end(): void {
        this.stop();

        let threadTimes: number[] = [];
        for (let i = 0; i < this.threads; i++) {
            threadTimes.push(0);
        }
        let output = '';
        let tOutput = '';
        for (let result of this.testResults) {
            output += result.threadId + ': ' + result.url + '\n' + result.status + ':' + Ajax.STATUS[result.status] + ' -> ' + formatMs(result.time) + '\n\n';
            tOutput += result.time + '\n';
            threadTimes[result.threadId] += result.time;
        }
        const totalTime = threadTimes.reduce((prev: number, cur: number) => prev + cur);
        const average = totalTime / this.testResults.length;

        this.output.value += 'Total Time: ' + formatMs(totalTime) + '\nTotal Requests: ' + this.testResults.length + '\nAverage: ' + formatMs(average);

        this.output.scrollTop = this.output.scrollHeight;
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
    let output: string = '';
    let current: number = Math.round(millis);
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