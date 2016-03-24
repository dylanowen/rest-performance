/// <reference path="../types/chrome/chrome.d.ts"/>

/// <reference path="./utility/Debounce.ts"/>

/// <reference path="./TestDatabase.ts"/>
/// <reference path="./TestView.ts"/>

class TestCreator {
    private testContainer: HTMLElement;
    private codeInput: any;
    private stateInput: any;
    private baseUrlInput: HTMLInputElement;
    private nameInput: HTMLInputElement;
    private threadsInput: HTMLInputElement;

    //http://jsfiddle.net/bzwheeler/btsxgena/
    public constructor(testsContainer: HTMLElement, codeInput: any, stateInput: any, baseUrlInput: HTMLInputElement, nameInput: HTMLInputElement, threadsInput: HTMLInputElement, createTestButton: HTMLButtonElement) {
        this.testContainer = testsContainer;
        this.codeInput = codeInput;
        this.stateInput = stateInput;
        this.baseUrlInput = baseUrlInput;
        this.nameInput = nameInput;
        this.threadsInput = threadsInput;

        this.loadFromDatabase();

        createTestButton.addEventListener('click', this.createTestHandler.bind(this));



        this.codeInput.on('change', this.saveState.bind(this));
        this.stateInput.on('change', this.saveState.bind(this));
    }

    private createTestHandler(): void {
        const stateCode = this.codeInput.getValue();
        const state = this.stateInput.getValue();
        const baseUrls = this.baseUrlInput.value.split('\n').map((url) => url.trim()).filter((url) => url.length > 0);
        const name = this.nameInput.value;
        const threads = parseInt(this.threadsInput.value);

        //validate the state function
        if (this.validateFunction(stateCode)) {
            //try to parse the json state
            let initialState: any;
            try {
                initialState = JSON.parse(state);
            }
            catch (e) {
                initialState = state;
            }

            this.createTest(name, baseUrls, stateCode, threads, initialState);
        }
        else {
            alert('Bad Code, check the logs for more info');
        }

        //console.log(code, state, baseUrl, name);
    }

    private createTest(name: string, baseUrls: string[], stateCode: string, threads: number, initialState: any): void {
        this.saveTest(name, baseUrls, stateCode, threads, initialState, this.displayTest.bind(this));
    }

    private displayTest(index: number): void {
        const test = new TestView(index);

        this.testContainer.insertBefore(test.elmnt, this.testContainer.firstChild);
    }

    private saveTest(name: string, baseUrls: string[], stateCode: string, threads: number, initialState: any, callback: (index: number) => void): void {
        const testObject = {
            [TEST_DATABASE.NAME_KEY]: name,
            [TEST_DATABASE.BASE_URLS_KEY]: baseUrls,
            [TEST_DATABASE.STATE_CODE_KEY]: stateCode,
            [TEST_DATABASE.THREADS_KEY]: threads,
            [TEST_DATABASE.INITIAL_STATE_KEY]: initialState,
            [TEST_DATABASE.DELETED_KEY]: false
        }

        TEST_DATABASE.write(TEST_DATABASE.TESTS_STORE_KEY, (tr: IDBTransaction) => {
            const testsStore = tr.objectStore(TEST_DATABASE.TESTS_STORE_KEY);

            const request: IDBRequest = testsStore.add(testObject);

            request.addEventListener('success', (event: Event) => {
                callback(request.result);
            });
        });
    }

    private saveState = Debounce((e: any) => {
        const stateObject = {
            [TEST_DATABASE.STATE_PATH]: "default",
            [TEST_DATABASE.STATE_CODE_KEY]: this.codeInput.getValue(),
            [TEST_DATABASE.INITIAL_STATE_KEY]: this.stateInput.getValue(),
            [TEST_DATABASE.BASE_URLS_KEY]: this.baseUrlInput.value.split('\n').map((url) => url.trim()).filter((url) => url.length > 0)
        }

        TEST_DATABASE.write(TEST_DATABASE.STATE_STORE_KEY, (tr: IDBTransaction) => {
            const stateStore = tr.objectStore(TEST_DATABASE.STATE_STORE_KEY);

            const request: IDBRequest = stateStore.put(stateObject);
        });
    }, 1000);

    private validateFunction(code: string): boolean {
        try {
            const stateGenerator = new Function('baseUrl', 'state', code);
        }
        catch(e) {
            console.error(e);

            return false;
        }

        return true;
    }

    private loadFromDatabase(): void {
        TEST_DATABASE.read(TEST_DATABASE.TESTS_STORE_KEY, (tr: IDBTransaction) => {
            const testsStore = tr.objectStore(TEST_DATABASE.TESTS_STORE_KEY);

            testsStore.openCursor().addEventListener('success', (event: any) => {
                const cursor = event.target.result;

                if (cursor) {
                    //filter out deleted tests
                    if (!cursor.value[TEST_DATABASE.DELETED_KEY]) {
                        this.displayTest(cursor.key);
                    }

                    cursor.continue();
                }
            })
        });

        TEST_DATABASE.read(TEST_DATABASE.STATE_STORE_KEY, (tr: IDBTransaction) => {
            const stateStore = tr.objectStore(TEST_DATABASE.STATE_STORE_KEY);

            stateStore.get('default').addEventListener('success', (event: any) => {
                if ('result' in event.target) {
                    console.log(event.target.result);
                }
            });
        });
    }
}