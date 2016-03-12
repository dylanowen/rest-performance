/// <reference path="./Test.ts"/>

class TestCreator {
    private testContainer: HTMLElement;
    private codeInput: any;
    private inputInput: any;
    private baseUrlInput: HTMLInputElement;
    private nameInput: HTMLInputElement;

    //http://jsfiddle.net/bzwheeler/btsxgena/
    public constructor(testsContainer: HTMLElement, codeInput: any, inputInput: any, baseUrlInput: HTMLInputElement, nameInput: HTMLInputElement, createTestButton: HTMLButtonElement) {
        this.testContainer = testsContainer;
        this.codeInput = codeInput;
        this.inputInput = inputInput;
        this.baseUrlInput = baseUrlInput;
        this.nameInput = nameInput;

        console.log(codeInput, inputInput);

        createTestButton.addEventListener('click', this.createTest.bind(this));
    }

    private createTest(): void {
        const code = this.codeInput.getValue();
        const input = this.inputInput.getValue();
        const baseUrl = this.baseUrlInput.value;
        const name = this.nameInput.value;

        try {
            const genFunct = new Function('baseUrl', 'input', code).bind(null, baseUrl);

            //try to parse the json input
            let startInput: any;
            try {
                startInput = JSON.parse(input);
            }
            catch (e) {
                startInput = input;
            }

            const { testElmnt, textarea, deleteButton, goButton } = this.createTestElmnt(name);

            const test: Test = new Test(testElmnt, textarea, deleteButton, goButton, genFunct, startInput);

            this.testContainer.appendChild(testElmnt);
        } catch(e) {
            console.error(e);
            alert('Bad Code: ' +  e);
        }

        

        console.log(code, input, baseUrl, name);
    }

    private createTestElmnt(name: string): { testElmnt: HTMLElement, textarea: HTMLTextAreaElement, deleteButton: HTMLButtonElement, goButton: HTMLButtonElement } {
        const div: HTMLDivElement = document.createElement('div');
        
        const h3: HTMLHeadingElement = document.createElement('h3');
        h3.textContent = name;
        div.appendChild(h3);

        const textarea: HTMLTextAreaElement = document.createElement('textarea');
        textarea.style.height = '200px';
        textarea.style.width = '100%';
        div.appendChild(textarea);

        const deleteButton: HTMLButtonElement = document.createElement('button');
        deleteButton.textContent = 'Delete';
        div.appendChild(deleteButton);

        const goButton: HTMLButtonElement = document.createElement('button');
        goButton.textContent = 'Go';
        div.appendChild(goButton);

        return {
            testElmnt: div,
            textarea: textarea,
            deleteButton: deleteButton,
            goButton: goButton
        }
    }
}