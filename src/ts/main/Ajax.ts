enum STATUS {
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

class Ajax {
    public static request(url: string, callback: (status: STATUS) => void): void {
        const ajax = new XMLHttpRequest();
        ajax.open('GET', url, true);

        ajax.onreadystatechange = () => {
            if (ajax.readyState === 4) {
                callback(<STATUS>ajax.status);
            }
        }

        ajax.send();
    }
}