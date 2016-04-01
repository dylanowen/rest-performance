/// <reference path="./TestCreator.ts"/>

interface RequestDef {
    count: number
}

declare var ace: any;

const ready = (): void => {
    console.log('ready');

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