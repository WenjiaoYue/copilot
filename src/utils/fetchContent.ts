import fetch from "node-fetch";
import { URLConfig, mode } from "../config";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
export async function fetchTextContent(keyword: string): Promise<string> {
    const url = mode.value ? URLConfig.highQuality : URLConfig.fastMode;
    console.log('1', url);
        
    const rs = await fetch(URLConfig.highQuality, {
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
    return rs_json.response;
}


export async function fetchTest(): Promise<string> {
    const url = "https://4f30efea-8c4a-494a-af20-268e77c787c5.mock.pstmn.io/api/test";
        
    const rs = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });    
    const rs_json = await rs.json();
    console.log('12/13 --', rs_json.text);
    
    return rs_json.text;
}