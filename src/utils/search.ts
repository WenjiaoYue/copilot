import { SnippetResult } from "./extractors/ExtractorAbstract";


import * as vscode from 'vscode';
import { fetchTextContent } from "./fetchContent";

/**
 * Cache results to avoid VSCode keep refetching
 */
const cachedResults: { [keyword: string]: SnippetResult[] } = {};


// Send search query to google, get answers from stackoverflow
// then extract and return code results
export async function search(keyword: string): Promise<null | { results: SnippetResult[] }> {


    if (keyword in cachedResults) {
        return Promise.resolve({ results: cachedResults[keyword] });
    }


    /* eslint "no-async-promise-executor": "off" */
    const promise = new Promise<{ results: SnippetResult[] }>(async (resolve, reject) => {

        let results: SnippetResult[] = [];

        try {
            // back_end api
            const result = await fetchTextContent(keyword);

            results.push({
                votes: 1,
                code: result,
                hasCheckMark: true,
                sourceURL: ''
            });


            cachedResults[keyword] = results;

            resolve({ results });
        } catch (err) {
            reject(err);
        }

        // When promise resolved, show finished loading for 5 seconds
        vscode.window.setStatusBarMessage(`$(copilot) NeuralCopilot: Finished loading ${results.length} results`);
    });

    vscode.window.setStatusBarMessage(`$(sync~spin) NeuralCopilot: Start loading snippet results...`, promise);
    return promise;
}


export async function completeCode(aboveText: string) {
    // back_end api
    return await fetchTextContent(aboveText);
}