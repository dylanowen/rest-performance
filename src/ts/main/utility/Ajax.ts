interface SimpleObject {
    [key: string]: any
}

namespace Ajax {
    export enum STATUS {
        OK = 200,
        CREATED = 201,
        ACCEPTED = 202,
        NO_CONTENT = 204,
        PARTIAL_CONTENT = 206,
        BAD_REQUEST = 400,
        UNAUTHORIZED = 401,
        FORBIDDEN = 403,
        NOT_FOUND = 404,
        INTERNAL_SERVER_ERROR = 500,
        BAD_GATEWAY = 502,
        SERVICE_UNAVAILABLE = 503,
        CANCELED = 0
    }

    export interface RequestObject {
        method?: string
        url: string
        data?: any
        timeout?: number
        callback?: (status: STATUS) => void
    }

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
            ajax.send(settings.data)
        }
        else {
            ajax.send();
        }
    }

    function setDefaults(original: SimpleObject, defaults: SimpleObject) {
        console.log(original);
        for (var key in defaults) {
            console.log(key, key in original, typeof (original[key]));
            if (!(key in original) || typeof(original[key]) == 'undefined') {
                original[key] = <any>defaults[key]
            }
        }
    }
}
