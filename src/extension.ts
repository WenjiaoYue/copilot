import * as vscode from 'vscode';

import { search } from './utils/search';
import { matchSearchPhrase } from './utils/matchSearchPhrase';
import { mode } from './config';
import path = require('path');

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

function updateMenuIcon(context: vscode.ExtensionContext, isExchangeMode: boolean) {
    
    vscode.commands.executeCommand('setContext', 'exchangeModeActive', isExchangeMode);
    vscode.window.setStatusBarMessage(isExchangeMode ? 'NeuralChat: High Quality Mode' : 'NeuralChat: Fast Mode');
}

function updateMenuHint(isExchangeMode: boolean) {

    const menuCommand = 'neuralchat.exchangeMode';
    const menuTitle = isExchangeMode ? 'High Quality Mode' : 'Fast Mode';
    const menuGroup = 'navigation';

    vscode.commands.executeCommand('setContext', 'exchangeModeActive', isExchangeMode);
    vscode.window.setStatusBarMessage(menuTitle);
    vscode.commands.executeCommand('setContext', 'exchangeModeHint', menuTitle);

    vscode.commands.executeCommand('setContext', `menu:${menuCommand}`, true);
    vscode.commands.executeCommand('setContext', `menu:${menuCommand}:${menuGroup}`, true);
}


export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('neuralchat.exchangeMode', () => { 
        mode.value = !mode.value;    
        const showInfoMsg = mode.value ? 'High Quality Mode' : 'Fast Mode';
        vscode.window.showInformationMessage('Exchange Mode activated!',  {
                title: showInfoMsg,
                tooltip: '这是操作按钮1的提示文本'
        });
        updateMenuIcon(context, mode.value);
        updateMenuHint( mode.value);    
    });

    context.subscriptions.push(disposable);

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
