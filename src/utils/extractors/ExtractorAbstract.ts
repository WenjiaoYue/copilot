import { getConfig, getSearchURL } from "../../config";
import { FetchPageResult, fetchPageTextContent } from "../fetchPageContent";


export default abstract class ExtractorAbstract {

    abstract name: string;
    abstract URL: string;

    isEnabled() {
        const config = getConfig();
        return true;
    }

    /**
     * Return a list of Source URLs from Google Search's result
     */
    extractURLFromKeyword = (keyword: string): Promise<string[]> => {

        return new Promise((resolve, reject) => {

            fetchPageTextContent(getSearchURL(this.URL, keyword))
                .then(rs => {
                    const regex = new RegExp(`(https://${this.URL}/[a-z0-9-/]+)`, "gi");
                    let urls: RegExpMatchArray | null = rs.textContent.match(regex);
                    if (urls) {
                        resolve(urls.filter((url, i, list) => list.indexOf(url) === i) || [])
                    } else {
                        resolve(urls || [])
                    }
                })
                .catch(reject);
        });
    };

    // Extract snippets from URL content
    abstract extractSnippets: (options: FetchPageResult) => SnippetResult[];
}

export type SnippetResult = {
    votes: number,
    code: string,
    hasCheckMark: boolean,
    sourceURL: string,
}

export type SnippetPageResult = {
    results: SnippetResult[],
    url: string
}
