import * as vscode from 'vscode';

const CSConfig = {
    SEARCH_PATTERN: /(\/\/|#|--|<!--|\/\*)+(.+)(-->|\*\/)*/,
    MULTILINE_END_PATTERN: /(.*)(-->|\*\/)$/
};

export const mode = { value: true };  
export function getSearchURL(site: string, keyword: string) {
    return `https://www.google.com/search?q=site%3A${site}+${keyword.replace(/\s/g, "+")}`;
}

type IConfig = {
    settings: {
        codeChatUrl: string;
        hqModeUrl: string,
        fastModeUrl: string,
        maxResults: number
    }
}

export function getConfig() {
    const config = vscode.workspace.getConfiguration("neuralCopilot");    

    return {
        settings: {
            hqModeUrl: config.settings.sites.highQuality,
            fastModeUrl: config.settings.sites.fastMode,
            codeChatUrl:  config.settings.sites.codeChat,
            maxResults: config.settings.maxResults
        }
    } as IConfig;
}

export const URLConfig = (() => {
    const config = vscode.workspace.getConfiguration("neuralCopilot");

    return {
        "highQuality": config.settings.sites.highQuality as string,
        "fastMode": config.settings.sites.fastMode as string,
        "codeChatUrl": config.settings.sites.codeChat as string,
    };
})();

export default CSConfig;
