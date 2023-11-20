import CSConfig from "../config";
import { window } from "vscode";
import { isComment } from './checkComments';


type SearchMatchResult = {
    commentSyntax: string,
    commentSyntaxEnd: string,
    searchPhrase: string,
}

/**
 * Match the giving string with search pattern
 * @param {string} input
 * @returns {SearchMatchResult | undefined} if found, return the search phrase, comment's opening and closing syntax
 */
export function matchSearchPhrase(input: string): SearchMatchResult | undefined {
    const languageId = window.activeTextEditor?.document.languageId;
    console.log("input:"+input+" language:"+languageId);
    const match = CSConfig.SEARCH_PATTERN.exec(input);
    console.log("match: "+match);

    if (match && match.length > 2) {

        const [_, commentSyntax, searchPhrase, commentSyntaxEnd] = match;       
        return {
            commentSyntax,
            commentSyntaxEnd,
            searchPhrase: `${searchPhrase} ${languageId}`
        };
    }

    return undefined;
}