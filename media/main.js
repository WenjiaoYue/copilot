(function () {
    const vscode = acquireVsCodeApi();

    marked.setOptions({
        renderer: new marked.Renderer(),
        pedantic: false,
        gfm: true,
        breaks: true,
        sanitize: false,
        smartypants: false,
        xhtml: false
    });

    const aiSvg = `
    <svg t="1700643324811"  viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1538" class="ml-1 w-4 mr-2"><path d="M810.688 82.624a62.08 62.08 0 0 1 0 86.592l-54.848 55.936h56.128c99.456 0 180.032 82.304 180.032 183.744v367.36c0 101.504-80.64 183.744-180.032 183.744H212.032C112.512 960 32 877.76 32 776.32V408.96c0-101.504 80.64-183.68 180.032-183.68h55.936l-54.784-56A62.08 62.08 0 0 1 212.48 81.92a59.136 59.136 0 0 1 85.632 0.768l127.296 129.92c3.776 3.84 6.912 8.064 9.472 12.544h154.24c2.56-4.48 5.76-8.768 9.536-12.608l127.232-129.92a59.136 59.136 0 0 1 84.864 0z m1.28 265.536H212.032a60.544 60.544 0 0 0-59.904 56.64l-0.128 4.608v367.36c0 32.32 24.448 58.752 55.552 61.056l4.48 0.192h599.936c31.424 0 57.6-24.704 59.904-56.64l0.128-4.608v-367.36a60.672 60.672 0 0 0-60.032-61.248z m-480 122.432c33.152 0 60.032 27.456 60.032 61.248v61.184c0 33.856-26.88 61.248-60.032 61.248a60.608 60.608 0 0 1-59.968-61.248V531.84c0-33.792 26.88-61.248 60.032-61.248z m360 0c33.152 0 60.032 27.456 60.032 61.248v61.184c0 33.856-26.88 61.248-60.032 61.248a60.608 60.608 0 0 1-59.968-61.248V531.84c0-33.792 26.88-61.248 60.032-61.248z" p-id="1539" fill="#c5c5c5"></path></svg>    `;

    const userSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-license="isc-gnc" stroke-width="1.5" stroke="currentColor" class="w-5 mr-2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`;

    const clipboardSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-license="isc-gnc" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>`;

    const checkSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-license="isc-gnc" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>`;

    const cancelSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-license="isc-gnc" stroke-width="1.5" stroke="currentColor" class="w-3 h-3 mr-1"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`;

    const sendSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-license="isc-gnc" stroke-width="1.5" stroke="currentColor" class="w-3 h-3 mr-1"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>`;

    const pencilSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-license="isc-gnc" stroke-width="2" stroke="currentColor" class="w-3 h-3"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>`;

    const plusSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-license="isc-gnc" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>`;

    const insertSvg = `<svg t="1702627059132" stroke-width="1.5" stroke="currentColor" class="w-4 h-4" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5226" width="32" height="32"><path d="M735.5 959h-447C165.3 959 65 858.7 65 735.5v-447C65 165.3 165.3 65 288.5 65h447C858.7 65 959 165.3 959 288.5v447C959 858.7 858.7 959 735.5 959z m-447-812.7c-78.4 0-142.2 63.8-142.2 142.2v447c0 78.4 63.8 142.2 142.2 142.2h447c78.4 0 142.2-63.8 142.2-142.2v-447c0-78.4-63.8-142.2-142.2-142.2h-447z" fill="#cccccc" p-id="5227"></path><path d="M688.6 489.4c-12 0-21.8 9.8-21.8 21.8 0 55.7-20.1 68.5-107.3 68.5h-220c-12 0-21.8 9.8-21.8 21.8 0 6.9 3.4 12.8 8.4 16.8l-0.1 0.1 136.8 106.5s26.4 17.2 24.1-13.8l-10.3-87.8h83c79.5 0 150.9-8.6 150.9-112.1-0.1-12.1-9.9-21.8-21.9-21.8z m-340.9 29.5c0-55.7 20.1-68.5 107.3-68.5h220c12 0 21.8-9.8 21.8-21.8 0-6.9-3.4-12.7-8.4-16.7l0.1-0.1-136.7-106.6S525.4 288 527.7 319l10.3 87.8h-83c-79.5 0-150.9 8.6-150.9 112.1 0 12 9.8 21.8 21.8 21.8 12 0.1 21.8-9.7 21.8-21.8z" fill="#cccccc" p-id="5228"></path></svg>`;

    const textSvg = `<svg xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="none" data-license="isc-gnc" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" ><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;

    const closeSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-license="isc-gnc" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`;

    const refreshSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-license="isc-gnc" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>`;

    let inCode = false

    let language = null

    // Handle messages sent from the extension to the webview
    window.addEventListener("message", (event) => {
        const message = event.data;
        const list = document.getElementById("qa-list");

        switch (message.type) {
            case "showInProgress":
                if (message.showStopButton) {
                    document.getElementById("stop-button").classList.remove("hidden");
                } else {
                    document.getElementById("stop-button").classList.add("hidden");
                }

                if (message.inProgress) {
                    document.getElementById("in-progress").classList.remove("hidden");
                    document.getElementById("question-input").setAttribute("disabled", true);
                    document.getElementById("question-input-buttons").classList.add("hidden");
                    document.getElementById("clear-button").classList.add("hidden");
                } else {
                    document.getElementById("in-progress").classList.add("hidden");
                    document.getElementById("question-input").removeAttribute("disabled");
                    document.getElementById("question-input-buttons").classList.remove("hidden");
                }
                break;
            case "addQuestion":
                inCode = false
                language = null
                list.classList.remove("hidden");
                document.getElementById("introduction")?.classList?.add("hidden");
                document.getElementById("conversation-list").classList.add("hidden");

                const escapeHtml = (unsafe) => {
                    return unsafe.replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&#039;', "'");
                };

                list.innerHTML +=
                    `<div class="px-4 py-2 self-end mt-1 question-element-ext relative text-[0.95rem]">
                        <h2 class="flex items-center" data-license="isc-gnc">${userSvg}User</h2>
                        <no-export class="mb-2 flex items-center" data-license="isc-gnc">
                            <div class="hidden send-cancel-elements-ext flex gap-2">
                                <button title="Send this prompt" class="send-element-ext p-1 pr-2 flex items-center">${sendSvg}&nbsp;Send</button>
                                <button title="Cancel" class="cancel-element-ext p-1 pr-2 flex items-center">${cancelSvg}&nbsp;Cancel</button>
                            </div>
                        </no-export>
                        <div class="overflow-y-auto">${escapeHtml(message.value)}</div>
                    </div>`;

                if (message.autoScroll) {
                    list.lastChild?.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
                }
                break;
            case "addResponse":
                let existingMessage = document.getElementById(message.id);
                let updatedValue = "";
                let codeBlockStart = /```([a-zA-Z]+)/g;
                let codeBlockEnd = /```/g;

                const unEscapeHtml = (unsafe) => {
                    return unsafe.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
                };

                if (!message.responseInMarkdown) {
                    updatedValue = "```\r\n" + unEscapeHtml(message.value) + " \r\n ```";
                } else {
                    updatedValue = message.value.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
                }

                function extractLanguage(updatedValue) {
                    let language = updatedValue.match(codeBlockStart)[0].replace(codeBlockEnd, '');
                    return language;
                }

                function createCodeBlock(updatedValue, language) {
                    return `<pre class="border border-white code-background my-2 p-2 pb-0 text-[0.95rem] block overflow-x-scroll rounded  whitespace-pre-wrap"><code class="language-${language} code-background p-2 text-[0.95rem] block overflow-x-scroll rounded">${updatedValue}</code></pre>`;
                }

                if (existingMessage) {
                    if (inCode) {
                        if (codeBlockEnd.test(updatedValue)) {
                            inCode = false;
                            updatedValue = existingMessage.innerHTML
                        } else {
                            let allCodeElements = existingMessage.querySelectorAll('code');
                            let codeElement = allCodeElements[allCodeElements.length - 1];
                            beforeMessage = existingMessage.innerHTML.substring(0, existingMessage.innerHTML.lastIndexOf("<pre"));
                            updatedValue = beforeMessage + createCodeBlock(codeElement.innerHTML + updatedValue, language);
                        }
                    } else {
                        if (codeBlockStart.test(updatedValue)) {
                            inCode = true;
                            language = extractLanguage(updatedValue);
                            updatedValue = existingMessage.innerHTML + createCodeBlock('', language);
                        } else {
                            updatedValue = existingMessage.innerHTML + updatedValue;
                        }
                    }
                } else {
                    if (codeBlockStart.test(updatedValue)) {
                        inCode = true;
                        language = extractLanguage(updatedValue);
                        updatedValue = createCodeBlock('', language);
                    }
                }

                if (existingMessage) {
                    existingMessage.innerHTML = updatedValue;
                } else {
                    list.innerHTML +=
                        `<div data-license="isc-gnc" class="p-4 self-end mt-1 answer-element-ext text-[0.95rem]">
                        <h2 class="mb-2 flex">${aiSvg}Neural Copilot</h2>
                        <div class="result-streaming" id="${message.id}">${updatedValue}</div>
                    </div>`;
                }

                Prism.highlightAll()

                if (message.done) {
                    const preCodeList = list.lastChild.querySelectorAll("pre > code");

                    preCodeList.forEach((preCode) => {

                        const buttonWrapper = document.createElement("no-export");
                        buttonWrapper.classList.add("code-actions-wrapper", "flex", "gap-3", "pr-2", "pb-1", "flex-wrap", "items-center", "justify-end", "rounded-t-lg",);

                        // Create copy to clipboard button
                        const copyButton = document.createElement("button");
                        copyButton.title = "Copy to clipboard";
                        copyButton.innerHTML = `${clipboardSvg} Copy`;

                        copyButton.classList.add("code-element-ext", "p-1", "pr-2", "flex", "items-center", "rounded-lg");

                        const insert = document.createElement("button");
                        insert.title = "Replace to the current file";
                        insert.innerHTML = `${insertSvg} Replace`;

                        insert.classList.add("edit-element-ext", "p-1", "pr-2", "flex", "items-center", "rounded-lg");

                        const newTab = document.createElement("button");
                        newTab.title = "Create a new file with the below code";
                        newTab.innerHTML = `${plusSvg} New`;

                        newTab.classList.add("new-code-element-ext", "p-1", "pr-2", "flex", "items-center", "rounded-lg");
                        buttonWrapper.append(copyButton, insert);
                       
                        preCode.parentNode.append(buttonWrapper);
                    });

                    existingMessage = document.getElementById(message.id);
                    existingMessage.classList.remove("result-streaming");
                    document.getElementById("clear-button").classList.remove("hidden");
                }

                if (message.autoScroll) {
                    list.lastChild?.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
                }

                break;
            case "addError":
                const messageValue = message.value || "An error occurred. If this issue persists please clear your session token with `ChatGPT: Reset session` command and/or restart your Visual Studio Code. If you still experience issues, it may be due to outage on https://openai.com services.";

                list.innerHTML +=
                    `
                <div data-license="isc-gnc" class="p-4 self-end mt-1 answer-element-ext text-[0.95rem]">
                        <h2 class="mb-2 flex">${aiSvg}Neural Copilot</h2>
                        <div class="result-streaming" id="${message.id}">${marked.parse(messageValue)}</div>
                    </div>
                    `;

                if (message.autoScroll) {
                    list.lastChild?.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
                }
                break;
            case "clearConversation":
                clearConversation();
                break;
            case "exportConversation":
                exportConversation();
                break;

            default:
                break;
        }
    });

    const addFreeTextQuestion = () => {
        const input = document.getElementById("question-input");
        if (input.value?.length > 0) {
            vscode.postMessage({
                type: "addFreeTextQuestion",
                value: input.value,
            });

            input.value = "";
        }
    };

    const clearConversation = () => {
        document.getElementById("qa-list").innerHTML = "";

        document.getElementById("introduction")?.classList?.remove("hidden");
        document.getElementById("clear-button").classList.add("hidden");

        vscode.postMessage({
            type: "clearConversation"
        });

    };

    const exportConversation = () => {
        const turndownService = new TurndownService({ codeBlockStyle: "fenced" });
        turndownService.remove('no-export');
        let markdown = turndownService.turndown(document.getElementById("qa-list"));

        vscode.postMessage({
            type: "openNew",
            value: markdown,
            language: "markdown"
        });
    };

    document.getElementById('question-input').addEventListener("keydown", function (event) {
        if (event.key == "Enter" && !event.shiftKey && !event.isComposing) {
            event.preventDefault();
            addFreeTextQuestion();
        }
    });

    document.addEventListener("click", (e) => {
        const targetButton = e.target.closest('button');
        if (targetButton?.id === "more-button") {
            e.preventDefault();
            document.getElementById('chat-button-wrapper')?.classList.toggle("hidden");

            return;
        } else {
            document.getElementById('chat-button-wrapper')?.classList.add("hidden");
        }

        if (e.target?.id === "settings-button") {
            e.preventDefault();
            vscode.postMessage({
                type: "openSettings",
            });
            return;
        }

        if (e.target?.id === "settings-prompt-button") {
            e.preventDefault();
            vscode.postMessage({
                type: "openSettingsPrompt",
            });
            return;
        }

        // if (targetButton?.id === "login-button") {
        //     e.preventDefault();
        //     vscode.postMessage({
        //         type: "login",
        //     });
        //     return;
        // }

        if (targetButton?.id === "ask-button") {
            e.preventDefault();
            addFreeTextQuestion();
            return;
        }

        if (targetButton?.id === "clear-button") {
            e.preventDefault();
            clearConversation();
            return;
        }

        if (targetButton?.id === "export-button") {
            e.preventDefault();
            exportConversation();
            return;
        }

        if (targetButton?.id === "stop-button") {
            e.preventDefault();
            vscode.postMessage({
                type: "stopGenerating",
            });

            return;
        }

        if (targetButton?.classList?.contains("resend-element-ext")) {
            e.preventDefault();
            const question = targetButton.closest(".question-element-ext");
            const elements = targetButton.nextElementSibling;
            elements.classList.remove("hidden");
            question.lastElementChild?.setAttribute("contenteditable", true);

            targetButton.classList.add("hidden");

            return;
        }

        if (targetButton?.classList?.contains("send-element-ext")) {
            e.preventDefault();

            const question = targetButton.closest(".question-element-ext");
            const elements = targetButton.closest(".send-cancel-elements-ext");
            const resendElement = targetButton.parentElement.parentElement.firstElementChild;
            elements.classList.add("hidden");
            resendElement.classList.remove("hidden");
            question.lastElementChild?.setAttribute("contenteditable", false);

            if (question.lastElementChild.textContent?.length > 0) {
                vscode.postMessage({
                    type: "addFreeTextQuestion",
                    value: question.lastElementChild.textContent,
                });
            }
            return;
        }

        if (targetButton?.classList?.contains("cancel-element-ext")) {
            e.preventDefault();
            const question = targetButton.closest(".question-element-ext");
            const elements = targetButton.closest(".send-cancel-elements-ext");
            const resendElement = targetButton.parentElement.parentElement.firstElementChild;
            elements.classList.add("hidden");
            resendElement.classList.remove("hidden");
            question.lastElementChild?.setAttribute("contenteditable", false);
            return;
        }

        if (targetButton?.classList?.contains("code-element-ext")) {
            e.preventDefault();
            // let codeContent = targetButton.parentElement?.previousElementSibling?.lastChild?.textContent;
            let codeContent = targetButton.parentElement?.previousElementSibling.innerText;
            navigator.clipboard.writeText(codeContent).then(() => {
                targetButton.innerHTML = `${checkSvg} Copied`;
                setTimeout(() => {
                    targetButton.innerHTML = `${clipboardSvg} Copy`;
                }, 1500);
            });
            
            return;
        }

        if (targetButton?.classList?.contains("edit-element-ext")) {
            e.preventDefault();
            vscode.postMessage({
                type: "editCode",
                value: targetButton.parentElement?.previousElementSibling.innerText.trimEnd()
            });

            return;
        }

        if (targetButton?.classList?.contains("new-code-element-ext")) {
            e.preventDefault();
            vscode.postMessage({
                type: "openNew",
                value: targetButton.parentElement?.nextElementSibling?.lastChild?.textContent,
            });

            return;
        }
    });

})();
