import pTimeout from "p-timeout";
import { v4 as uuidv4 } from "uuid";
import { createParser } from "eventsource-parser";
import fetch from "node-fetch";

async function* streamAsyncIterable(stream: any) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

interface Options extends RequestInit {
  onMessage: Function;
}

interface Body {
  prompt: string;
  stream?: boolean;
  max_new_tokens?: number;
  conversation_id?: string;
  domain?: string;
  query?: string;
  translated_query?: string;
}


// src / types.ts
var ChatGPTError = class extends Error { };

// src/fetch-sse.ts
async function fetchSSE(url: string, options: Options, fetch2 = fetch) {
  const { onMessage, ...fetchOptions } = options;
  //@ts-ignore
  const res: Response | any = await fetch2(url, fetchOptions);

  if (!res.ok) {

    const reason = await res.text();
    const msg = `Neural Copilot error ${res.status || res.statusText}: ${reason}`;
    const error: any = new ChatGPTError(msg);
    error.statusCode = res.status;
    error.statusText = res.statusText;
    throw error;
  }
  const parser = createParser((event) => {
    if (event.type === "event") {
      onMessage(event.data);
    }
  });

  if (!res.body.getReader) {
    const body = res.body;
    if (!body.on || !body.read) {
      throw new ChatGPTError('unsupported "fetch" implementation');
    }
    body.on("readable", () => {
      let chunk;
      while (null !== (chunk = body.read())) {
        parser.feed(chunk.toString());
      }
    });
  } else {
    for await (const chunk of streamAsyncIterable(res.body)) {
      const str = new TextDecoder().decode(chunk);
      parser.feed(str);
    }
  }
}


export interface ChatGPTSendMessageOptions {
  conversationId?: string;
  parentMessageId?: string;
  messageId?: string;
  action?: string;
  timeoutMs?: number;
  onProgress?: (result: ChatGPTResult) => void;
  abortSignal?: AbortSignal;
  promptPrefix?: string;
}

export interface ChatGPTResult {
  role: string;
  id: string;
  parentMessageId: string;
  conversationId?: string;
  text: string;
}


export async function chatgptSendMessage(this: any, text: string, opts: ChatGPTSendMessageOptions = {}): Promise<ChatGPTResult | any> {
  const {
    conversationId,
    parentMessageId = uuidv4(),
    messageId = uuidv4(),
    action = "next",
    timeoutMs,
    onProgress
  } = opts;

  let { abortSignal } = opts;
  let abortController: AbortController | null = null;

  if (timeoutMs && !abortSignal) {
    abortController = new AbortController();
    abortSignal = abortController.signal;
  }

  const url = "http://10.239.158.137:3000/stream_post";
  // const url = "https://64d7da36-ccd1-4b5e-93ac-55e9ceaa8b0e.mock.pstmn.io/v1/code_generation"
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const headers = {
    Accept: "text/event-stream",
    "Content-Type": "application/json"
  };

  const body: Body = {
    "prompt": text,
    "stream": true,
    "max_new_tokens": 512
  };

  if (conversationId) {
    body.conversation_id = conversationId;
  }

  const result: ChatGPTResult = {
    role: "assistant",
    id: uuidv4(),
    parentMessageId: messageId,
    conversationId,
    text: ""
  };

  const responseP: any = new Promise((resolve, reject) => {
    fetchSSE(
      url,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: abortSignal,
        onMessage: (data: string) => {
          console.log('data', data.startsWith("b") ? data.slice(2, -1) : data);
          if (data === "[DONE]") {
            return resolve(result);
          }
          try {
            result.text = data.startsWith("b") ? data.slice(2, -1) : data;
            if (onProgress) {
              onProgress(result);
            }
          } catch (err) {
            console.log(`err: ${err}`);
          }
        }
      },
      fetch
    ).catch((err) => {
      const errMessageL = err.toString().toLowerCase();
      if (result.text && (errMessageL === "error: typeerror: terminated" || errMessageL === "typeerror: terminated")) {
        return resolve(result);
      } else {
        return reject(err);
      }
    });
  });

  if (timeoutMs) {
    if (abortController) {
      responseP.cancel = () => {
        abortController?.abort();
      };
    }
    // return pTimeout(responseP, timeoutMs, "ChatGPT timed out waiting for response");
  } else {
    return responseP;
  }
}
