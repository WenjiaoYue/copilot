import { log } from "console";
import CSConfig, { mode } from "../config";
import { Position, TextDocument, window } from "vscode";

type SearchMatchResult = {
    commentSyntax: string;
    searchPhrase: string;
    // insertPosition: Position
};

function matchLanguageId(languageId: string | undefined): string {
    const languageMap = new Map<string | undefined, string>([
        ["typescript", "STAR_PATTERN"],
        ["javascript", "STAR_PATTERN"],
        ["cpp", "STAR_PATTERN"],
        ["java", "STAR_PATTERN"],
        ["go", "STAR_PATTERN"],
        ["swift", "STAR_PATTERN"],
        ["kotlin", "STAR_PATTERN"],
        ["rust", "STAR_PATTERN"],
        ["c", "STAR_PATTERN"],
        ["csharp", "STAR_PATTERN"],
        ["dockerfile", "POUND_PATTERN"],
        ["bash", "POUND_PATTERN"],
        ["ruby", "POUND_PATTERN"],
        ["python", "PYTHON_PATTERN"],
        ["css", "CSS_PATTERN"],
        ["html", "HTML_PATTERN"],
        [undefined, "No match found"]
    ]);

    return languageMap.get(languageId) || "No match found";
}


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

    const search_pattern = matchLanguageId(languageId);
    

    const foundMatch = [...document.getText().matchAll(CSConfig[search_pattern])].find(match => {        
        return cursorPosition.isAfterOrEqual(document.positionAt(match.index!)) && 
               cursorPosition.isBeforeOrEqual(document.positionAt(match.index! + match[0].length));
    });
    let singleSearchContent = "";    

    if (foundMatch) {
        const filteredArray = foundMatch.filter(item => item !== null && item !== undefined && item !== '');
        const [fullMatch, commentSyntax, _searchPhrase] = filteredArray;

        // if singleLine
        if (foundMatch[1]) {
            // Extract the content of the comment  
            let currentLine = cursorPosition.line;
            singleSearchContent += _searchPhrase;
             
            while (currentLine > 0) {
                const previousLine = currentLine - 1;
                const previousLineText = document.lineAt(previousLine).text; 

                if (previousLineText.trim().startsWith(foundMatch[1])) {
                    const previousLineExtract = previousLineText.replace(/\/\/|#/g, '').trim();
                    console.log('previousLineExtract', previousLineExtract);
                    singleSearchContent = previousLineExtract + ' ' + singleSearchContent;

                    currentLine--;
                } else {
                    
                    break;
                }
            }
        }
        const searchPhrase = singleSearchContent !== "" ? singleSearchContent : _searchPhrase;
        console.log('searchPhrase', searchPhrase);
        
      
        return {
            commentSyntax,
            searchPhrase,
            // insertPosition: document.positionAt(foundMatch.index! + foundMatch[0].length)
        };
    }

    return undefined;
}
