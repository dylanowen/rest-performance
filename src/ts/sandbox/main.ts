/// <reference path="../types/Sandbox.d.ts"/>
/// <reference path="../types/TestInterface.d.ts"/>

/// <reference path="./Action.ts"/>
/// <reference path="./Generator.ts"/>

new (class SandboxImpl {

    private actionMap: {
        [action: number]: (data: any) => any;
    } = {};

    constructor() {
        for (let action of Generator.getAll()) {
            this.actionMap[action.enum] = action.run.bind(action);
        }

        window.addEventListener('message', this.messageHandler.bind(this));
    }

    private messageHandler(event: MessageEvent): void {
        const message: Sandbox.In.Message = event.data;

        let responseData: Object = null;
        for (let action in this.actionMap) {
            if (action == message.action + '') {
                responseData = this.actionMap[action](message.data);
            }
        }

        if (responseData == null) {
            console.error('Unknown action', message);
            throw 'Unknown action: ' + message.action;
        }

        const response: Sandbox.Out.Message = {
            id: message.id,
            data: responseData
        }

        event.source.postMessage(response, event.origin);
    }
})();