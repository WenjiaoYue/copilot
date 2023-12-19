import * as vscode from 'vscode';
import ChatGptViewProvider from './chatgpt-view-provider';


import { search } from './utils/search';
import { matchSearchPhrase } from './utils/matchSearchPhrase';
import { mode } from './config';

function debounce(func: Function, delay: number): any {
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


function updateMenuHint(isExchangeMode: boolean) {
    const menuTitle = isExchangeMode ? '$(copilot) NeuralCopilot: High Quality Mode' : '$(copilot) NeuralCopilot: Fast Mode';
    vscode.commands.executeCommand('setContext', 'exchangeModeActive', isExchangeMode);
    vscode.window.setStatusBarMessage(menuTitle);
}


export function activate(context: vscode.ExtensionContext) {
    const view = vscode.window.registerWebviewViewProvider(
        "vscode-chatgpt.view",
        new ChatGptViewProvider(context),
        {
            webviewOptions: {
                retainContextWhenHidden: true,
            },
        }
    );

    const disposable = vscode.commands.registerCommand('NeuralCopilot.exchangeMode', () => {
        mode.value = !mode.value;
        const showInfoMsg = mode.value ? 'High Quality Mode Activated!' : 'Fast Mode Activated!';
        vscode.window.showInformationMessage(showInfoMsg);
        updateMenuHint(mode.value);
    });

    let paste = vscode.commands.registerCommand('NeuralCopilot.paste', () => {
        vscode.commands.executeCommand('editor.action.clipboardPasteAction');
    });


    context.subscriptions.push(view, disposable, paste);

    const provider: vscode.CompletionItemProvider | any = {
        provideInlineCompletionItems: async (document: any, position: any, context: any, token: any) => {
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
                            // const output = `\n${match.commentSyntax} Source: ${item.sourceURL} ${match.commentSyntaxEnd}\n${item.code}`;
                            console.log('item', item.code);

                            const output = `\n${item.code}`;
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

    const debouncedProvider: any = {
        provideInlineCompletionItems: debounce(
            async (document: vscode.TextDocument, position: vscode.Position) => {
                return provider.provideInlineCompletionItems(document, position, null, null);
            },
            1300 // Adjust the delay time as needed
        )
    };

    vscode.languages.registerInlineCompletionItemProvider({ pattern: "**" }, debouncedProvider);
}
