/// <reference path="../../../node_modules/typescript/lib/lib.webworker.d.ts"/>
/// <reference path="../types/TestInterface.d.ts"/>


/// <reference path="../util/Ajax.ts"/>

let workerId: number;

//get the id and startup
onmessage = (e: MessageEvent) => {
    workerId = e.data;

    onmessage = (e: MessageEvent) => {
        const testSettings: TestSettings = e.data;

        const result: TestResult = {
            status: Ajax.STATUS.CANCELED,
            time: -1,
        }
        
        const startTime = performance.now();
        Ajax.request({
            method: testSettings.method,
            url: testSettings.url,
            data: testSettings.data,
            callback: (status: Ajax.STATUS) => {
                result.time = performance.now() - startTime;
                result.status = status;

                postMessage(result);
            }
        });
    }

    postMessage(true);
}