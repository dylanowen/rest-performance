/// <reference path="./DeferredAction.ts"/>

interface DatabaseTransaction {
    (transaction: IDBTransaction): void
}

interface TransactionComplete {
    (ev: Event, useCapture?: boolean): void
}

interface TransactionError {
    (ev: ErrorEvent, useCapture?: boolean): void
}

//a convenience interface to correctly type the version change event
interface UpgradeEvent {
    oldVersion: number,
    db: IDBDatabase,
    transaction: IDBTransaction,
    request: IDBOpenDBRequest
}

class Database {

    protected openDb: DeferredAction;
    protected db: IDBDatabase;

    constructor(name: string, version: number) {

        this.openDb = new DeferredAction();

        const openRequest: IDBOpenDBRequest = indexedDB.open(name, version);

        openRequest.addEventListener('success', (event: any) => {
            console.log('Database ready');

            this.db = event.target.result;

            this.openDb.readyEvent();
        });

        const databaseLoadingError = (event: Event) => {
            console.error('Error loading database', event);
        };

        openRequest.addEventListener('error', databaseLoadingError);

        openRequest.addEventListener('upgradeneeded', (event: IDBVersionChangeEvent) => {
            const request: IDBOpenDBRequest = <IDBOpenDBRequest>event.target;

            const upgrade: UpgradeEvent = {
                oldVersion: event.oldVersion,
                db: request.result,
                transaction: request.transaction,
                request: request
            }

            upgrade.db.addEventListener('error', databaseLoadingError);

            this.upgradeEvent(upgrade);
        });
    }

    protected upgradeEvent(event: UpgradeEvent): void { }

    public write = this.databaseAction.bind(this, 'readwrite');

    public read = this.databaseAction.bind(this, 'readonly');

    private databaseAction(type: 'readonly' | 'readwrite', stores: string[] | string, action: DatabaseTransaction, callback?: TransactionComplete, error?: TransactionError): void {
        //defer the database action
        this.openDb.call(() => {
            const transaction: IDBTransaction = this.db.transaction(stores, type);

            action(transaction);

            transaction.addEventListener('complete', callback);
            transaction.addEventListener('error', (event: ErrorEvent) => {
                console.error('Database transaction error', event);

                callback(event);
            });
        });
    }
}