import * as vscode from 'vscode';

const CSConfig: {[index: string]: RegExp} = {
    // TypeScript, JavaScript, C++, Java, Go, Swift, Kotlin, Rust, C, C# comments (//, /* */)
    STAR_PATTERN: /(\/\/)([^\n]*)|(\/\*)([\s\S]*?)\*\/\s*/g,

    // Docker, Bash, ruby comments (#)
    POUND_PATTERN: /(#)([^\n]*)/g,

    // Python comments (#, ''' ''' or """ """)
    PYTHON_PATTERN:  /(#)([^\n]*)|('{3})([\s\S]*?)'{3}\s*|("{3})([\s\S]*?)"{3}\s*/g,

     // CSS comments (/* */)
    CSS_PATTERN: /(\/\*)([\s\S]*?)\*\/\s*/g,

     // HTML comments (<!-- -->)
    HTML_PATTERN: /(<!--)([\s\S]*?)-->\s*/g,
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
    }
}

export function getConfig() {
    const config = vscode.workspace.getConfiguration("neuralCopilot");    

    return {
        settings: {
            hqModeUrl: config.settings.sites.highQuality,
            fastModeUrl: config.settings.sites.fastMode,
            codeChatUrl:  config.settings.sites.codeChat,
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
