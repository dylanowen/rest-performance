/// <reference path="../../../node_modules/typescript/lib/lib.webworker.d.ts"/>

let workerId;

//get the id and startup
onmessage = (e: MessageEvent) => {
    workerId = e.data;

    onmessage = (e: MessageEvent) => {
        
    }

    postMessage(true);
}