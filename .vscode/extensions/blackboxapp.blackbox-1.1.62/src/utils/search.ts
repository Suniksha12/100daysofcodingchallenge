import SnippetExtractors from "./extractors";
import { SnippetResult } from "./extractors/ExtractorAbstract";

import { FetchPageResult, fetchPageTextContent } from "./fetchPageContent";

import * as vscode from 'vscode';
import { getConfig } from "../config";
import fetch from 'node-fetch';

/**
 * Cache results to avoid VSCode keep refetching
 */
const cachedResults: { [keyword: string]: SnippetResult[] } = {};



export async function search(keyword: string, userId: any): Promise<null | { results: SnippetResult[] }> {

    // console.log('>> Search input: ', keyword)
    if (keyword in cachedResults) {
        return Promise.resolve({results: cachedResults[keyword]});
    }

    const config = getConfig();

    /* eslint "no-async-promise-executor": "off" */
    const promise = new Promise<{ results: SnippetResult[] }>(async (resolve, reject) => {

        let results: SnippetResult[] = [];
        let fetchResult: FetchPageResult;

        try {
            // for (const i in SnippetExtractors) {
            //     const extractor = SnippetExtractors[i];

            //     if (extractor.isEnabled()) {
            //         const urls = await extractor.extractURLFromKeyword(keyword);

            //         for (const y in urls) {
            //             fetchResult = await fetchPageTextContent(urls[y]);
            //             results = results.concat(extractor.extractSnippets(fetchResult));

            //             vscode.window.setStatusBarMessage(`${extractor.name} (${y}/${urls.length}): ${results.length} results`, 2000);

            //             if (results.length >= config.settings.maxResults) {
            //                 break;
            //             }
            //         }

            //         if (results.length >= config.settings.maxResults) {
            //             break;
            //         }
            //     }
            // }

            const response = await fetch('https://www.useblackbox.io/autocomplete', {
                method: 'POST',
                body: JSON.stringify({
                    userId: userId,
                    textInput: keyword,
                    source: "visual studio"
                }),
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            });
            const result = await response.json()
            // console.log('API result is: ', JSON.stringify(result, null, 4));

            // console.log('>>API Results: ', result.response)
            var codeReturned = result.response
            results =  [{
                code: codeReturned,
                hasCheckMark: false,
                sourceURL: "",
                votes: 0
            }]

            cachedResults[keyword] = results;

            resolve({results});
        } catch (err) {
            reject(err);
        }

        // When promise resolved, show finished loading for 5 seconds
        vscode.window.setStatusBarMessage(`Blackbox`);
    });

    vscode.window.setStatusBarMessage(`Blackbox Searching...`, promise);
    return promise;
}
