import CSConfig, { mode } from "../config";
import { window } from "vscode";
import { isComment } from "./checkComments";

type SearchMatchResult = {
    commentSyntax: string;
    commentSyntaxEnd: string;
    searchPhrase: string;
};

/**
 * Match the giving string with search pattern
 * @param {string} input
 * @returns {SearchMatchResult | undefined} if found, return the search phrase, comment's opening and closing syntax
 */
export function matchSearchPhrase(
    input: string
): SearchMatchResult | undefined {
    const languageId = window.activeTextEditor?.document.languageId;
    console.log("input:" + input + " language:" + languageId);
    const match = CSConfig.SEARCH_PATTERN.exec(input);
    console.log("match: " + match);

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
                searchPhrase: `${searchPhrase}`,
            };
        }
        return matchValue;
    }

    return undefined;
}
