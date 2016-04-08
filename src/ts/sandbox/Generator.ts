/// <reference path="../types/Sandbox.d.ts"/>
/// <reference path="../types/TestInterface.d.ts"/>

/// <reference path="./Action.ts"/>

type TestIterator = Iterator<TestSettings>

interface TestGenerator {
    (): TestIterator
}

namespace Generator {
    const generatorMap: GeneratorMap = {};
    let generatorId = 1;

    interface GeneratorMap {
        [id: number]: TestIterator
    }

    interface TestGeneratorGetter {
        (baseUrl: string): TestGenerator
    }

    abstract class GeneratorAction<T extends Object, V extends Object> extends Action<T, V> {
        protected evalGenerator(code: string): TestGeneratorGetter {
            return <TestGeneratorGetter>new Function('baseUrl', code);
        }
    }

    export class Validate extends GeneratorAction<Sandbox.In.ValidateGenerator, Sandbox.Out.ValidateGenerator> {
        constructor() {
            super(Sandbox.Action.ValidateGenerator);
        }

        run(data: Sandbox.In.ValidateGenerator): Sandbox.Out.ValidateGenerator {
            try {
                this.evalGenerator(data.code);
            }
            catch (e) {
                console.error(e);

                return {
                    valid: false,
                    error: e
                };
            }

            return {
                valid: true
            };
        }
    }

    export class Create extends GeneratorAction<Sandbox.In.CreateGenerator, Sandbox.Out.CreateGenerator> {
        constructor() {
            super(Sandbox.Action.CreateGenerator);
        }

        run(data: Sandbox.In.CreateGenerator): Sandbox.Out.CreateGenerator {
            let id = -1;

            try {
                id = generatorId++;

                generatorMap[id] = this.evalGenerator(data.code)(data.baseUrl)();
            }
            catch (e) {
                console.error(e);

                return {
                    valid: false,
                    error: e
                };
            }

            return {
                valid: true,
                id: id
            }
        }
    }

    export class Run extends Action<Sandbox.In.RunGenerator, Sandbox.Out.RunGenerator> {
        constructor() {
            super(Sandbox.Action.RunGenerator)
        }

        run(data: Sandbox.In.RunGenerator): Sandbox.Out.RunGenerator {
            if (data.id in generatorMap) {
                const generator: TestIterator = generatorMap[data.id];
                const value: TestSettings = generator.next().value;
                let done = false;

                //cleanup our generator if we're done
                if (value === null) {
                    delete generatorMap[data.id];
                    done = true;
                }

                return {
                    valid: true,
                    result: value,
                    done: done
                }
            }

            return {
                valid: false,
                error: 'Could not find id ' + data.id + ' in generator map'
            }
        }
    }

    export function getAll(): Action<any, any>[] {
        return [new Validate(), new Create(), new Run()]
    }
}