//This isn't really a real debounce function, but it works for what I want
function Debounce(func: Function, waitTime: number): Function {
    var lastCalled = 0;

    return (): void => {
        if (performance.now() - lastCalled > waitTime) {
            lastCalled = performance.now();
            func();
        }
    }
}