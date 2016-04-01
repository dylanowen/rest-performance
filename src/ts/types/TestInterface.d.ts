/// <reference path="../util/Ajax.d.ts"/>

interface TestResult {
    status: Ajax.STATUS,
    time: number
}

interface TestSettings {
    method?: string,
    url: string,
    data?: any
}