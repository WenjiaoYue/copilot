// Adapted from https://github.com/transitive-bullshit/chatgpt-api

/**
 * 
 * MIT License


Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

// src/chatgpt-api.ts
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
async function fetchSSE(url, options, fetch2 = fetch) {
  const { onMessage, ...fetchOptions } = options;
  const res = await fetch2(url, fetchOptions);
  if (!res.ok) {
    const reason = await res.text();
    const msg = `ChatGPT error ${res.status || res.statusText}: ${reason}`;
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
}

export interface ChatGPTResult {
  role: string;
  id: string;
  parentMessageId: string;
  conversationId?: string;
  text: string;
}
export async function chatgptSendMessage(this: any, text: string, opts: ChatGPTSendMessageOptions = {}): Promise<ChatGPTResult> {
  console.log("chatgptSendMessage", text);
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

  // const body = {
  //   action,
  //   messages: [
  //     {
  //       id: messageId,
  //       role: "user",
  //       content: {
  //         content_type: "text",
  //         parts: [text]
  //       }
  //     }
  //   ],
  //   model: 'gpt-3.5-turbo',
  //   parent_message_id: parentMessageId
  // };

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

  const responseP = new Promise((resolve, reject) => {
    // const url = "https://api.openai.com/v1/chat/completions";
    // const headers = {
    //   Authorization: `Bearer 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`,
    //   Accept: "text/event-stream",
    //   "Content-Type": "application/json"
    // };

    const url = "http://10.165.57.68:8000/v1/askdoc/chat";
    const headers = {
      Accept: "text/event-stream",
      "Content-Type": "application/json"
    };

    const body = {
      domain: "ASK_GM",
      query: text,
      translated_query: "Where is the badge office at Zizhu site?"
    };

    fetchSSE(
      url,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: abortSignal,
        onMessage: (data: string) => {
          console.log('data', data);
          
          var _a, _b, _c;
          if (data === "[DONE]") {
            return resolve(result);
          }
          try {
            const convoResponseEvent = JSON.parse(data);
            // if (convoResponseEvent.conversation_id) {
            //   result.conversationId = convoResponseEvent.conversation_id;
            // }
            // if ((_a = convoResponseEvent.message) == null ? void 0 : _a.id) {
            //   result.id = convoResponseEvent.message.id;
            // }
            const message = convoResponseEvent;
            if (message) {
              let text2 = message;
              if (text2) {
                result.text = text2;
                if (onProgress) {
                  onProgress(result);
                }
              }
            }
          } catch (err) {
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
//# sourceMappingURL=index.js.map