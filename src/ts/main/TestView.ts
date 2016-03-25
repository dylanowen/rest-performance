/// <reference path="./TestDatabase.ts"/>
/// <reference path="./TestRunner.ts"/>

class TestView {
    public elmnt: HTMLElement;

    private dbIndex: number;
    private tests: TestRunner[] = [];

    public constructor(dbIndex: number) {
        this.dbIndex = dbIndex;

        this.elmnt = document.createElement('div');

        //read the data out of the database
        this.getTestObject((result: any) => {
            const stateCode = result[TEST_DATABASE.STATE_CODE_KEY];
            const baseUrls = result[TEST_DATABASE.BASE_URLS_KEY];
            const initialState = result[TEST_DATABASE.INITIAL_STATE_KEY];
            const name = result[TEST_DATABASE.NAME_KEY];
            const threads = result[TEST_DATABASE.THREADS_KEY];

            try {
                const stateGenerator = <StateFunction>new Function('baseUrl', 'state', stateCode);

                this.setup(name, baseUrls, stateGenerator, threads, initialState);
            }
            catch (e) {
                console.error('How did you get here? ' + e);
            }
        })
    }

    private setup(name: string, baseUrls: string[], stateGeneratorBase: StateFunction, threads: number, initialState: any): void {
        

        const h3: HTMLHeadingElement = document.createElement('h3');
        h3.textContent = name;
        this.elmnt.appendChild(h3);

        for (let url of baseUrls) {
            const p: HTMLParagraphElement = document.createElement('p');
            p.className = 'url_title'
            p.textContent = url;
            this.elmnt.appendChild(p);

            const textarea: HTMLTextAreaElement = document.createElement('textarea');
            textarea.className = 'output'
            textarea.style.width = '78%';
            textarea.style.cssFloat = 'left';
            this.elmnt.appendChild(textarea);

            const tarea: HTMLTextAreaElement = document.createElement('textarea');
            tarea.className = 'output'
            tarea.style.width = '18%';
            tarea.style.cssFloat = 'right';
            this.elmnt.appendChild(tarea);

            const stateGenerator = stateGeneratorBase.bind(null, url);
            this.tests.push(new TestRunner(textarea, tarea, stateGenerator, initialState));
        }

        const startButton: HTMLButtonElement = document.createElement('button');
        startButton.textContent = 'Start';
        startButton.style.cssFloat = 'both';
        this.elmnt.appendChild(startButton);
        this.elmnt.appendChild(document.createTextNode(' '));

        const stopButton: HTMLButtonElement = document.createElement('button');
        stopButton.textContent = 'Stop';
        stopButton.style.cssFloat = 'both';
        this.elmnt.appendChild(stopButton);
        this.elmnt.appendChild(document.createTextNode('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'));

        const deleteButton: HTMLButtonElement = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.style.cssFloat = 'both';
        this.elmnt.appendChild(deleteButton);
        
        startButton.addEventListener('click', this.run.bind(this, threads));
        stopButton.addEventListener('click', this.stop.bind(this));
        deleteButton.addEventListener('click', this.remove.bind(this));
        
    }

    private run(threads: number): void {
        this.tests.forEach((test) => test.run(threads));
    }

    private stop(): void {
        this.tests.forEach((test) => test.stop());
    }

    private remove(): void {
        this.tests.forEach((test) => test.stop());

        this.getTestObject((result: any) => {
            //set the test as deleted
            result[TEST_DATABASE.DELETED_KEY] = true;

            TEST_DATABASE.write(TEST_DATABASE.TESTS_STORE_KEY, (tr: IDBTransaction) => {
                const testsStore = tr.objectStore(TEST_DATABASE.TESTS_STORE_KEY);

                testsStore.put(result, this.dbIndex);
            });
        });

        this.elmnt.parentNode.removeChild(this.elmnt);
    }

    private getTestObject(callback: (result: any) => void): void {
        TEST_DATABASE.read(TEST_DATABASE.TESTS_STORE_KEY, (tr: IDBTransaction) => {
            const testsStore = tr.objectStore(TEST_DATABASE.TESTS_STORE_KEY);

            const request: IDBRequest = testsStore.get(this.dbIndex);

            request.addEventListener('success', (event: Event) => {
                //console.log(request, request.result);

                callback(request.result);
            });
        });
    }
}