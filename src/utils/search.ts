import SnippetExtractors from "./extractors";
import { SnippetResult } from "./extractors/ExtractorAbstract";

import { FetchPageResult, fetchPageTextContent } from "./fetchPageContent";

import * as vscode from 'vscode';
import { getConfig, mode } from "../config";
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

    const config = getConfig();

    /* eslint "no-async-promise-executor": "off" */
    const promise = new Promise<{ results: SnippetResult[] }>(async (resolve, reject) => {

        let results: SnippetResult[] = [];
        let fetchResult: FetchPageResult;

        try {
            if (mode.value) {
                // back_end api
                const result = await fetchTextContent(keyword);

                results.push({
                    votes: 1,
                    code: result,
                    hasCheckMark: true,
                    sourceURL: ''
                });
            } else {
                for (const i in SnippetExtractors) {
                    const extractor = SnippetExtractors[i];

                    if (extractor.isEnabled()) {
                        const urls = await extractor.extractURLFromKeyword(keyword);

                        for (const y in urls) {
                            console.log('urls', urls);
                            
                            fetchResult = await fetchPageTextContent(urls[y]);
                            results = results.concat(extractor.extractSnippets(fetchResult));
                            console.log('results', results);
                            
                            vscode.window.setStatusBarMessage(`NeuralCopilot: ${extractor.name} (${y}/${urls.length}): ${results.length} results`, 2000);

                            if (results.length >= config.settings.maxResults) {
                                break;
                            }
                        }

                        if (results.length >= config.settings.maxResults) {
                            break;
                        }
                    }
                }

            }

            cachedResults[keyword] = results;

            resolve({ results });
        } catch (err) {
            reject(err);
        }

        // When promise resolved, show finished loading for 5 seconds
        // vscode.window.setStatusBarMessage(`$(sync~spin) NeuralCopilot: Finished loading ${results.length} results`);
        vscode.window.setStatusBarMessage(` NeuralCopilot: Finished loading ${results.length} results`);
    });

    vscode.window.setStatusBarMessage(` NeuralCopilot: Start loading snippet results...`, promise);
    // vscode.window.setStatusBarMessage(`$(sync~spin) NeuralCopilot: Start loading snippet results...`, promise);
    return promise;
}
