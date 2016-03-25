/// <reference path="../util/Ajax.d.ts"/>

interface TestResult {
    threadId: number,
    url: string,
    status: Ajax.STATUS,
    time: number
}

interface TestSettings {
    method?: string,
    requestUrl: string,
    data?: any
}