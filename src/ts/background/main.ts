/// <reference path="../types/chrome/chrome-app.d.ts"/>

chrome.app.runtime.onLaunched.addListener(() => {
    chrome.app.window.create('index.html', {
        outerBounds: {
            width: 1300,
            height: 1000
        }
    });
});