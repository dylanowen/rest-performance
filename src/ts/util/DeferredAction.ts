class DeferredAction {
    private ready: boolean = false;
    private actions: Function[] = [];

    public readyEvent() {
        this.ready = true;

        for (let action of this.actions) {
            action();
        }
    }

    public call(action: Function) {
        if (this.ready) {
            action();
        }
        else {
            this.actions.push(action);
        }
    }
}