/// <reference path="./TestDatabase.ts"/>
/// <reference path="./TestRunner.ts"/>
/// <reference path="./Sandbox.ts"/>

class TestView {
    public elmnt: HTMLElement;

    private dbIndex: number;
    private tests: TestRunner[] = [];

    public constructor(dbIndex: number) {
        this.dbIndex = dbIndex;

        this.elmnt = document.createElement('div');

        //read the data out of the database
        this.getTestObject((result: any) => {
            const generatorCode = result[TEST_DATABASE.GENERATOR_CODE];
            const baseUrls = result[TEST_DATABASE.BASE_URLS_KEY];
            const name = result[TEST_DATABASE.NAME_KEY];
            const threads = result[TEST_DATABASE.THREADS_KEY];

            //console.log(result);

            this.setup(name, baseUrls, generatorCode, threads);
        })
    }

    private setup(name: string, baseUrls: string[], generatorCode: string, threads: number): void {
        const testIteratorGetter: TestIteratorGetter = SANDBOX_HANDLER.createGenerator.bind(SANDBOX_HANDLER, generatorCode);

        //setup the header
        const h3: HTMLHeadingElement = document.createElement('h3');
        h3.textContent = name + ' ';
        const sourceButton: HTMLButtonElement = document.createElement('button');
        sourceButton.textContent = 'Source';
        h3.appendChild(sourceButton);

        this.elmnt.appendChild(h3);

        //setup the main view
        const mainViewDiv = document.createElement('div');
        for (let url of baseUrls) {
            const p: HTMLParagraphElement = document.createElement('p');
            p.className = 'url_title'
            p.textContent = url;
            mainViewDiv.appendChild(p);

            const textarea: HTMLTextAreaElement = document.createElement('textarea');
            textarea.className = 'output'
            textarea.style.width = '78%';
            textarea.style.cssFloat = 'left';
            mainViewDiv.appendChild(textarea);

            const tarea: HTMLTextAreaElement = document.createElement('textarea');
            tarea.className = 'output'
            tarea.style.width = '18%';
            tarea.style.cssFloat = 'right';
            mainViewDiv.appendChild(tarea);

            this.tests.push(new TestRunner(textarea, tarea, testIteratorGetter.bind(SANDBOX_HANDLER, url)));
        }
        this.elmnt.appendChild(mainViewDiv);

        //setup the source view
        const sourceViewDiv = document.createElement('div');
        sourceViewDiv.style.display = 'none';

        const sourceView = document.createElement('pre');
        sourceView.className = 'editor';
        sourceView.textContent = generatorCode;
        sourceViewDiv.appendChild(sourceView);

        this.elmnt.appendChild(sourceViewDiv);

        //setup the footer
        const footer: HTMLDivElement = document.createElement('div');
        footer.style.clear = 'both';

        const startButton: HTMLButtonElement = document.createElement('button');
        startButton.textContent = 'Start';
        footer.appendChild(startButton);
        footer.appendChild(document.createTextNode(' '));

        const stopButton: HTMLButtonElement = document.createElement('button');
        stopButton.textContent = 'Stop';
        footer.appendChild(stopButton);
        footer.appendChild(document.createTextNode('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'));

        const deleteButton: HTMLButtonElement = document.createElement('button');
        deleteButton.textContent = 'Delete';
        footer.appendChild(deleteButton);

        this.elmnt.appendChild(footer);
        
        let codeViewerReady = false;
        sourceButton.addEventListener('click', () => {
            if (sourceViewDiv.style.display == 'none') {
                if (codeViewerReady === false) {
                    const codeViewer: any = ace.edit(sourceView);
                    codeViewer.setTheme('ace/theme/solarized_dark');
                    codeViewer.getSession().setMode('ace/mode/javascript');
                }

                mainViewDiv.style.display = 'none';
                sourceViewDiv.style.display = '';
            }
            else {
                mainViewDiv.style.display = '';
                sourceViewDiv.style.display = 'none';
            }
        });
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