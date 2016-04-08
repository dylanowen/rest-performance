/// <reference path="../types/TestInterface.d.ts"/>

/// <reference path="../util/Ajax.ts"/>

interface TestIteratorGetter {
    (callback: (testIterator: TestIterator) => void): void
}

interface TestIterator {
    (callback: (testSettings: TestSettings) => void): void
}

interface VerboseTestResults extends TestResult {
    threadId: number,
    url: string,
    method: string
}

interface Thread {
    worker: Worker,
    id: number
}

class TestRunner {
    private output: HTMLTextAreaElement;
    private tOutput: HTMLTextAreaElement;

    private inProgress: boolean = false;
    private threads: Thread[];
    private testResults: VerboseTestResults[];
    private testStartTime: number;
    private testIteratorGetter: TestIteratorGetter;
    private testIterator: TestIterator;

    public constructor(output: HTMLTextAreaElement, tOutput: HTMLTextAreaElement, testIteratorGetter: TestIteratorGetter) {
        this.output = output;
        this.tOutput = tOutput;

        this.testIteratorGetter = testIteratorGetter;
    }

    public run(threads: number = 1): void {
        if(this.inProgress) {
            console.error('Test already running');

            return;
        }
        
        this.prepareTest((): void => {
            var finishedThreads = 0;

            const joiner = (): void => {
                finishedThreads++;

                if (finishedThreads >= threads) {
                    this.end();
                }
            }

            for (let i = 0; i < threads; i++) {
                const worker = new Worker('js/worker.js');

                const thread: Thread = {
                    worker: worker,
                    id: i
                };

                worker.onmessage = this.startWorker.bind(this, thread, joiner);

                worker.postMessage(i);

                this.threads.push(thread);
            }
        });
    }

    private startWorker(thread: Thread, callback: Function, e: MessageEvent): void {
        if (e.data != true) {
            throw 'Invalid worker bootup response: ' + e;
        }
        //console.log(e);

        //kick off the worker iteration
        this.iterateWorker(thread, callback)
    }

    private iterateWorker(thread: Thread, callback: Function): void {
        this.testIterator((testSettings: TestSettings) => {
            if (!this.inProgress || testSettings == null) {
                callback();
                return;
            }

            const resultIndex = this.testResults.length;
            this.testResults.push(null);//reserve our spot in the array

            this.output.value = (resultIndex + 1) + '';

            //this is ok because we're always executing these in order
            thread.worker.onmessage = (e: MessageEvent): void => {
                const result: TestResult = e.data;

                this.testResults[resultIndex] = {
                    status: result.status,
                    time: result.time,
                    threadId: thread.id,
                    url: testSettings.url,
                    method: testSettings.method
                };

                this.iterateWorker(thread, callback);
            }

            //send the job to the worker
            thread.worker.postMessage(testSettings);
        });
    }

    private prepareTest(callback: () => void): void {
        this.output.value = '';
        this.tOutput.value = '';
        this.inProgress = true;
        this.threads = [];
        this.testResults = [];
        this.testStartTime = performance.now();
        this.testIteratorGetter((testIterator: TestIterator) => {
            this.testIterator = testIterator;

            callback();
        });
    }

    public stop(): void {
        this.inProgress = false;
    }

    private end(): void {
        this.stop();

        const threads = this.threads.length;
        this.threads.forEach((thread: Thread): void => { thread.worker.terminate() });

        let threadTimes: number[] = [];
        for (let i = 0; i < threads; i++) {
            threadTimes.push(0);
        }
        let output = '';
        let tOutput = '';
        for (let result of this.testResults) {
            output += result.threadId + ' -> ' + result.method + ':' + result.url + '\n' + result.status + ' -> ' + formatMs(result.time) + '\n\n';
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