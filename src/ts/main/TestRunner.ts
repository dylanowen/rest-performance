/// <reference path="./Ajax.ts"/>

interface GeneratorFunction {
    (state: any): { requestUrl: string, nextState?: any };
}

class TestRunner {
    private output: HTMLTextAreaElement;
    private tOutput: HTMLTextAreaElement;
    private generator: GeneratorFunction;
    private initialState: any;

    private inProgress: boolean = false;
    private testStartTime: number;
    private totalRuns: number;

    public constructor(output: HTMLTextAreaElement, tOutput: HTMLTextAreaElement, generator: GeneratorFunction, initialState: any) {
        this.output = output;
        this.tOutput = tOutput;
        this.generator = generator;
        this.initialState = initialState;
    }

    public run(): void {
        if(this.inProgress) {
            console.error('Test already running');

            return;
        }

        this.start();

        this.iterator(this.initialState)
    }

    private iterator(state: any): void {
        const testSettings = this.generator(state);

        if (!this.inProgress || testSettings == null || testSettings.requestUrl == null || testSettings.requestUrl.length == 0) {
            this.end();
            return;
        }

        this.output.value += this.totalRuns + ': ' + testSettings.requestUrl + '\n';
        const startTime = performance.now();

        Ajax.request({
            url: testSettings.requestUrl,
            callback: (status: Ajax.STATUS) => {
                const totalTime = Math.round(performance.now() - startTime);

                this.output.value += status + ':' + Ajax.STATUS[status] + ' -> ' + formatMs(totalTime) + '\n\n';
                this.totalRuns++;

                this.output.scrollTop = this.output.scrollHeight;

                this.tOutput.value += totalTime + '\n';
                this.tOutput.scrollTop = this.tOutput.scrollHeight;

                this.iterator(testSettings.nextState);
            }
        });
    }

    private start(): void {
        this.output.value = '';
        this.tOutput.value = '';
        this.inProgress = true;
        this.totalRuns = 0;
        this.testStartTime = performance.now();
    }

    public stop(): void {
        this.inProgress = false;
    }

    private end(): void {
        this.stop();
        const totalTime = Math.round(performance.now() - this.testStartTime);
        const average = Math.round(totalTime / this.totalRuns);

        this.output.value += 'Total Time: ' + formatMs(totalTime) + '\nTotal Requests: ' + this.totalRuns + '\nAverage: ' + formatMs(average);

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