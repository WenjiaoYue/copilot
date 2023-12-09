import delay from "delay";
import * as fs from "node:fs";
import * as os from "node:os";
import * as vscode from "vscode";
import fetch from 'isomorphic-fetch';
import { chatgptSendMessage } from "./utils/chatgpt";


type LoginMethod = "GPT3 OpenAI API Key";
type AuthType = "";

export default class ChatGptViewProvider implements vscode.WebviewViewProvider {
	private webView?: vscode.WebviewView;

	public subscribeToResponse: boolean;
	public autoScroll: boolean;
	public useAutoLogin?: boolean;
	public useGpt3?: boolean;
	public chromiumPath?: string;
	public profilePath?: string;
	public model?: string;

	private conversationId?: string;
	private messageId?: string;
	private proxyServer?: string;
	private loginMethod?: LoginMethod;
	private authType?: AuthType;

	private questionCounter = 0;
	private inProgress = false;
	private abortController?: AbortController;
	private currentMessageId = "";
	private response = "";

	/**
	 * Message to be rendered lazily if they haven't been rendered
	 * in time before resolveWebviewView is called.
	 */
	private leftOverMessage?: any;
	constructor(private context: vscode.ExtensionContext) {
		this.subscribeToResponse =
			vscode.workspace
				.getConfiguration("chatgpt")
				.get("response.showNotification") || false;
		this.autoScroll = true;
		this.model = vscode.workspace
			.getConfiguration("chatgpt")
			.get("gpt3.model") as string;

		this.setMethod();
		this.setChromeExecutablePath();
		this.setProfilePath();
		this.setProxyServer();
		this.setAuthType();
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		this.webView = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [this.context.extensionUri],
		};

		webviewView.webview.html = this.getWebviewHtml(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(async (data) => {
			switch (data.type) {
				case "addFreeTextQuestion":
					this.sendApiRequest(data.value, { command: "freeText" });
					break;
				case "editCode":
					const escapedString = (data.value as string).replace(/\$/g, "\\$");
					vscode.window.activeTextEditor?.insertSnippet(
						new vscode.SnippetString(escapedString)
					);

					this.logEvent("code-inserted");
					break;
				case "openNew":
					const document = await vscode.workspace.openTextDocument({
						content: data.value,
						language: data.language,
					});
					vscode.window.showTextDocument(document);

					this.logEvent(
						data.language === "markdown" ? "code-exported" : "code-opened"
					);
					break;
				case "clearConversation":
					this.messageId = undefined;
					this.conversationId = undefined;

					this.logEvent("conversation-cleared");
					break;
				case "clearBrowser":
					this.logEvent("browser-cleared");
					break;
				case "cleargpt3":

					this.logEvent("gpt3-cleared");
					break;
				case "login":
					break;
				case "openSettings":
					vscode.commands.executeCommand(
						"workbench.action.openSettings",
						"@ext:YOUR_PUBLISHER_NAME.vscode-chatgpt chatgpt."
					);

					this.logEvent("settings-opened");
					break;
				case "openSettingsPrompt":
					vscode.commands.executeCommand(
						"workbench.action.openSettings",
						"@ext:YOUR_PUBLISHER_NAME.vscode-chatgpt promptPrefix"
					);

					this.logEvent("settings-prompt-opened");
					break;
				case "showConversation":
					/// ...
					break;
				case "stopGenerating":
					this.stopGenerating();
					break;
				default:
					break;
			}
		});

		if (this.leftOverMessage != null) {
			// If there were any messages that wasn't delivered, render after resolveWebView is called.
			this.sendMessage(this.leftOverMessage);
			this.leftOverMessage = null;
		}
	}

	private stopGenerating(): void {
		this.abortController?.abort?.();
		this.inProgress = false;
		this.sendMessage({ type: "showInProgress", inProgress: this.inProgress });
		const responseInMarkdown = !this.isCodexModel;
		// this.sendMessage({
		// 	type: "addResponse",
		// 	value: `Welcome to Neural Copilot`,
		// 	done: true,
		// 	id: this.currentMessageId,
		// 	autoScroll: this.autoScroll,
		// 	responseInMarkdown,
		// });
		this.logEvent("stopped-generating");
	}

	public clearSession(): void {
		this.stopGenerating();
		this.messageId = undefined;
		this.conversationId = undefined;
		this.logEvent("cleared-session");
	}

	public setProxyServer(): void {
		this.proxyServer = vscode.workspace
			.getConfiguration("chatgpt")
			.get("proxyServer");
	}

