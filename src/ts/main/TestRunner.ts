/// <reference path="./utility/Ajax.ts"/>

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

class TestRunner {
    private output: HTMLTextAreaElement;
    private tOutput: HTMLTextAreaElement;
    private threads: number;

    private inProgress: boolean = false;
    private testResults: number[];
    private stateGenerator: any;
    private stateIterator: any;

    public constructor(output: HTMLTextAreaElement, tOutput: HTMLTextAreaElement, userStateFunction: StateFunction, initialState: any) {
        this.output = output;
        this.tOutput = tOutput;

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
            this.iterator();
        }
    }

    private iterator(): void {
        const testSettings = this.stateIterator.next().value;

        if (!this.inProgress || testSettings == null) {
            this.end(); // this needs to be a join or something like that so I can keep track of each thread
            return;
        }

        const resultNumber = this.testResults.length;
        this.output.value += resultNumber + ': ' + testSettings.requestUrl + '\n';
        const startTime = performance.now();

        Ajax.request({
            method: testSettings.method,
            url: testSettings.requestUrl,
            callback: (status: Ajax.STATUS) => {
                const totalTime = Math.round(performance.now() - startTime);

                this.output.value += resultNumber + ': ' + status + ':' + Ajax.STATUS[status] + ' -> ' + formatMs(totalTime) + '\n\n';
                this.tOutput.value += totalTime + '\n';

                this.output.scrollTop = this.output.scrollHeight;
                this.tOutput.scrollTop = this.tOutput.scrollHeight;

                this.testResults.push(totalTime);

                this.iterator();
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
        const totalTime = this.testResults.reduce((prev: number, cur: number) => prev + cur);
        const average = Math.round(totalTime / this.testResults.length);

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