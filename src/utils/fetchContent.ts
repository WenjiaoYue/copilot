import fetch from "node-fetch";
import { getConfig, mode } from "../config";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
export async function fetchTextContent(keyword: string): Promise<string> {
    const url = mode.value ? getConfig().settings.hqModeUrl : getConfig().settings.fastModeUrl;
    console.log('mode.value', url);
        
    const rs = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "prompt": keyword,
            "max_new_tokens": 512
        }),
    });    
    const rs_json = await rs.json();
    console.log('rs_json.response', rs_json.response);
    
    return rs_json.response;
}