	public setMethod(): void {
		console.log('loginMethod');

		this.loginMethod = vscode.workspace
			.getConfiguration("chatgpt")
			.get("method") as LoginMethod;

		this.useGpt3 = true;
		this.useAutoLogin = false;
		this.clearSession();
	}

	public setAuthType(): void {
		console.log('authType');

		this.authType = vscode.workspace
			.getConfiguration("chatgpt")
			.get("authenticationType");
		this.clearSession();
	}

	public setChromeExecutablePath(): void {
		let path = "";
		switch (os.platform()) {
			case "win32":
				path = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
				break;

			case "darwin":
				path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
				break;

			default:
				/**
				 * Since two (2) separate chrome releases exists on linux
				 * we first do a check to ensure we're executing the right one.
				 */
				const chromeExists = fs.existsSync("/usr/bin/google-chrome");

				path = chromeExists
					? "/usr/bin/google-chrome"
					: "/usr/bin/google-chrome-stable";
				break;
		}

		this.chromiumPath =
			vscode.workspace.getConfiguration("chatgpt").get("chromiumPath") || path;
		this.clearSession();
	}

	public setProfilePath(): void {
		this.profilePath = vscode.workspace
			.getConfiguration("chatgpt")
			.get("profilePath");
		this.clearSession();
	}

	private get isCodexModel(): boolean {
		return !!this.model?.startsWith("code-");
	}

	private get isGpt35Model(): boolean {
		return !!this.model?.startsWith("gpt-");
	}

	private get systemContext() {
		return `You are Neural Copilot helping the User with pair programming.`;
	}

	private processQuestion(question: string, code?: string, language?: string) {
		if (code != null) {
			// Add prompt prefix to the code if there was a code block selected
			question = `${question}${language
				? ` (The following code is in ${language} programming language)`
				: ""
				}: ${code}`;
		}
		return question + "\r\n";
	}

