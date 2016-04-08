/// <reference path="./TestCreator.ts"/>
/// <reference path="./Sandbox.ts"/>

declare var ace: any;

//global
let SANDBOX_HANDLER: SandboxHandler = null;

const ready = (): void => {
    console.log('ready');

    SANDBOX_HANDLER = new SandboxHandler('sandbox');

    const testContainer: HTMLElement = document.getElementById('tests');

    const codeEditor = ace.edit('code');
    codeEditor.setTheme('ace/theme/solarized_dark');
    codeEditor.getSession().setMode('ace/mode/javascript');

    const baseUrlInput = <HTMLInputElement>document.getElementById('baseUrls');
    const nameInput = <HTMLInputElement>document.getElementById('name');
    const threadsInput = <HTMLInputElement>document.getElementById('threads');
    const createTestButton = <HTMLButtonElement>document.getElementById('createTest');
    
    new TestCreator(testContainer, codeEditor, baseUrlInput, nameInput, threadsInput, createTestButton);
}

if (document.readyState !== 'loading') {
    ready();
}
else {
    document.addEventListener('DOMContentLoaded', ready);
}