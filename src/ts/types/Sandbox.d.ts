/// <reference path="./TestInterface.d.ts"/>

declare namespace Sandbox {

    export const enum Action {
        ValidateGenerator,
        CreateGenerator,
        RunGenerator
    }

    interface Data {}

    interface Message {
        id: number,
        data: Data
    }

    export namespace In {
        export interface Message extends Sandbox.Message {
            action: Action,
        }

        export interface ValidateGenerator extends Data {
            code: string
        }

        export interface CreateGenerator extends ValidateGenerator {
            baseUrl: string
        }

        export interface RunGenerator extends Data {
            id: number
        }

        export interface DeleteGenerator extends RunGenerator {
            id: number
        }
    }

    export namespace Out {
        export interface Message extends Sandbox.Message { }

        export interface ValidateGenerator extends Data {
            valid: boolean,
            error?: string
        }

        export interface CreateGenerator extends ValidateGenerator {
            id?: number
        }

        export interface RunGenerator extends ValidateGenerator {
            result?: TestSettings,
            done?: boolean
        }

        export interface DeleteGenerator extends Data {
            deleted: boolean
        }
    }
}