	public async sendApiRequest(prompt: string, options: { command: string, code?: string, previousAnswer?: string, language?: string; }) {
		if (this.inProgress) {
			// The AI is still thinking... Do not accept more questions.
			return;
		}

		// TODO
		const editor = vscode.window.activeTextEditor;
		let highlighted = "";
		if (editor) {
			const selection = editor.selection;
			if (selection && !selection.isEmpty) {
				const selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
				highlighted = editor.document.getText(selectionRange);
			}
		}
		this.logEvent(`highlighted: ${highlighted}`);
		this.logEvent(`code: ${options.code}`);

		// prompt = `${prompt} ${highlighted}`;
		prompt = `${prompt}`;
		const final_content = `${prompt} ${highlighted}`;
		this.questionCounter++;

		this.response = '';
		const question = this.processQuestion(final_content, options.code, options.language);
		const responseInMarkdown = !this.isCodexModel;

		// If the ChatGPT view is not in focus/visible; focus on it to render Q&A
		if (this.webView == null) {
			vscode.commands.executeCommand("vscode-chatgpt.view.focus");
		} else {
			this.webView?.show?.(true);
		}

		this.inProgress = true;
		this.abortController = new AbortController();
		this.sendMessage({
			type: "showInProgress",
			inProgress: this.inProgress,
			showStopButton: this.useGpt3,
		});
		this.currentMessageId = this.getRandomId();

		this.sendMessage({
			type: "addQuestion",
			value: prompt,
			code: options.code,
			autoScroll: this.autoScroll,
		});

		try {
			// chat work
			if (this.useGpt3) {
				console.log('this.useGpt3');

				// back_end response
				({ text: this.response, conversationId: this.conversationId, parentMessageId: this.messageId } = await chatgptSendMessage(question, {
					promptPrefix: this.systemContext,
					messageId: this.conversationId,
					parentMessageId: this.messageId,
					abortSignal: this.abortController.signal,
					onProgress: (partialResponse) => {
						this.response = partialResponse.text;
						this.sendMessage({ type: 'addResponse', value: this.response, id: this.messageId, autoScroll: this.autoScroll, responseInMarkdown });
					},
				}));

			}

			if (options.previousAnswer != null) {
				this.response = options.previousAnswer + this.response;
			}

			// const hasContinuation = this.response.split("```").length % 2 === 1;
			const hasContinuation = !this.response.length;

			if (hasContinuation) {
				// this.response = this.response + " \r\n ```\r\n";
				vscode.window
					.showInformationMessage(
						"It looks like ChatGPT didn't complete their answer for your coding question. You can ask it to continue and combine the answers.",
						"Continue and combine answers"
					)
					.then(async (choice) => {
						if (choice === "Continue and combine answers") {
							this.sendApiRequest("Continue", {
								command: options.command,
								code: undefined,
								previousAnswer: this.response,
							});
						}
					});
			}

			this.sendMessage({
				type: "addResponse",
				value: this.response,
				done: true,
				id: this.conversationId,
				autoScroll: this.autoScroll,
				responseInMarkdown,
			});

			if (this.subscribeToResponse) {
				vscode.window
					.showInformationMessage(
						"ChatGPT responded to your question.",
						"Open conversation"
					)
					.then(async () => {
						await vscode.commands.executeCommand("vscode-chatgpt.view.focus");
					});
			}
		} catch (error: any) {
			let message;
			let apiMessage =
				error?.response?.data?.error?.message ||
				error?.tostring?.() ||
				error?.message ||
				error?.name;

			this.logError("api-request-failed");

			if (error?.response?.status || error?.response?.statusText) {
				message = `${error?.response?.status || ""} ${error?.response?.statusText || ""
					}`;

				vscode.window
					.showErrorMessage(
						"An error occured. If this is due to max_token you could try `ChatGPT: Clear Conversation` command and retry sending your prompt.",
						"Clear conversation and retry"
					)
					.then(async (choice) => {
						if (choice === "Clear conversation and retry") {
							await vscode.commands.executeCommand(
								"vscode-chatgpt.clearConversation"
							);
							await delay(250);
							this.sendApiRequest(prompt, {
								command: options.command,
								code: options.code,
							});
						}
					});
			} else if (error.statusCode === 400) {
				message = `Your method: '${this.loginMethod}' and your model: '${this.model}' may be incompatible or one of your parameters is unknown. Reset your settings to default. (HTTP 400 Bad Request)`;
			} else if (error.statusCode === 401) {
				message =
					"Make sure you are properly signed in. If you are using Browser Auto-login method, make sure the browser is open (You could refresh the browser tab manually if you face any issues, too). If you stored your API key in settings.json, make sure it is accurate. If you stored API key in session, you can reset it with `ChatGPT: Reset session` command. (HTTP 401 Unauthorized) Potential reasons: \r\n- 1.Invalid Authentication\r\n- 2.Incorrect API key provided.\r\n- 3.Incorrect Organization provided. \r\n See https://platform.openai.com/docs/guides/error-codes for more details.";
			} else if (error.statusCode === 403) {
				message =
					"Your token has expired. Please try authenticating again. (HTTP 403 Forbidden)";
			} else if (error.statusCode === 404) {
				message = `Your method: '${this.loginMethod}' and your model: '${this.model}' may be incompatible or you may have exhausted your ChatGPT subscription allowance. (HTTP 404 Not Found)`;
			} else if (error.statusCode === 429) {
				message =
					"Too many requests try again later. (HTTP 429 Too Many Requests) Potential reasons: \r\n 1. You exceeded your current quota, please check your plan and billing details\r\n 2. You are sending requests too quickly \r\n 3. The engine is currently overloaded, please try again later. \r\n See https://platform.openai.com/docs/guides/error-codes for more details.";
			} else if (error.statusCode === 500) {
				message =
					"The server had an error while processing your request, please try again. (HTTP 500 Internal Server Error)\r\n See https://platform.openai.com/docs/guides/error-codes for more details.";
			}

			if (apiMessage) {
				message = `${message ? message + " " : ""}

	${apiMessage}
`;
			}

			this.sendMessage({
				type: "addError",
				value: message,
				autoScroll: this.autoScroll,
			});

			return;
		} finally {
			this.inProgress = false;
			this.sendMessage({ type: "showInProgress", inProgress: this.inProgress });
		}
	}

	/**
	 * Message sender, stores if a message cannot be delivered
	 * @param message Message to be sent to WebView
	 * @param ignoreMessageIfNullWebView We will ignore the command if webView is null/not-focused
	 */
	public sendMessage(message: any, ignoreMessageIfNullWebView?: boolean) {
		if (this.webView) {
			this.webView?.webview.postMessage(message);
		} else if (!ignoreMessageIfNullWebView) {
			this.leftOverMessage = message;
		}
	}

	private logEvent(eventName: string, properties?: {}): void {
		// You can initialize your telemetry reporter and consume it here - *replaced with console.debug to prevent unwanted telemetry logs
		// this.reporter?.sendTelemetryEvent(eventName, { "chatgpt.loginMethod": this.loginMethod!, "chatgpt.authType": this.authType!, "chatgpt.model": this.model || "unknown", ...properties }, { "chatgpt.questionCounter": this.questionCounter });
		console.debug(
			eventName,
			{
				"chatgpt.loginMethod": this.loginMethod!,
				"chatgpt.authType": this.authType!,
				"chatgpt.model": this.model || "unknown",
				...properties,
			},
			{ "chatgpt.questionCounter": this.questionCounter }
		);
	}

