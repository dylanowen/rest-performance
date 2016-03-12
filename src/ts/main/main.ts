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

    const inputEditor = ace.edit('startInput');
    inputEditor.setTheme('ace/theme/solarized_dark');
    inputEditor.getSession().setMode('ace/mode/json');

    const baseUrlInput = <HTMLInputElement>document.getElementById('baseUrl');
    const nameInput = <HTMLInputElement>document.getElementById('name');
    const createTestButton = <HTMLButtonElement>document.getElementById('createTest');

    new TestCreator(testContainer, codeEditor, inputEditor, baseUrlInput, nameInput, createTestButton);
}

if (document.readyState !== 'loading') {
    ready();
}
else {
    document.addEventListener('DOMContentLoaded', ready);
}