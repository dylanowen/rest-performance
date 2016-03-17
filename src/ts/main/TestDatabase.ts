/// <reference path="./utility/Database.ts"/>

const TEST_DATABASE = new (class TestDatabase extends Database {

    private static DATABASE_NAME: string = 'tests';
    private static DATABASE_VERSION: number = 1;

    public TESTS_STORE_KEY: string = 'tests';
    public STATE_STORE_KEY: string = 'state';

    private STATE_PATH: string = 'state';

    public BASE_URLS_KEY: string = 'BASE_URLS';
    public STATE_CODE_KEY: string = 'STATE_CODE';
    public INITIAL_STATE_KEY: string = 'INITIAL_STATE';
    public NAME_KEY: string = 'NAME';
    public DELETED_KEY: string = 'DELETED';

    constructor() {
        super(TestDatabase.DATABASE_NAME, TestDatabase.DATABASE_VERSION);
    }

    protected upgradeEvent(dbLink: IDBDatabase): void {
        if (TestDatabase.DATABASE_VERSION == dbLink.version) {
            console.log('Creating database');

            const testsStore = dbLink.createObjectStore(this.TESTS_STORE_KEY, { autoIncrement: true });

            testsStore.createIndex(this.BASE_URLS_KEY, this.BASE_URLS_KEY, { multiEntry: true, unique: false });
            testsStore.createIndex(this.STATE_CODE_KEY, this.STATE_CODE_KEY, { unique: false });
            testsStore.createIndex(this.INITIAL_STATE_KEY, this.INITIAL_STATE_KEY, { unique: false });
            testsStore.createIndex(this.NAME_KEY, this.NAME_KEY, { unique: false });
            testsStore.createIndex(this.DELETED_KEY, this.DELETED_KEY, { unique: false });

            const stateStore = dbLink.createObjectStore(this.STATE_STORE_KEY, { keyPath: this.STATE_PATH });

            stateStore.createIndex(this.BASE_URLS_KEY, this.BASE_URLS_KEY, { unique: false });
            stateStore.createIndex(this.STATE_CODE_KEY, this.STATE_CODE_KEY, { unique: false });
            stateStore.createIndex(this.INITIAL_STATE_KEY, this.INITIAL_STATE_KEY, { unique: false });
        }
        else {
            console.log('Upgrading database ' + dbLink.version + ' -> ' + TestDatabase.DATABASE_VERSION);
        }
    }
})();