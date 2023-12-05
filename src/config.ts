import * as vscode from 'vscode';

const CSConfig = {
    SEARCH_PATTERN: /(\/\/|#|--|<!--|\/\*)+(.+)(-->|\*\/)*/,
};

export const mode = { value: true };  
export function getSearchURL(site: string, keyword: string) {
    return `https://www.google.com/search?q=site%3A${site}+${keyword.replace(/\s/g, "+")}`;
}

type IConfig = {
    settings: {
        sites: { [name: string]: boolean },
        maxResults: number
    }
}

export function getConfig() {
    const config = vscode.workspace.getConfiguration("neuralCopilot");    

    const sites = {
        "stackoverflow.com": true,
        "gist.github.com": false
    };

    return {
        settings: {
            sites,
            maxResults: config.settings.maxResults
        }
    } as IConfig;
}

export const URLConfig = (() => {
    const config = vscode.workspace.getConfiguration("neuralCopilot");

    return {
        "highQuality": config.settings.sites.highQuality as string,
    };
})()

export default CSConfig;
