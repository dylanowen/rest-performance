/// <reference path="../types/TestInterface.d.ts"/>
/// <reference path="../types/Sandbox.d.ts"/>

class SandboxHandler {
    private sandbox: Window
    private messageId: number;
    private callbacks: {
        [id: number]: (response: any) => void
    } = {};

    constructor(elementId: string) {
        this.sandbox = (<HTMLIFrameElement>document.getElementById(elementId)).contentWindow;
        window.addEventListener('message', this.messageHandler.bind(this), false);

        this.messageId = 0;
    }

    public isGeneratorValid(generatorCode: string, callback: (valid: boolean) => void): void {
        const data: Sandbox.In.ValidateGenerator = {
            code: generatorCode
        }

        this.sendMessage(Sandbox.Action.ValidateGenerator, data, (response: Sandbox.Out.ValidateGenerator) => {
            if (!response.valid) {
                console.error(response.error);
            }

            callback(response.valid);
        });
    }

    public createGenerator(generatorCode: string, baseUrl: string, callback: (generator: TestIterator) => void): void {
        const data: Sandbox.In.CreateGenerator = {
            baseUrl: baseUrl,
            code: generatorCode
        }

        this.sendMessage(Sandbox.Action.CreateGenerator, data, (response: Sandbox.Out.CreateGenerator) => {
            if (!response.valid) {
                console.error(response);
                throw response.error;
            }

            const id = response.id;
            callback(this.testIterator.bind(this, id));
        });
    }

    private testIterator(id: number, callback: (result: TestSettings) => void) {
        const data: Sandbox.In.RunGenerator = {
            id: id
        };
        
        this.sendMessage(Sandbox.Action.RunGenerator, data, (response: Sandbox.Out.RunGenerator) => {
            if (!response.valid) {
                console.error(response);
                throw response.error;
            }
            
            callback(response.result);
        });
    }

    private messageHandler(event: MessageEvent): void {
        const message: Sandbox.Out.Message = event.data;

        if (message.id in this.callbacks) {
            this.callbacks[message.id](message.data);

            delete this.callbacks[message.id];
        }
        else {
            console.error('invalid message id', event);
            throw 'invalid message id';
        }
    }

    private sendMessage(action: Sandbox.Action, data: Object, callback: (response: Object) => void): void {
        const id = this.messageId++;

        const message: Sandbox.In.Message = {
            action: action,
            id: id,
            data: data
        }

        this.callbacks[id] = callback;

        this.sandbox.postMessage(message, '*');
    }
};