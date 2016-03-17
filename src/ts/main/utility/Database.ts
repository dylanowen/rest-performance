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

        openRequest.addEventListener('upgradeneeded', (event: any) => {
            const dbLink: IDBDatabase = event.target.result;

            dbLink.addEventListener('error', databaseLoadingError);

            this.upgradeEvent(dbLink);
        });
    }

    protected upgradeEvent(dbLink: IDBDatabase): void {}

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