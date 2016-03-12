/// <reference path="./Ajax.ts"/>
interface GeneratorFunction {
    (input: any): { requestUrl: string, nextInput?: any };
}

class Test {
    private output: HTMLTextAreaElement;
    private generator: GeneratorFunction;
    private startObject: any;

    private inProgress: boolean = false;
    private testStartTime: number;
    private totalRuns: number;

    public constructor(wrapper: HTMLElement, output: HTMLTextAreaElement, deleteButton: HTMLButtonElement, goButton: HTMLButtonElement, generator: GeneratorFunction, startObject: any) {
        this.output = output;
        this.generator = generator;
        this.startObject = startObject;

        deleteButton.addEventListener('click', this.remove.bind(this, wrapper));
        goButton.addEventListener('click', this.run.bind(this));
    }

    private run(): void {
        if(this.inProgress) {
            console.error('Test already running');

            return;
        }

        this.start();

        this.iterator(this.startObject)
    }

    private iterator(input: any): void {
        const {requestUrl, nextInput} = this.generator(input);

        if (!this.inProgress || requestUrl == null || requestUrl.length == 0) {
            this.end();
            return;
        }

        this.output.value += requestUrl + '\n';
        const startTime = performance.now();

        Ajax.request(requestUrl, (status: STATUS) => {
            const totalTime = Math.round(performance.now() - startTime);

            this.output.value += status + ':' + STATUS[status] + ' -> ' + formatMs(totalTime) + '\n\n';
            this.totalRuns++;

            this.output.scrollTop = this.output.scrollHeight;

            this.iterator(nextInput);
        });
    }

    private start(): void {
        this.output.value = '';
        this.inProgress = true;
        this.totalRuns = 0;
        this.testStartTime = performance.now();
    }

    private stop(): void {
        this.inProgress = false;
    }

    private end(): void {
        this.stop();
        const totalTime = Math.round(performance.now() - this.testStartTime);
        const average = Math.round(totalTime / this.totalRuns);

        this.output.value += 'Total Time: ' + formatMs(totalTime) + '\nTotal Runs: ' + this.totalRuns + '\nAverage: ' + formatMs(average);

        this.output.scrollTop = this.output.scrollHeight;
    }

    private remove(wrapper: HTMLElement): void {
        this.stop();

        wrapper.parentNode.removeChild(wrapper);
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