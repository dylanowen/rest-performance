/// <reference path="./Ajax.d.ts"/>

interface SimpleObject {
    [key: string]: any
}

namespace Ajax {
    export const DEFAULT_TIMEOUT = 60 * 1000;
    
    export function request(settings: RequestObject): void {
        //set default settings
        setDefaults(settings, {
            method: 'GET',
            data: null,
            timeout: DEFAULT_TIMEOUT,
            callback: () => { }
        });
        settings.method = settings.method.toUpperCase();

        const ajax = new XMLHttpRequest();
        ajax.timeout = settings.timeout;
        ajax.open(settings.method, settings.url, true);

        ajax.onreadystatechange = () => {
            if (ajax.readyState === 4) {
                settings.callback(<STATUS>ajax.status);
            }
        }

        ajax.ontimeout = () => {
            console.error('Request timed out');
            settings.callback(STATUS.CANCELED);
        }

        if (settings.method !== 'GET' && settings.data !== null) {
            ajax.send(JSON.stringify(settings.data));
        }
        else {
            ajax.send();
        }
    }

    function setDefaults(original: SimpleObject, defaults: SimpleObject) {
        //console.log(original);
        for (var key in defaults) {
            //console.log(key, key in original, typeof (original[key]));
            if (!(key in original) || typeof(original[key]) == 'undefined') {
                original[key] = <any>defaults[key]
            }
        }
    }
}
