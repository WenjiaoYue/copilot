import pTimeout from "p-timeout";
import { v4 as uuidv4 } from "uuid";
import { createParser } from "eventsource-parser";
import fetch from "node-fetch";


async function* streamAsyncIterable(stream) {
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

// src / types.ts
var ChatGPTError = class extends Error {
};

// src/fetch-sse.ts
async function fetchSSE(url: string, options: object, fetch2 = fetch) {
  const { onMessage, ...fetchOptions } = options;
  const res = await fetch2(url, fetchOptions);

  if (!res.ok) {

    const reason = await res.text();
    const msg = `Neural Copilot error ${res.status || res.statusText}: ${reason}`;
    const error = new ChatGPTError(msg, { cause: reason });
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
  promptPrefix?:string;
}

export interface ChatGPTResult {
  role: string;
  id: string;
  parentMessageId: string;
  conversationId?: string;
  text: string;
}


interface Body {
  prompt?: string;
  stream?: boolean;
  max_new_tokens?: number;
  conversation_id?: string;
  domain?: string;
  query?: string;
  translated_query?: string;
}


export async function chatgptSendMessage(this: any, text: string, opts: ChatGPTSendMessageOptions = {}): Promise<ChatGPTResult> {
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

  // const url = "https://api.openai.com/v1/chat/completions";
  // const headers = {
  //   Authorization: `Bearer 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`,
  //   Accept: "text/event-stream",
  //   "Content-Type": "application/json"
  // };

  const url = "http://10.165.57.68:8000/v1/askdoc/chat";
  // const url = "https://askgm.eglb.intel.com/v1/textchat/chat";
  // const url = "https://talkingphoto.eglb.intel.com/v1/code_chat";
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const headers = {
    Accept: "text/event-stream",
    "Content-Type": "application/json"
  };

  const body: Body = {
    domain: "ASK_GM",
    query: text,
    translated_query: "Where is the badge office at Zizhu site?"
  };
  // const body: Body = {
  //   "prompt": text,
  //   "stream": true,
  //   "max_new_tokens": 256
  // };
  // const body = {prompt: "def print_hello_world():"};

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
          console.log('data', data);
          if (data === "[DONE]") {
            return resolve(result);
          }
          try {
            result.text = data;
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

    import('p-timeout').then((pTimeout) => {
      return pTimeout(responseP, timeoutMs, "ChatGPT timed out waiting for response");
    }).catch((error) => {
    });
  } else {
    return responseP;
  }
}
