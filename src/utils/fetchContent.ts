import fetch from "node-fetch";
import { URLConfig, mode } from "../config";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
export async function fetchTextContent(keyword: string): Promise<string> {
    // const url = mode.value ? URLConfig.highQuality : URLConfig.***
    const rs = await fetch(URLConfig.highQuality, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "prompt": keyword,
            "device": "hpu"
        }),
    });    
    const rs_json = await rs.json();
    return rs_json.response;
}