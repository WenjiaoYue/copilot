import * as vscode from 'vscode';

import { search } from './utils/search';
import { matchSearchPhrase } from './utils/matchSearchPhrase';


function debounce(func: Function, delay: number) {
    let timeoutId: NodeJS.Timeout;

    return (...args: any[]) => {
        return new Promise((resolve) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                resolve(func(...args));
            }, delay);
        });
    };
}


export function activate(_: vscode.ExtensionContext) {
    const provider: vscode.CompletionItemProvider = {
        provideInlineCompletionItems: async (document, position, context, token) => {
            const textBeforeCursor = document.getText(
                new vscode.Range(position.with(undefined, 0), position)
            );
    
            const match = matchSearchPhrase(textBeforeCursor);
            let items: any[] = [];
    
            if (match) {
                let rs;
                try {
                    rs = await search(match.searchPhrase);
                    if (rs) {
                        items = rs.results.map(item => {
                            const output = `\n${match.commentSyntax} Source: ${item.sourceURL} ${match.commentSyntaxEnd}\n${item.code}`;
                            return {
                                text: output,
                                insertText: output,
                                range: new vscode.Range(position.translate(0, output.length), position)
                            };
                        });
                    }
                } catch (err: any) {
                    vscode.window.showErrorMessage(err.toString());
                }
            }
    
            return { items };
        }
    };
    
    const debouncedProvider = {
        provideInlineCompletionItems: debounce(
            async (document: vscode.TextDocument, position: vscode.Position) => {
                return provider.provideInlineCompletionItems(document, position, null, null);
            },
            1300 // Adjust the delay time as needed
        )
    };
    
    vscode.languages.registerInlineCompletionItemProvider({ pattern: "**" }, debouncedProvider);
}
