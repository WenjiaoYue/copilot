import fetch from "node-fetch";
import * as https from 'https'
const URL = 'https://talkingphoto.eglb.intel.com/v1/code_generation'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
export async function fetchTextContent(keyword: string): Promise<string> {
    const rs = await fetch(URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "prompt": keyword
        }),
    })
    const rs_json = await rs.json()
    return rs_json.response
}