	private logError(eventName: string): void {
		// You can initialize your telemetry reporter and consume it here - *replaced with console.error to prevent unwanted telemetry logs
		// this.reporter?.sendTelemetryErrorEvent(eventName, { "chatgpt.loginMethod": this.loginMethod!, "chatgpt.authType": this.authType!, "chatgpt.model": this.model || "unknown" }, { "chatgpt.questionCounter": this.questionCounter });
		console.error(
			eventName,
			{
				"chatgpt.loginMethod": this.loginMethod!,
				"chatgpt.authType": this.authType!,
				"chatgpt.model": this.model || "unknown",
			},
			{ "chatgpt.questionCounter": this.questionCounter }
		);
	}

	private getWebviewHtml(webview: vscode.Webview) {
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.context.extensionUri, "media", "main.js")
		);
		const stylesMainUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.context.extensionUri, "media", "main.css")
		);

		const vendorHighlightCss = webview.asWebviewUri(
			vscode.Uri.joinPath(
				this.context.extensionUri,
				"media",
				"vendor",
				"highlight.min.css"
			)
		);
		const vendorHighlightJs = webview.asWebviewUri(
			vscode.Uri.joinPath(
				this.context.extensionUri,
				"media",
				"vendor",
				"highlight.min.js"
			)
		);
		const vendorMarkedJs = webview.asWebviewUri(
			vscode.Uri.joinPath(
				this.context.extensionUri,
				"media",
				"vendor",
				"marked.min.js"
			)
		);
		const vendorTailwindJs = webview.asWebviewUri(
			vscode.Uri.joinPath(
				this.context.extensionUri,
				"media",
				"vendor",
				"tailwindcss.3.2.4.min.js"
			)
		);
		const vendorTurndownJs = webview.asWebviewUri(
			vscode.Uri.joinPath(
				this.context.extensionUri,
				"media",
				"vendor",
				"turndown.js"
			)
		);

		const nonce = this.getRandomId();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0" data-license="isc-gnc">

				<link href="${stylesMainUri}" rel="stylesheet">
				<link href="${vendorHighlightCss}" rel="stylesheet">
				<script src="${vendorHighlightJs}"></script>
				<script src="${vendorMarkedJs}"></script>
				<script src="${vendorTailwindJs}"></script>
				<script src="${vendorTurndownJs}"></script>
			</head>
			<body class="overflow-hidden">
				<div class="flex flex-col h-screen">
					<div id="introduction" class="flex flex-col justify-between h-full justify-center px-6 w-full relative login-screen overflow-auto">
						<div data-license="isc-gnc-hi-there" class="flex items-start text-center features-block my-5">
							<div class="flex flex-col gap-3.5 flex-1">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" class="w-6 h-6 m-auto">
									<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"></path>
								</svg>
								<h2>Features</h2>
								<ul class="flex flex-col gap-3.5 text-xs">
									<li class="features-li w-full border border-zinc-700 p-3 rounded-md">Access to your ChatGPT conversation</li>
									<li class="features-li w-full border border-zinc-700 p-3 rounded-md">Improve your code, add tests & find bugs</li>
									<li class="features-li w-full border border-zinc-700 p-3 rounded-md">Replace your code automatically</li>
								</ul>
							</div>
						</div>
						
					</div>

					<div class="flex-1 overflow-y-auto" id="qa-list" data-license="isc-gnc"></div>

					<div class="flex-1 overflow-y-auto hidden" id="conversation-list" data-license="isc-gnc"></div>

					<div id="in-progress" class="pl-4 pt-2 flex items-center hidden" data-license="isc-gnc">
						<div class="typing">Thinking</div>
						<div class="spinner">
							<div class="bounce1"></div>
							<div class="bounce2"></div>
							<div class="bounce3"></div>
						</div>
						<button id="stop-button" class="btn btn-primary flex items-end ">
							</button>
					</div>

					<div class="p-4 flex items-center pt-2" data-license="isc-gnc">
						<div class="flex-1 textarea-wrapper">
							<textarea
								type="text"
								rows="1" data-license="isc-gnc"
								id="question-input"
								placeholder="Copilot chat ..."
								onInput="this.parentNode.dataset.replicatedValue = this.value"></textarea>
						</div>
						
						<div id="question-input-buttons" class="right-6 absolute p-0.5 ml-5 flex items-center gap-2">
							<button id="ask-button" title="Submit prompt" class="ask-button rounded-lg p-0.5">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
							</button>
						</div>
					</div>
				</div>

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}

	private getRandomId() {
		let text = "";
		const possible =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for (let i = 0; i < 32; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}
}
