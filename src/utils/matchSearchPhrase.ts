import CSConfig, { mode } from "../config";
import { Position, TextDocument, window } from "vscode";

type SearchMatchResult = {
    commentSyntax: string;
    searchPhrase: string;
    insertPosition: Position
};

/**
 * Match the giving string with search pattern
 * @param {string} document
 * @param {number} cursorPosition
 * @returns {SearchMatchResult | undefined} if found, return the search phrase, comment's opening and closing syntax
 */
export function matchSearchPhrase(
    document: TextDocument,
    cursorPosition: Position,
): SearchMatchResult | undefined {
    const languageId = window.activeTextEditor?.document.languageId;
    console.log("language:" + languageId);

    const foundMatch = [...document.getText().matchAll(CSConfig.SEARCH_PATTERN)].find(match => {
        return cursorPosition.isAfterOrEqual(document.positionAt(match.index!)) && 
               cursorPosition.isBeforeOrEqual(document.positionAt(match.index! + match[0].length));
    });

    if (foundMatch) {
        const filteredArray = foundMatch.filter(item => item !== null && item !== undefined && item !== '');
        const [fullMatch, commentSyntax, searchPhrase] = filteredArray;
        return {
            commentSyntax,
            searchPhrase,
            insertPosition: document.positionAt(foundMatch.index! + foundMatch[0].length)
        }
    }

    return undefined;
}
