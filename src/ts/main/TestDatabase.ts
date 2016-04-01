/// <reference path="../util/Database.ts"/>

const TEST_DATABASE = new (class TestDatabase extends Database {

    private static DATABASE_NAME: string = 'tests';
    private static DATABASE_VERSION: number = 7;

    public TESTS_STORE_KEY: string = 'tests';
    public STATE_STORE_KEY: string = 'state';

    public STATE_PATH: string = 'state';

    public BASE_URLS_KEY: string = 'BASE_URLS';
    public GENERATOR_CODE: string = 'GENERATOR_CODE';
    public NAME_KEY: string = 'NAME';
    public DELETED_KEY: string = 'DELETED';
    public THREADS_KEY: string = 'THREADS';

    constructor() {
        super(TestDatabase.DATABASE_NAME, TestDatabase.DATABASE_VERSION);
    }

    protected upgradeEvent(event: UpgradeEvent): void {
        const db = event.db;

        if (event.oldVersion == 0) {
            console.log('Creating database');

            const testsStore = db.createObjectStore(this.TESTS_STORE_KEY, { autoIncrement: true });

            testsStore.createIndex(this.BASE_URLS_KEY, this.BASE_URLS_KEY, { multiEntry: true, unique: false });
            testsStore.createIndex(this.GENERATOR_CODE, this.GENERATOR_CODE, { unique: false });
            testsStore.createIndex(this.NAME_KEY, this.NAME_KEY, { unique: false });
            testsStore.createIndex(this.DELETED_KEY, this.DELETED_KEY, { unique: false });
            testsStore.createIndex(this.THREADS_KEY, this.THREADS_KEY, { unique: false });

            const stateStore = db.createObjectStore(this.STATE_STORE_KEY, { keyPath: this.STATE_PATH });

            stateStore.createIndex(this.BASE_URLS_KEY, this.BASE_URLS_KEY, { unique: false });
            stateStore.createIndex(this.GENERATOR_CODE, this.GENERATOR_CODE, { unique: false });
        }
        else {
            let oldVersion = event.oldVersion;
            console.log('Upgrading database ' + oldVersion + ' -> ' + TestDatabase.DATABASE_VERSION);

            const testsStore = event.transaction.objectStore(this.TESTS_STORE_KEY);
            const stateStore = event.transaction.objectStore(this.STATE_STORE_KEY);

            if (oldVersion < 3) {
                testsStore.createIndex(this.THREADS_KEY, this.THREADS_KEY, { unique: false });
            }
            //warning this deletes all old things...
            if (oldVersion < 6) {
                testsStore.createIndex(this.GENERATOR_CODE, this.GENERATOR_CODE, { unique: false });
                stateStore.createIndex(this.GENERATOR_CODE, this.GENERATOR_CODE, { unique: false });

                testsStore.deleteIndex('STATE_CODE');
                testsStore.deleteIndex('INITIAL_STATE');
            }
            if (oldVersion < 7) {
                stateStore.deleteIndex('STATE_CODE');
                stateStore.deleteIndex('INITIAL_STATE');
            }
        }
    }
})();