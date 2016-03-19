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

    export enum METHOD {
        GET,
        POST,
        PUT,
        PATCH,
        DELETE,
    }

    export interface RequestObject {
        method?: METHOD
        url: string
        data?: any
        timeout?: number
        callback?: (status: STATUS) => void
    }

    export const DEFAULT_TIMEOUT = 60 * 1000;
    
    export function request(settings: RequestObject): void {
        //set default settings
        setDefaults(settings, {
            method: METHOD.GET,
            data: null,
            timeout: DEFAULT_TIMEOUT,
            callback: () => { }
        });

        const ajax = new XMLHttpRequest();
        ajax.timeout = settings.timeout;
        ajax.open(METHOD[settings.method], settings.url, true);

        ajax.onreadystatechange = () => {
            if (ajax.readyState === 4) {
                settings.callback(<STATUS>ajax.status);
            }
        }

        ajax.ontimeout = () => {
            console.error('Request timed out');
            settings.callback(STATUS.CANCELED);
        }

        if (settings.method !== METHOD.GET && settings.data !== null) {
            ajax.send(settings.data)
        }
        else {
            ajax.send();
        }
    }

    function setDefaults(original: SimpleObject, defaults: SimpleObject) {
        for (var key in defaults) {
            if (!(key in original)) {
                original[key] = <any>defaults[key]
            }
        }
    }
}
