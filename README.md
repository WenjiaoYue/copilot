<img src="./src/images/AISE.png" alt="AISE" width="50"/>

# Neural Copilot — Your AI programming assistant for VSCode

Neural Copilot is a VSCode plugin that serves as your AI programming assistant, which supports the following features:
- 😊 Easily switch between high quality mode and fast mode according to your needs.
- 📝 Autocomplete-style code suggestions as you write code.
- 💬 Get properly highlighted code and streaming answers to your prompts in sidebar conversation window.
- ➡️ Copy or replace code from conversation with just one click, NeuralChat is suggesting right into your editor.
---

Table of contents:

- [Neural Copilot — Your AI programming assistant for VSCode](#Neural-Copilot--code-suggestion-for-vscode)
  - [1. Install extension from the marketplace](#1-install-extension-from-the-marketplace)
  - [2. Install extension offline](#2-install-extension-offline)
  - [3. Installation for Development](#3-installation-for-development)
  - [4. How to use](#4-how-to-use)
    - [Switch mode](#switch-mode)
    - [Code suggestion](#code-suggestion)
    - [Chat with AI assistant](#chat-with-ai-assistant)

---
## 1. Install extension from the marketplace

Not supported yet, please refer to [Install extension offline](#2-install-extension-offline) or [Installation for Development](#3-installation-for-development) to try the plugin for now.

## 2. Install extension offline

To install Neural Copilot extension package:

1. Set up vsce:
```
npm install -g vsce
```
2. Package into a VSCE file:
```
vsce package
```
3. install from VSIX:
<img src="https://i.imgur.com/Ox78csb.png" alt="drawing" width="600"/>

## 3. Installation for Development

To install and starting Neural Copilot:

1. Set up Node environment version 14 or higher:
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
source ~/.bashrc
nvm install 18.17.1
nvm use 18.17.1
node -v
```

2. Clone this repository to your PC using `git clone https://github.com/WenjiaoYue/copilot`.

3. Change working directory to project folder using `cd copilot`.

4. Run `npm install` in the terminal to install dependencies.

5. Now, you can start the extension. From the top menu, choose `Run > Start Debugging`.

This will:

- Start a task `npm: watch` to compile the code and watch for changes.
- Open a new VSCode window (you should use the extension there).

_Note: When you make changes, you should refresh that window to apply changes. To refresh, open Command Palette (Command+Shift+P on MacOS, or Ctrl+Shift+P on Windows), then choose "Developer: Reload window"_

## 4. How to use

### Switch mode
Neural Copilot supports both high quality mode (default mode) and fast mode, and allows you to switch between them with one click according to your needs：
- High quality mode: Using remote server's service
- Fast mode: Using local client's service

To switch between the two modes, you can click on the icon in the upper right corner:

![alt text](https://i.imgur.com/MnUnNQ6.png)

You can modify the service url used by the two modes in package.json:


<img src="https://i.imgur.com/RzLCxDb.png" alt="drawing" width="600"/>

### Code suggestion
To trigger inline completion, you'll need to type `// {your keyword}` (start with your programming language's comment keyword, like `//` in C++ and `#` in python). Make sure `Inline Suggest` is `enabled` from the VS Code Settings.

For example:

<img src="https://i.imgur.com/bEu02XE.png" alt="drawing" width="500"/>

### Chat with AI assistant
You can start a conversation with the AI programming assistant by clicking on the robot icon in the plugin bar on the left:

![alt text](https://i.imgur.com/P1pB4Rw.png)

Then you can see the conversation window on the left, where you can chat with AI assistant:

<img src="https://i.imgur.com/3rRue6S.png" alt="drawing" width="450"/>

There are 4 areas worth noting:

1. Enter and submit your question
2. Your pevious questions
3. Answers from AI assistant (Code will be highlighted properly according to the programming language it is written in, also support streaming output)
4. Copy or replace code with one click (Note that you need to select the code in the editor first and then click "replace", otherwise the code will be inserted)

You can also select the code in the editor and ask AI assistant question about it.

For example:
1. Select code

<img src="https://i.imgur.com/0UlwYB9.png" alt="drawing" width="450"/>

2. Ask question and get answer

<img src="https://i.imgur.com/nC1ZA1b.png" alt="drawing" width="450"/>