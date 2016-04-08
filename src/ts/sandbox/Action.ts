/// <reference path="../types/Sandbox.d.ts"/>

abstract class Action<T extends Object, V extends Object> {
    public enum: Sandbox.Action;

    constructor(action: Sandbox.Action) {
        this.enum = action;
    } 

    abstract run(data: T): V;
}