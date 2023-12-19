import CSConfig, { mode } from "../config";
import { window } from "vscode";

type SearchMatchResult = {
    commentSyntax: string;
    commentSyntaxEnd: string;
    searchPhrase: string;
};

/**
 * Match the giving string with search pattern
 * @param {string} inLineTextBeforeCursor
 * @param {string} allTextBeforeCursor
 * @returns {SearchMatchResult | undefined} if found, return the search phrase, comment's opening and closing syntax
 */
export function matchSearchPhrase(
    inLineTextBeforeCursor: string,
    allTextBeforeCursor: string,
): SearchMatchResult | undefined {
    const languageId = window.activeTextEditor?.document.languageId;
    console.log("input:" + inLineTextBeforeCursor + " language:" + languageId);
    let match = CSConfig.SEARCH_PATTERN.exec(inLineTextBeforeCursor);
    console.log("match: " + match);

    // match one line
    if (match && match.length > 2) {
        const [matchContent, commentSyntax, searchPhrase, commentSyntaxEnd] = match;

        // if fast Mode, searchPhrase is searchPhrase
        // if high Quality, searchPhrase is searchPhrase
        let matchValue;
        if (mode.value) {
            matchValue = {
                commentSyntax,
                commentSyntaxEnd,
                searchPhrase: `${matchContent}`,
            };
        } else {
            matchValue = {
                commentSyntax,
                commentSyntaxEnd,
                searchPhrase,
            };
        }
        return matchValue;
    }

    match = CSConfig.MULTILINE_END_PATTERN.exec(inLineTextBeforeCursor)

    if (match && match.length >= 2) {
        const commentSyntaxEnd = match[2]
        const syntaxEnd2StartMap: {[index: string]: string} = {
            "-->": "<!--",
            "*/": "/*"
        }
        const commentSyntax = syntaxEnd2StartMap[commentSyntaxEnd]
        const idx = allTextBeforeCursor.lastIndexOf(commentSyntax)
        if (idx === -1) return undefined
        const searchPhrase = allTextBeforeCursor.substring(idx + commentSyntax.length, allTextBeforeCursor.length - commentSyntaxEnd.length)
        return {
            commentSyntax,
            commentSyntaxEnd,
            searchPhrase,
        };
    }
    return undefined;
}
