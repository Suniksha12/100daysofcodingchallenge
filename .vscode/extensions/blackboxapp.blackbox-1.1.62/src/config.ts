import * as vscode from 'vscode';

const CSConfig = {
    SEARCH_PATTERN: /(\/\/|#|--|<!--)\s?\s?(.+)\s?(\?|-->)/
};

export function getSearchURL(site: string, keyword: string) {
    return ''
}

type IConfig = {
    settings: {
        sites: { [name: string]: boolean },
        maxResults: number
    }
}

export function getConfig() {
    const sites = {};

    return {
        settings: {
            sites,
            maxResults: 1
        }
    } as IConfig;
}

export default CSConfig;
