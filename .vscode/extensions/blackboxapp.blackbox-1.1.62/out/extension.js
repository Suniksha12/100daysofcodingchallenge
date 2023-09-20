"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.activate = void 0
const vscode = require("vscode")
const search_1 = require("./utils/search")
const matchSearchPhrase_1 = require("./utils/matchSearchPhrase")
const autoCompletePhrase_1 = require("./utils/autoCompletePhrase")
const {spawn} = require('child_process');
const { WebSocketServer } = require("ws");
const uuid = require("uuid").v4
const node_fetch_1 = require("node-fetch")
const open = require("open")
const { io } = require("socket.io-client")
const WebSocket = require("ws");
const path = require("path")
const mainSite = "https://www.blackbox-ai.com"
const fs = require("fs")
let socket
const { ModelOperations } = require("@vscode/vscode-languagedetection")

const Diff = require("./js/diff")
const { createGzip, createUnzip } = require('node:zlib');
const { pipeline, EventEmitter } = require('node:stream');
const { promisify } = require('node:util');
const { execSync, exec } = require("child_process")
const { initCommentAiChat } = require('./commentChat/commentAiChat')
const pipe = promisify(pipeline);
// let WSS = null;
let eletronBrowser = null;
// let WSCommunicationPort = 6448;

function activate(_) {
	var EXTENSION_STATUS = _.globalState.get("extensionStatus")
	let premium_status = _.globalState.get("premiumStatus")
	if (!premium_status) premium_status = false
	_.globalState.update("chatStatus", false)
	var chatStatus = _.globalState.get("chatStatus")
	if (chatStatus == undefined) _.globalState.update("chatStatus", false)
	if (EXTENSION_STATUS === undefined) {
		EXTENSION_STATUS = false
	}
	var userId = _.globalState.get("userId")
	var isLoading = false
	if (userId == undefined) {
		userId = uuid()
		_.globalState.update("userId", JSON.stringify(userId))
		var randomPercent = Math.round(Math.random() * 100)
		if (randomPercent <= 100) {
			loginOrSignup()
			selectionFct("Notification Received")
		}
		vscode.commands.executeCommand("blackbox.showChat")
		selectionFct('vscode extension installed')
		_.globalState.update("versionerStatus", true)
		_.globalState.update("extensionStatus", true)
		EXTENSION_STATUS = true
		vscode.window.showInformationMessage("Blackbox Autocomplete Enabled")
		_.globalState.update("installedDate", Date.now())
		vscode.commands.executeCommand('setContext', 'blackbox.newInstallation', true)
	}else{
		let installed_date = _.globalState.get("installedDate")
		if (installed_date){
			let aug_21_chat_update = 1692655516558
			if (installed_date > aug_21_chat_update) {
				vscode.window.showInformationMessage("Open BlackboxAI Chat", ...["Open"])
				.then(async (option) => {
					if (option === "Open") {
						vscode.commands.executeCommand("blackbox.showChat")
						selectionFct('open chat notification')
					}
				})
			}
			const sep_15_terminal = 1694806306702;
			if (installed_date < sep_15_terminal) {
			  vscode.commands.executeCommand('setContext', 'blackbox.newInstallation', true);
			}
		}
	}
	let installed_date = _.globalState.get("installedDate")
	const inline_sep1_update = 1693612415079
	const inline_sep19_update = 1695128793000
	const shouldInitCodeLens = installed_date > inline_sep19_update;
	
	let show_premium_spe16 = 1694876336504
	let is_show_chat_premium = false
	
	if (installed_date){
		if (installed_date > inline_sep1_update){
			initCommentAiChat(_, shouldInitCodeLens);
		}
		
		if (installed_date > show_premium_spe16) is_show_chat_premium = true
	}
	selectionFct('Blackbox Activated')
	let gloablUserId = userId
	let globalPrompt = ''
	let globalSuggestion = ''
	let globalLanguageId = ''
	// else{ userId = JSON.parse(userId) }
	var stoppedTyping
	var timeToWait = 600 * 1000
	var acceptType = ""
	var codeReturn = ""
	var codeLanguage = "javascript"
	let is_stream = true
	const onboarding_call_url = 'https://calendly.com/blackboxapp/30min'
	is_chat_stream()

	//global variables for feedback on code search multi results
	var allResults = []
	var lastViewedCodeCommentArray = []
	var lastSearchedQuery = ""
	let is_triggered_from_Q = false
	let queryFromOutside = false;

	async function installDependencies(automatic=false) {
    const extensionPath = _.extensionPath;
    const extensionsNMPath = path.join(_.extensionPath, 'out', 'browser-renderer', 'node_modules');

    if (fs.existsSync(extensionsNMPath)) {
      return;
    }

    const cwd = path.join(extensionPath, 'out', 'browser-renderer');
	let progress = null
	if (automatic==false){
		progress = showProgress('Launching the Browser...');
	}else{
		selectionFct('blackbox browser autosetup')
	}
    try {
      return new Promise((resolve) => exec(`cd ${cwd} && npm install`, async error => {
        progress.emit('finish');

        if (!error) {
			return resolve();
        }

        let userInput = await vscode.window.showInformationMessage('Download and install nodejs', ...['ok', 'Restart', 'later']);

        if (userInput === 'ok') { 
          vscode.env.openExternal(vscode.Uri.parse('https://nodejs.org/en/download'));
          await installDependencies();
        }

        if (userInput === 'later') {
          return
        }

        if (userInput === 'Restart') {
          await vscode.window.showInformationMessage('Open the VsCode again to complete the setup', 'Ok');
          vscode.commands.executeCommand('workbench.action.closeWindow');
        }
      }));
    } catch (error) {
      console.error(error);
    }
	}
  
  installDependencies(true);
  
  function showProgress(title) {
    const eventEmitter = new EventEmitter();
    vscode.window.withProgress({
			title: title,
			location: vscode.ProgressLocation.Notification
		}, async (progress, token) => {
			return new Promise((resolve) =>{
        eventEmitter.on('finish', resolve)
      });
		});

    return eventEmitter;
  }


  vscode.commands.registerCommand('blackbox.comment.code', async ({ range }) => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      return ;
    }

    let content = editor.document.getText(range);

    content+='\n\ngive me this code with comments. the comment should only be maximum 10 words. give me the code with comments in 1 block.'
	lastSearchedQuery = content.trim();
	is_triggered_from_Q = true
	queryFromOutside = true;
	await vscode.commands.executeCommand('blackbox.showChat');
	selectionFct('codelens comment')
  });

  vscode.commands.registerCommand('blackbox.comment.add.suggestion', async ({ range, previousRange = [] }) => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      return ;
    }

    let content = editor.document.getText(range);
    let contentLines = content.split('\n');
    const previous = [...previousRange]
    while (contentLines.length < 50 && previous.length) {
      const previousContent = editor.document.getText(previous.pop());

      content = `${previousContent}\n${content}`;
      contentLines = content.split('\n');
    }

    content = contentLines.slice(0, 50).join('\n');
	content+='\n\ngive 1 suggestion to continue this code. give code only.'
	lastSearchedQuery = content.trim();
	is_triggered_from_Q = true
	queryFromOutside = true;
	await vscode.commands.executeCommand('blackbox.showChat');
	selectionFct('code suggestion')
  });

  const btn = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
  btn.command='blackbox.terminal.search';
  btn.text = 'Search Terminal Output';
  btn.hide();

  if (vscode.window.activeTerminal) {
    btn.show();
  }

  vscode.window.onDidOpenTerminal(() => {
    btn.show();
  });

  vscode.window.onDidCloseTerminal(() => {
    if (!vscode.window.terminals.length) {
		btn.hide();
	}
  })

  vscode.commands.registerCommand('blackbox.terminal.search', async () => {
    await vscode.commands.executeCommand('workbench.action.terminal.selectAll');
    await vscode.commands.executeCommand('workbench.action.terminal.copySelection');
    await vscode.commands.executeCommand('workbench.action.terminal.clearSelection');

    const terminalContent = (await vscode.env.clipboard.readText()).toString();

	const terminalContentFormatted = formatTerminalContent(terminalContent);

    is_triggered_from_Q = true;

    vscode.commands.executeCommand("blackbox.showChat", terminalContentFormatted);
	selectionFct('Click Search Terminal')
  });

  let isShowing = false;
  const terminalPanel = vscode.window.registerWebviewViewProvider('terminal.search.view',{
    resolveWebviewView(webviewView) {
      webviewView.webview.options = {
        enableScripts: true,
        enableCommandUris: true
      };
      isShowing = true;

      webviewView.webview.html = 'Blackbox AI Terminal Search'

      vscode.commands.executeCommand('blackbox.terminal.search');
      vscode.window.activeTerminal.show();

      webviewView.onDidChangeVisibility(() => {
        isShowing = !isShowing;

        vscode.commands.executeCommand('blackbox.terminal.search');
        vscode.window.activeTerminal.show();
      });
    }
  });

  _.subscriptions.push(terminalPanel);

  function formatTerminalContent(content) {
    const MAX_CHARACTERS = 2000;
    const { COMPUTERNAME } = process.env;

    let newContent = content.trim();

    newContent = newContent.split('\n').filter(line => !line.includes(COMPUTERNAME)).join('\n');

    if (newContent.length > MAX_CHARACTERS) {
      const start = newContent.length - MAX_CHARACTERS;
      newContent = newContent.slice(start, newContent.length)
    }

    return newContent;   
  }

	const styles = vscode.Uri.file(
		path.join(_.extensionPath, "out/css/styles.css")
	)
	const codemirrorStyles = vscode.Uri.file(
		path.join(_.extensionPath, "out/css/codemirror.css")
	)
	const codemirrorJs = vscode.Uri.file(
		path.join(_.extensionPath, "out/js/codemirror.js")
	)
	const codemirrorModeJs = vscode.Uri.file(
		path.join(_.extensionPath, "out/mode/javascript.js")
	)
	const codemirrorModeClike = vscode.Uri.file(
		path.join(_.extensionPath, "out/mode/clike.js")
	)
	const codemirrorModeCss = vscode.Uri.file(
		path.join(_.extensionPath, "out/mode/css.js")
	)
	const codemirrorModeHtmlMixed = vscode.Uri.file(
		path.join(_.extensionPath, "out/mode/htmlmixed.js")
	)
	const codemirrorModePhp = vscode.Uri.file(
		path.join(_.extensionPath, "out/mode/php.js")
	)
	const codemirrorModeSimple = vscode.Uri.file(
		path.join(_.extensionPath, "out/mode/simple.js")
	)
	const codemirrorModeXml = vscode.Uri.file(
		path.join(_.extensionPath, "out/mode/xml.js")
	)
	const codeMirrorSearchCursor = vscode.Uri.file(
		path.join(_.extensionPath, "out/js/searchcursor.js")
	)
	const codemirrorModePy = vscode.Uri.file(
		path.join(_.extensionPath, "out/mode/python.js")
	)
	const codemirrorTheme = vscode.Uri.file(
		path.join(_.extensionPath, "out/theme/darcula.css")
	)
	const loaderImg = vscode.Uri.file(
		path.join(_.extensionPath, "out/imgs/loader-dots.svg")
	)
	const searchIcon = vscode.Uri.file(
		path.join(_.extensionPath, "out/imgs/search-icon.png")
	)

	const blackboxLogo = vscode.Uri.file(
		path.join(_.extensionPath, "out/imgs/blackbox-logo.png")
	)
	const autosize = vscode.Uri.file(
		path.join(_.extensionPath, "out/js/autosize.js")
	)

	var stylesSrc
	var codemirrorStylesSrc
	var codemirrorJsSrc
	var codemirrorModeJsSrc
	var codemirrorModePySrc
	var codemirrorModeClikeSrc
	var codemirrorModeCssSrc
	var codemirrorModeHtmlMixedSrc
	var codemirrorModePhpSrc
	var codemirrorModeSimpleSrc
	var codemirrorModeXmlSrc
	var codemirrorThemeSrc
	var codeMirrorSearchCursorSrc
	var loaderImgSrc
	var searchIconSrc
	var blackboxLogoSrc
	var autosizeSrc

	var roomId = null
	const provider = {
		provideInlineCompletionItems: async (
			document,
			position,
			context,
			token
		) => {
			clearTimeout(stoppedTyping)
			var textBeforeCursor = document.getText(
				new vscode.Range(position.with(undefined, 0), position)
			)
			timeToWait = 600 * 1000
			const currTextBeforeCursor = textBeforeCursor
			var oldArr = _.globalState.get("savedLines")
			if (oldArr === undefined) oldArr = {}
			else oldArr = JSON.parse(oldArr)
			var saveLine = { save: false, complete: false }
			if (saveLine.save) {
				const newArr = { ...oldArr }
				const newTime = new Date().getTime()
				newArr[`${saveLine.line}`] = {
					uses: 1,
					lastUsed: newTime,
					addedAt: newTime
				}
				_.globalState.update("savedLines", JSON.stringify(newArr))
				selectionFct("Autcomplete Saved Line")
			} else if (saveLine.complete) timeToWait = 0
			if (
				textBeforeCursor.includes("?") ||
				textBeforeCursor.trim().length === 0
			)
				timeToWait = 0
			return new Promise((resolve, reject) => {
				stoppedTyping = setTimeout(async () => {
					var textBeforeCursor = document.getText(
						new vscode.Range(position.with(undefined, 0), position)
					)
					const editor = vscode.window.activeTextEditor
					var languageId =
						vscode.window.activeTextEditor.document.languageId
					const cursorPosition = editor.selection.active
					var threeLinesBefore = 0
					for (var i = 0; i < 50; i++) {
						if (cursorPosition.line - i >= 0)
							threeLinesBefore = cursorPosition.line - i
					}
					var selection = new vscode.Selection(
						threeLinesBefore,
						0,
						cursorPosition.line,
						cursorPosition.character
					)
					var textBefore = document.getText(selection)
					textBeforeCursor = textBefore
					textBeforeCursor = textBeforeCursor.trim()
					var oldArr = _.globalState.get("savedLines") //filling the variable
					if (oldArr === undefined) {
						oldArr = {}
					} else {
						oldArr = JSON.parse(oldArr)
					}
					var lineBeforeCursor = document.getText(
						new vscode.Range(position.with(undefined, 0), position)
					)
					const match = (0, matchSearchPhrase_1.matchSearchPhrase)(
						lineBeforeCursor
					)
					let items = []
					if (EXTENSION_STATUS && isLoading == false) {
						if (
							saveLine.complete !== false &&
							currTextBeforeCursor.trim().length != 0
						) {
							try {
								var rs = {
									results: [{ code: saveLine.complete }]
								}
								if (rs) {
									items = rs.results.map((item) => {
										var output = item.code
										if (item.code.includes("\n")) {
											output = `${item.code}`
										}
										selectionFct("Suggestion Received SL")
										return {
											text: output,
											insertText: output,
											range: new vscode.Range(
												position.translate(
													0,
													output.length
												),
												position
											)
										}
									})
								}
							} catch (err) {
								vscode.window.showErrorMessage(err.toString())
							}
						} else {
							isLoading = true
							vscode.window.setStatusBarMessage(
								`Blackbox Searching...`
							)
							let context = []
							try{
								context = getLinesAroundCursor()
							}catch(e){}
							
							let endsWithQ = false
							if (lineBeforeCursor.endsWith('?')){
								endsWithQ = true
							}
							if (match && endsWithQ == true) {
								if (match.searchPhrase.length < 150) {
									let rs
									try {
										rs = await (0, search_1.search)(
											match.searchPhrase,
											userId
										)
										if (rs) {
											items = rs.results.map((item) => {
												const output = `\n${item.code}`
												acceptType = "Search"
												codeReturn = item.result.response
												codeLanguage = vscode.window.activeTextEditor.document.languageId
												
												//update values for the variables for feedback on code search
												allResults = item.result.allResults
												lastSearchedQuery = item.query
												lastViewedCodeCommentArray = item.result.response
												is_triggered_from_Q = true

												vscode.commands.executeCommand(
													"blackbox.showChat"
												)
											})
										}
									} catch (err) {
										vscode.window.showErrorMessage(err.toString())
									}
								}
							}
							
							if (isPressedEnter) { 
								var processText = {complete: false, save: false}
								processText = await (0,
									autoCompletePhrase_1.autoCompleteSave)(
										textBeforeCursor,
										oldArr,
										gloablUserId,
										languageId,
										premium_status,
										context
								)
								isPressedEnter = false
							}
							isLoading = false
							globalPrompt = textBeforeCursor
							globalLanguageId = languageId
							vscode.window.setStatusBarMessage(`Blackbox`)
							//console.log(processText)
							if (processText.save) {
								const newArr = { ...oldArr }
								const newTime = new Date().getTime()
								newArr[`${processText.line}`] = {
									uses: 1,
									lastUsed: newTime,
									addedAt: newTime
								}
								_.globalState.update(
									"savedLines",
									JSON.stringify(newArr)
								)
								selectionFct("Autcomplete Saved Line")
							}
							if (processText.complete) {
								try {
									var rs = {
										results: [
											{ code: processText.complete }
										]
									}
									if (rs) {
										items = rs.results.map((item) => {
											var output = item.code
											if (item.code.includes("\n")) {
												output = `${item.code}`
											}
											selectionFct(
												"Suggestion Received CC"
											)
											acceptType = processText.acceptType
											globalSuggestion = output
											return {
												text: output,
												insertText: output,
												range: new vscode.Range(
													position.translate(
														0,
														output.length
													),
													position
												)
											}
										})
									}
								} catch (err) {}
							}
						}
					}
					let endsWithQ = false
					if (lineBeforeCursor.endsWith('?')){
						endsWithQ = true
					}
					if (match && endsWithQ) {
						if (match.searchPhrase.length < 150) {
							let rs
							try {
								rs = await (0, search_1.search)(
									match.searchPhrase,
									userId
								)
								if (rs) {
									items = rs.results.map((item) => {
										const output = `\n${item.code}`
										acceptType = "Search"
										codeReturn = item.result.response
										codeLanguage = vscode.window.activeTextEditor.document.languageId
										
										//update values for the variables for feedback on code search
										allResults = item.result.allResults
										lastSearchedQuery = item.query
										lastViewedCodeCommentArray = item.result.response
										is_triggered_from_Q = true

										vscode.commands.executeCommand(
											"blackbox.showChat"
										)
									})
								}
							} catch (err) {
								vscode.window.showErrorMessage(err.toString())
							}
						}
					}
					resolve({ items })
				}, timeToWait)
			})
		}
	}
	var webViewProvider = {
		resolveWebviewView: async function (thisWebview) {
			try {
				thisWebview.webview.options = {
					enableScripts: true
				}
				// vscode.commands.registerCommand( "extension.enableChat", () => {
				// 	_.globalState.update("chatStatus", true)
				// 	thisWebview.webview.html = getWebViewContent('chat')
				// 	// loginOrSignup()
				// 	if (socket == undefined) createSocketConnection()
				// })
				// vscode.commands.registerCommand( "extension.disableChat", () => {
				// 	_.globalState.update("chatStatus", false)
				// 	thisWebview.webview.html = getWebViewContent('onboarding')
				// 	selectionFct('Disbale Chat')
				// })

				stylesSrc = thisWebview.webview.asWebviewUri(styles)
				let chatEnabled = _.globalState.get("chatStatus")
				let pageView = "onboarding"
				if (chatEnabled) {
					pageView = "chat"
					createSocketConnection()
				}
				thisWebview.webview.html = getWebViewContent(pageView)

				var allState = {
					me: { username: null },
					activeChat: null,
					chats: {}
				}
				thisWebview.webview.onDidReceiveMessage(async (data) => {
					// console.log("out webview: ")
					// console.log(data)
					if (data.command) {
						if (data.command === "sendMessage") {
							const message = data.message
							const parentId = data.parentId
							let msgId = data.msgId
							addToRoomMessages(
								allState.activeChat,
								allState.me["username"],
								"message",
								message,
								data.time,
								msgId,
								parentId
							)
							socket.emit("sendVscodeMessage", {
								roomId: allState.activeChat,
								message,
								from: allState.me["username"],
								time: data.time,
								msgId,
								parentId
							})
						} else if (data.command === "connectToRoom") {
							const conRoom = data.message
							socket.emit("connectToRoom", {
								conRoom,
								userId
							})
						} else if (data.command === "disconnectFromRoom") {
							socket.emit("disconnectFromRoom", {
								roomId: allState.activeChat,
								userId
							})
							delete allState.chats[allState.activeChat]
							setRoomAsActive(null)
							updateLobby()
						} else if (data.command === "loginUser") {
							open(`${mainSite}/signin?vsCode=${userId}`)
						} else if (data.command === "createNewRoom") {
							var objToSend = { userId }
							if (data.roomId) {
								objToSend["roomId"] = data.roomId
							}
							createChat(objToSend)
						} else if (data.command === "init") {
							initState()
							if (is_triggered_from_Q) {
								postMessage({ command: "showChatCode", query: lastSearchedQuery })
								is_triggered_from_Q = false
							}
						} else if (data.command === "getUserName") {
							if (!allState.me["username"]) {
								socket.emit("getUserName", { userId })
							} else {
								postMessage({
									command: "setUserName",
									username: allState.me["username"]
								})
							}
						} else if (data.command === "changeActiveChat") {
							setRoomAsActive(data.roomId)
						} else if (data.command === "removeBadge") {
							setRoomBadge(data.roomId, 0)
						} else if (data.command === "changeRoomStatus") {
							socket.emit("changeRoomStatus", {
								roomId: allState.activeChat,
								userId
							})
						} else if (data.command === "inviteUser") {
							socket.emit("inviteUser", {
								user: data.user,
								roomId: allState.activeChat,
								userId
							})
						} else if (data.command === "showChat") {
							showChat(data.roomId)
						} else if (data.command === "showThread") {
							showThread(data.threadId, data.roomId)
						} else if (data.command == "refer")
							open(
								"https://mail.google.com/mail/u/0/?ui=2&tf=cm&fs=1&to=&su=Checkout+Blackbox+VSCode+Extension&body=%0D%0AHi+I+want+to+share+with+you+this+awesome+VS+Code+extension+called+Blackbox.+Blackbox+is+built+to+connect+developers+and+help+them+find+the+right+code+snippets.+I%27m+loving+and+I+think+you+will+took.%0D%0A%0D%0AYou+can+search+for+%22Blackbox%22+from+the+VS+Code+extensions+or+you+can+get+it+from+this+link%C2%A0https://marketplace.visualstudio.com/items?itemName=Blackboxapp.blackbox&ssr=false#overview"
							)
						else if (data.command == "moderator")
							open(
								"https://join.slack.com/t/blackboxmoderators/shared_invite/zt-1korfqhz5-jDnijHzeCrTXlBnX1cgocQ"
							)
						else if (data.command == "features-enable") {
							_.globalState.update("extensionStatus", true)
							EXTENSION_STATUS = true
							vscode.window.showInformationMessage(
								"Blackbox Autocomplete Enabled"
							)
							selectionFct("Autcomplete Enabled")
							loginOrSignup()
						} else if (data.command == "features-disable") {
							_.globalState.update("extensionStatus", false)
							EXTENSION_STATUS = false
							vscode.window.showInformationMessage(
								"Blackbox Autocomplete Disabled"
							)
							selectionFct("Autcomplete Disabled")
						} else if (data.command == "chatEnable") {
							_.globalState.update("chatStatus", true)
							thisWebview.webview.html = getWebViewContent("chat")
							// loginOrSignup()
							if (socket == undefined) createSocketConnection()
						} else if (data.command === "showCodeChat") {
							vscode.commands.executeCommand(
								"blackbox.showChat"
							)
						} else if (data.command === "showHistorySearch") {
							vscode.commands.executeCommand(
								"blackbox.historySearch"
							)
						} else if (data.command === "initBtns") {
							if (versionerStatus) {
								postMessage({ command: "versionerOn" })
							}
							else {
								postMessage({ command: "versionerOff" })
							}
						} else if (data.command === "versionerOff") {
							postMessage({ command: "versionerOff" })
							_.globalState.update("versionerStatus", false)
							versionerStatus = false
							selectionFct("versionerStatus off")
						} else if (data.command === "versionerOn") { 
							postMessage({ command: "versionerOn" })
							_.globalState.update("versionerStatus", true)
							versionerStatus = true
							selectionFct("versionerStatus on")
							createConfig()
						} else if (data.command === "versionerOpen") {
							vscode.commands.executeCommand('blackbox.showDiff')
							selectionFct("show diff")
						} else if (data.command === "createReadme") {
							vscode.commands.executeCommand("blackbox.readMe")
						} else if (data.command === "onboardingCall") {
							open(onboarding_call_url)
						} else if (data.command === "getStarted") {
							vscode.commands.executeCommand("blackbox.welcome")
						} else if (data.command === "blackboxPremium") {
							open('https://www.useblackbox.io/pricing')
							selectionFct('blackbox premium open')
						}
					}
				})

				thisWebview.onDidChangeVisibility(() => {
					if (isExtensionOpen()) {
						thisWebview.badge = {}
					}
				})

				function createSocketConnection() {
					socket = io.connect(mainSite)
					socket.on("connect", () => {
						console.log("==> Green Success connected: " + socket.id)
						socket.emit("updateSockId", { userId })
					})
					socket.on("connect_error", (err) => {
						console.log(`connect_error due to ${err.message}`)
					})
					socket.on("signedIn", (data) => {
						userId = data.userId
						_.globalState.update("userId", JSON.stringify(userId))
						// console.log(data)
						// console.log(userId)
						vscode.window.showInformationMessage(
							"You are now signed in, enjoy blackbox!",
							{ modal: "true" }
						)
					})
					socket.on("updateIsFree", (data) => {
						// console.log(data)
						isFree = data.isFree
					})
					socket.on("ping", function (data) {
						// console.log("ping")
						socket.emit("pong", { beat: 1 })
					})
					socket.on("seeValues", function (data) {
						// console.log(data)
					})
					socket.on("showError", function (data) {
						vscode.window.showWarningMessage(data.message)
					})

					socket.emit("updateSockId", { userId })

					socket.on("setUserName", function (data) {
						allState["me"].username = data.username
						postMessage({
							command: "setUserName",
							username: data.username
						})
					})

					socket.on("setRoomAdmin", function (data) {
						setRoomAdmins(data.roomId, data.admins)
					})

					socket.on("flipRoomStatus", function (data) {
						setRoomStatus(data.roomId, data.status)
						if (allState.activeChat === data.roomId) {
							postMessage({
								command: "flipRoomStatus",
								roomId: data.roomId,
								status: allState.chats[data.roomId].locked
							})
						}
					})

					socket.on("recieveVscodeMessage", function (data) {
						recieveMessage(
							data.roomId,
							data.from,
							"message",
							data.message,
							data.time,
							data.msgId,
							data.parentId
						)
					})

					socket.on("roomJoined", function (data) {
						const roomId = data.roomId
						const roomStatus = data.status
						const roomAdmins = data.admins
						startRoom(roomId, roomStatus, roomAdmins)
						showChat(roomId)
						addRoomToLobby(roomId)
					})

					socket.on("userJoinedRoom", function (data) {
						updateRoomUserCount(data.roomId, data.userCount)
						addToRoomMessages(data.roomId, data.user, "join")
						postMessage({
							command: "userJoinedRoom",
							user: data.user,
							userCount: data.userCount
						})
					})

					socket.on("userLeftRoom", function (data) {
						// console.log(data)
						addToRoomMessages(data.roomId, data.user, "leave")
						postMessage({
							command: "userLeftRoom",
							user: data.user,
							userCount: data.userCount
						})
					})

					socket.on("roomTaken", function (data) {
						// console.log("room is taken")
						postMessage({
							command: "roomTaken",
							message: data.message
						})
					})

					socket.on("updateChats", function (data) {
						const roomData = data.data
						// console.log('==> Green: success hello')
						// console.log(roomData)
						reconnectData(roomData)
					})
				}

				// sets room admins locally
				function setRoomAdmins(roomId, admins) {
					const adminArr = admins
					allState.chats[roomId].admins = adminArr

					if (isThisChatActive(roomId) && adminArr.includes(userId)) {
						postMessage({
							command: "showInviteForm"
						})
					}
				}

				// checks if given roomId is the active chat
				function isThisChatActive(roomId) {
					return allState.activeChat === roomId
				}

				// call only when you want to refresh the lobby chats
				function updateLobby() {
					const chats = allState.chats

					var lobbyChats = {}
					for (var key in chats) {
						lobbyChats[key] = chats[key].badge
					}

					postMessage({ command: "initLobby", data: lobbyChats })
				}

				// called when the user recieves a message
				function recieveMessage(
					roomId,
					by,
					type = "message",
					message,
					time,
					msgId,
					parentId
				) {
					addToRoomMessages(
						roomId,
						by,
						type,
						message,
						time,
						msgId,
						parentId
					)
					if (allState.activeChat === roomId) {
						var currTime = new Date()
						currTime = currTime.toLocaleString("en-US", {
							hour: "numeric",
							minute: "numeric",
							hour12: true
						})
						postMessage({
							command: "recieveVscodeMessage",
							message: message,
							from: by,
							time: currTime,
							msgId: msgId,
							parentId: parentId
						})
					} else {
						setRoomBadge(roomId, 1, true)
					}
				}

				// checks if the extension window is open
				function isExtensionOpen() {
					return thisWebview.visible
				}

				// changes the room status from private to public and  vice versa
				function setRoomStatus(roomId, status) {
					allState.chats[roomId].locked =
						status === "private" ? true : false
				}

				// changes the room badge number
				function setRoomBadge(roomId, count, addToPrevious = false) {
					if (addToPrevious) allState.chats[roomId].badge += count
					else allState.chats[roomId].badge = count
					updateBadges(roomId)
				}

				// called when the user first opens the extension or when closed and opened
				function initState() {
					const chats = allState.chats

					var lobbyChats = {}
					for (var key in chats) {
						lobbyChats[key] = chats[key].badge
					}

					postMessage({ command: "initLobby", data: lobbyChats })
					if (allState.activeChat) {
						showChat(allState.activeChat)
					}
				}

				// called when a new room is created, either by creating one, or by joining one
				function startRoom(roomId, status = "private", admins = []) {
					allState.chats[roomId] = {
						admins: [...admins],
						locked: status === "private" ? true : false,
						users: [],
						messages: [],
						badge: 0,
						userCount: 0
					}
					setRoomAsActive(roomId)
				}

				function reconnectData(data) {
					// console.log("in reconnect")
					// console.log(data)
					if (Object.keys(data).length !== 0) {
						for (const key in data) {
							allState.chats[key] = data[key]
						}
						// console.log("getting state")
						initState()
					}
				}

				// called when a new messages or notification is sent or recieved, to save and show on close and open
				function addToRoomMessages(
					roomId,
					by,
					type,
					message = null,
					time = null,
					msgId,
					parentId = ""
				) {
					var objToPush = { type, by }
					if (message) {
						var currTime
						if (time) {
							currTime = time
						} else {
							currTime = new Date()
							currTime = currTime.toLocaleString("en-US", {
								hour: "numeric",
								minute: "numeric",
								hour12: true
							})
						}
						objToPush["message"] = message
						objToPush["time"] = currTime
						objToPush["msgId"] = msgId
						objToPush["parentId"] = parentId
					}
					// console.log(objToPush)
					allState.chats[roomId].messages.push(objToPush)
				}

				// updates room user count
				function updateRoomUserCount(roomId, userCount) {
					allState.chats[roomId].userCount = userCount

					if (allState.activeChat === roomId) {
						postMessage({
							command: "setUserCount",
							userCount: userCount
						})
					}
				}

				// call only when you want to update badges
				function updateBadges(roomId) {
					var totalCount = 0
					for (var key in allState.chats) {
						totalCount += allState.chats[key].badge
					}

					if (totalCount !== 0) {
						if (!isExtensionOpen()) {
							thisWebview.badge = {
								tooltip: "unseen messages",
								value: totalCount
							}
						} else {
							postMessage({
								command: "updateBadges",
								badge: allState.chats[roomId].badge,
								roomId,
								totalCount
							})
						}
					} else {
						thisWebview.badge = {}
						postMessage({
							command: "updateBadges",
							badge: "",
							roomId,
							totalCount: ""
						})
					}
				}

				// called to send a message to inside the webview
				function postMessage(obj) {
					thisWebview.webview.postMessage(obj)
				}

				// changes which room is active, pass null to indicate that the lobby is active
				function setRoomAsActive(roomId) {
					allState.activeChat = roomId
				}

				//not used by useful later, shows or creates room
				function initializeChat(roomId) {
					if (roomId) {
						if (allState.chats[roomId]) {
							showChat(roomId)
							return
						}
					}
					createChat({ roomId, userId })
				}

				// called to show room with all messages and notifications
				function showChat(roomId) {
					setRoomAsActive(roomId)
					postMessage({
						command: "initializeChat",
						chatState: allState.chats[roomId],
						roomId,
						currId: userId
					})
				}

				//called to show the thread
				function showThread(threadId, roomId) {
					postMessage({
						command: "initializeThread",
						chatState: allState.chats[roomId],
						roomId,
						currId: userId,
						threadId: threadId
					})
				}

				// called to add room to the lobby
				function addRoomToLobby(roomId) {
					postMessage({
						command: "addRoomToLobby",
						roomId,
						badge: allState.chats[roomId].badge
					})
				}

				// called to create a new room
				function createChat(data) {
					socket.emit("createNewRoom", data)
				}
			} catch (e) {
				// console.log(e)
			}
		}
	}

	// initCommentAiChat(_);
	var controlFileName = 'file-control.json';
	var ignoreFiles = [controlFileName, 'empty'];
	var workspaceFolderId
	var inWorkSpace = true
	var versionerStatus = _.globalState.get("versionerStatus")
	if (versionerStatus == undefined || versionerStatus == null) { 
		versionerStatus = false
	}
	if (!vscode.workspace.workspaceFolders) {
		inWorkSpace = false
	}
	else if (versionerStatus) {
		var idPath = _.workspaceState.get('workspaceFolderId');
		try {
			fs.accessSync(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, "./blackbox.config.json"))
			idPath = JSON.parse(fs.readFileSync(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, "./blackbox.config.json"), "utf8")).id
			fs.unlink(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, "./blackbox.config.json"), () => { })
		} catch (e) {
			// console.log(e)
		}

		workspaceFolderId = idPath;

		if (!idPath) {
			workspaceFolderId = uuid()
			_.workspaceState.update('workspaceFolderId', workspaceFolderId);
		}

		saveDoc()
	}


	function cleanDiff(){
		const baseFolder = _.globalStorageUri.fsPath;
	
		const userTempFolder = path.join(baseFolder, workspaceFolderId);
		const fileControlFullPath = path.join(baseFolder, workspaceFolderId, controlFileName);
	
		try {
		fs.rmdirSync(userTempFolder, { recursive: true });
		} catch (e) {}
	
		try {
		fs.mkdirSync(userTempFolder, { recursive: true });
		} catch (e) {}
	
		try {
		fs.writeFileSync(fileControlFullPath, '{}');
		} catch (e) {}

		if (diffPanel) {
			vscode.commands.executeCommand('blackbox.showDiff')
		}
	}

	const onmessageHandler = (msgEvent)=>{
		let message = msgEvent.data.toString("utf-8");
		console.log(message)
		try{
			let messageData = JSON.parse(message);
			if(messageData['type']==='copy-to-vscode'){
				addTextAtCursor({ text: messageData['data'] + '\n' });
			}

      if (messageData['type']==='open-browse') {
				vscode.env.openExternal(vscode.Uri.parse(messageData['data']));
			}
		}catch(ex){
			console.log("Error on parsing data")
		}
		// 
	}
	let createElectronBrowser = (query) => {
		
		// if(!WSS){
		// 	WSS = new WebSocketServer({ port: WSCommunicationPort });
		// 	WSS.electron = null;
		// 	WSS.on('connection', function connection(ws, req) {
		// 		ws.onmessage = onmessageHandler;
		// 		WSS.electron = ws;
		// 		if(query){
		// 			searchOnWeb(query)
		// 		}
		// 	});
		// }
		// console.log("========>", eletronBrowser)

		if(eletronBrowser){
			return;
		}
		// console.log("========>")

		const extensionPath = _.extensionPath;

		const isWindows = process.platform.includes('win') && process.platform !="darwin";

		const electronCommandExtension = isWindows ? '.cmd' : '';

		const command =  path.join(extensionPath, 'out', 'browser-renderer', 'node_modules', '.bin', `electron${electronCommandExtension}`);
		// console.log("cmd=======>")
		const cwd = path.join(extensionPath, 'out', 'browser-renderer');        
		const spawn_env = JSON.parse(JSON.stringify(process.env));
		
		// remove those env vars
		delete spawn_env.ATOM_SHELL_INTERNAL_RUN_AS_NODE;
		delete spawn_env.ELECTRON_RUN_AS_NODE;

		if (query) {
			eletronBrowser = spawn(command, ['.', query], {cwd: cwd, env: spawn_env})
		} else {
			eletronBrowser = spawn(command, ['.'], {cwd: cwd, env: spawn_env})
		}
	
		// this is for checking the child logs:
		eletronBrowser.stdout.on('data', (data) => {
			// console.log('child on data', data.toString());
      if(query){
        searchOnWeb(query)
      }
		});

		eletronBrowser.on("exit", (code, stgnal)=>{
			eletronBrowser = null;
		});
	}
	let searchOnWeb = (text) => {
		if(!text){
			vscode.window.showInformationMessage("Select a portion of the code and try again")
			return;
		}
		text = text.split(' ').join('+')
		// WSS.electron.send(JSON.stringify({'type':"search-on-web", "data": text}))
	}
	// vscode.commands.registerCommand("extension.webSearch", async () => {
    // await installDependencies();
	// 	let selected_text = getActiveSelectedTextInVSCodeEditor()
	// 	if(eletronBrowser){
	// 		searchOnWeb(selected_text);
	// 	}else{
	// 		createElectronBrowser(selected_text);
	// 	}
	// 	selectionFct('right click web search')
	// })
	vscode.commands.registerCommand('blackbox.openBrowser', async () => {
    await installDependencies();
		createElectronBrowser();
		selectionFct('open browser')
	});

	vscode.commands.registerCommand('blackbox.cleanDiff', () => {
		cleanDiff()
	});

	var fullArr = []
	function formatRepos(repos, query) {
		if (query) {
			var tenLinesArr = []
			fullArr = []
			repos.forEach((repo, repoIndex) => {
				fullArr[repoIndex] = repo.split("\n")
				fullArr[repoIndex] = fullArr[repoIndex].join("\n")
				tenLinesArr[repoIndex] = ""
				const repoLines = repo.split("\n")

				var lineHolder = ""
				var segmentsArr = []
				for (let i = 0; i < repoLines.length - 1; i++) {
					lineHolder += repoLines[i] + "\n"

					if (i % 9 === 0 && i !== 0) {
						segmentsArr.push(lineHolder)
						lineHolder = ""
					}
					if (i == repoLines.length - 1) {
						segmentsArr.push(lineHolder)
					}
				}
				var lastOccurences = 0
				var savedIdx = 0
				var words = query.split(" ")
				segmentsArr.forEach((segment, idx) => {
					var occurences = 0
					words.forEach((word) => {
						occurences += segment.split(word).length - 1
					})

					if (occurences > lastOccurences) {
						lastOccurences = occurences
						savedIdx = idx
					}
				})

				tenLinesArr[repoIndex] = segmentsArr[savedIdx]
			})

			fullArr.forEach((repo, repoIndex) => {
				if (
					tenLinesArr[repoIndex] &&
					!tenLinesArr[repoIndex].includes(
						repo.split("\n").splice(0, 2).join("\n")
					)
				) {
					tenLinesArr[repoIndex] =
						repo.split("\n").splice(0, 2).join("\n") +
						"\n" +
						tenLinesArr[repoIndex]
				}
				var temp = repo.split("\n")
				temp.splice(0, 2)
				fullArr[repoIndex] = temp.join("\n")
			})

			return tenLinesArr
		} else {
			var tenLinesArr = []
			fullArr = []
			var lineNumbers = []
			repos = repos.reverse() // default sort by most recent
			repos.forEach((repo, repoIndex) => {
				fullArr[repoIndex] = repo.split("\n")
				fullArr[repoIndex] = fullArr[repoIndex].join("\n")
				tenLinesArr[repoIndex] = ""
				const repoLines = repo.split("\n")

				var lineHolder = ""
				var segmentsArr = []
				if (repoLines.length > 1) {
					// else then in saved lines ()
					segmentsArr.push(repoLines.join("\n"))
				} else {
					segmentsArr = [repoLines[0]]
				}

				tenLinesArr[repoIndex] = segmentsArr[0]
			})
			return [tenLinesArr, lineNumbers]
		}
	}
	vscode.window.registerWebviewViewProvider(
		"blackbox-onboarding",
		webViewProvider
	)
	// @ts-ignore
	vscode.languages.registerInlineCompletionItemProvider(
		{ pattern: "**" },
		provider
	)
	vscode.commands.registerCommand("extension.acceptSuggestion", () => {
		vscode.commands.executeCommand("editor.action.inlineSuggest.commit")
		if (acceptType != "") selectionFct(`Accept ${acceptType}`)
		else selectionFct("Accept")
		if (acceptType == 'Code Complete') acceptSuggestion(globalPrompt, globalSuggestion, globalLanguageId)
		acceptType = "" //reset the type
	})
	vscode.commands.registerCommand(
		"extension.enableBlackBoxAutoComplete",
		() => {
			loginOrSignup()
		}
	)
	vscode.commands.registerCommand(
		"extension.disableBlackBoxAutoComplete",
		() => {
			_.globalState.update("extensionStatus", false)
			EXTENSION_STATUS = false
			vscode.window.showInformationMessage(
				"Blackbox Autocomplete Disabled"
			)
			selectionFct("Autcomplete Disabled")
		}
	)
	vscode.commands.registerCommand(
		"extension.clearBlackboxAutocomplete",
		() => {
			_.globalState.update("savedLines", undefined)
			vscode.window.showInformationMessage(
				"Blackbox Cleared Autocomplete Lines"
			)
			selectionFct("Autcomplete Clear")
		}
	)
	vscode.commands.registerCommand("extension.saveText", async () => {
		addItem(getSelectedText())
	})


	var historyPanel
	vscode.commands.registerCommand("blackbox.historySearch", () => {
		if (historyPanel) {
			historyPanel.reveal(vscode.ViewColumn.One)
		} else {
			historyPanel = vscode.window.createWebviewPanel(
				"blackbox-history-search",
				"Saved Snippets",
				vscode.ViewColumn.One,
				{
					enableScripts: true
				}
			)
			stylesSrc = historyPanel.webview.asWebviewUri(styles)
			codemirrorStylesSrc =
				historyPanel.webview.asWebviewUri(codemirrorStyles)
			codemirrorJsSrc = historyPanel.webview.asWebviewUri(codemirrorJs)
			codemirrorModeJsSrc =
				historyPanel.webview.asWebviewUri(codemirrorModeJs)
			codemirrorModePySrc =
				historyPanel.webview.asWebviewUri(codemirrorModePy)
			codeMirrorSearchCursorSrc = historyPanel.webview.asWebviewUri(
				codeMirrorSearchCursor
			)
			codemirrorThemeSrc =
				historyPanel.webview.asWebviewUri(codemirrorTheme)
			codemirrorModeClikeSrc =
				historyPanel.webview.asWebviewUri(codemirrorModeClike)
			codemirrorModeCssSrc =
				historyPanel.webview.asWebviewUri(codemirrorModeCss)
			codemirrorModeHtmlMixedSrc = historyPanel.webview.asWebviewUri(
				codemirrorModeHtmlMixed
			)
			codemirrorModePhpSrc =
				historyPanel.webview.asWebviewUri(codemirrorModePhp)
			codemirrorModeSimpleSrc =
				historyPanel.webview.asWebviewUri(codemirrorModeSimple)
			codemirrorModeXmlSrc =
				historyPanel.webview.asWebviewUri(codemirrorModeXml)
			loaderImgSrc = historyPanel.webview.asWebviewUri(loaderImg)
			searchIconSrc = historyPanel.webview.asWebviewUri(searchIcon)
			blackboxLogoSrc = historyPanel.webview.asWebviewUri(blackboxLogo)
			historyPanel.webview.html = getHistorySearchView()
			function postMessage(obj) {
				historyPanel.webview.postMessage(obj)
			}
			historyPanel.onDidDispose(() => {
				historyPanel = undefined
			})
			historyPanel.webview.onDidReceiveMessage(async (data) => {
				if (data.command === "showFullCode") {
					openInPage(fullArr[data.codeId], data.languageId)
				} else if (data.command === "showHistory") {
					var history = JSON.parse(_.globalState.get("savedSnippets"))
					const arr = []
					const timings = []
					const languages = []
					const publishStatus = []
					for (var key in history) {
						arr.push(key)
						timings.push(history[key].addedAt)
						languages.push(history[key].language || "")
						publishStatus.push(history[key].publish)
					}

					const codes = formatRepos(arr)
					postMessage({
						command: "showCode",
						codes: codes[0],
						lineNumbers: codes[1],
						type: "history",
						timings,
						languages,
						publishStatus
					})
				} else if (data.command === "deleteHistoryItem") {
					removeHistoryItem(data.key)
				} else if (data.command === "editHistoryItem") {
					editHistoryItem(data)
				} else if (data.command === "publishHistoryItem") {
					publishHistoryItem(data.key, data.updatePublishStatus)
				}
			})
		}
	})

	var codePanel = undefined
	vscode.commands.registerCommand("blackbox.showCode", () => {
		if (codePanel) {
			function postMessage(obj) {
				codePanel.webview.postMessage(obj)
			}
			codePanel.reveal(vscode.ViewColumn.Two)
			postMessage({ command: "showCode", code: codeReturn, language: codeLanguage, allResults: allResults, query: lastSearchedQuery })
		} else {
			function postMessage(obj) {
				codePanel.webview.postMessage(obj)
			}
			codePanel = vscode.window.createWebviewPanel(
				"blackbox-code",
				"Blackbox Code Search",
				vscode.ViewColumn.Two,
				{
					enableScripts: true
				}
			)
			stylesSrc = codePanel.webview.asWebviewUri(styles)
			codemirrorStylesSrc =
			codePanel.webview.asWebviewUri(codemirrorStyles)
			codemirrorJsSrc = codePanel.webview.asWebviewUri(codemirrorJs)
			codemirrorModeJsSrc =
			codePanel.webview.asWebviewUri(codemirrorModeJs)
			codemirrorModePySrc =
			codePanel.webview.asWebviewUri(codemirrorModePy)
			codeMirrorSearchCursorSrc = codePanel.webview.asWebviewUri(
				codeMirrorSearchCursor
			)
			codemirrorThemeSrc =
			codePanel.webview.asWebviewUri(codemirrorTheme)
			codemirrorModeClikeSrc =
			codePanel.webview.asWebviewUri(codemirrorModeClike)
			codemirrorModeCssSrc =
			codePanel.webview.asWebviewUri(codemirrorModeCss)
			codemirrorModeHtmlMixedSrc = codePanel.webview.asWebviewUri(
				codemirrorModeHtmlMixed
			)
			codemirrorModePhpSrc =
			codePanel.webview.asWebviewUri(codemirrorModePhp)
			codemirrorModeSimpleSrc =
			codePanel.webview.asWebviewUri(codemirrorModeSimple)
			codemirrorModeXmlSrc =
			codePanel.webview.asWebviewUri(codemirrorModeXml)
			loaderImgSrc = codePanel.webview.asWebviewUri(loaderImg)
			searchIconSrc = codePanel.webview.asWebviewUri(searchIcon)
			blackboxLogoSrc = codePanel.webview.asWebviewUri(blackboxLogo)
			autosizeSrc = codePanel.webview.asWebviewUri(autosize)
			codePanel.webview.html = getCodeHtml(codePanel)
			codePanel.onDidDispose(() => {
				codePanel = undefined
			})

			//function to return the other results for the code search
			async function getOtherResults(url) {
				const response = await (0, node_fetch_1.default)(
					"https://www.useblackbox.io/otherResults",
					{
						method: "POST",
						body: JSON.stringify({
							url
						}),
						headers: {
							"Content-Type": "application/json",
							Accept: "application/json"
						}
					}
				)

				const result = await response.json()

				//when the result[response] is ['',''] to add the source in the response "Source: ${url}"
				try{
					if (result['response'] && result['response'].length == 1 && result['response'][0][0] == '' && result['response'][0][1] == ''){
						result['response'] = [['', `Source: ${url}`]]
					}
				}catch(e){
					console.log(e)
				}

				postMessage({
					command: "showCodePart",
					result
				})
			}

			//function to send feedback from code search results
			async function sendQualityToaster(data) {
				const { type, query, answer, lastViewedResultRank} = data
				const response = await (0, node_fetch_1.default)(
					"https://www.useblackbox.io/feedbackQueryResult",
					{
						method: "POST",
						body: JSON.stringify({
							// type, query, answer, id: userId
							feedback: type, query, codeCommentArray: answer, resultRank: `${lastViewedResultRank}`, userId, source: 'visual studio'
						}),
						headers: {
							"Content-Type": "application/json",
							Accept: "application/json"
						}
					}
				)
			}

			codePanel.webview.onDidReceiveMessage(async (data) => {
				if (data.command && data.command === "getCode") {
					postMessage({ command: "showCode", code: codeReturn, language: codeLanguage, allResults: allResults, query: lastSearchedQuery })
				} else if (data.command === "fetchCode") { 
					const response = await (0, node_fetch_1.default)(
						"https://useblackbox.io/autocompletev4",
						{
							method: "POST",
							body: JSON.stringify({
								textInput: data.query,
								userId: userId,
								source: "visual studio"
							}),
							headers: {
								"Content-Type": "application/json",
								Accept: "application/json"
							}
						}
					)
					const result = await response.json()

					//update global variables for feedback on code search
					lastSearchedQuery = data.query
					codeReturn = result.response
					lastViewedCodeCommentArray = result.response
					allResults = result.allResults

					postMessage({
						command: "showCode",
						code: result.response,
						query: data.query,
						allResults: allResults,
						language: "javascript"
					})
				} else if (data.command === "otherResults") {
					getOtherResults(data.url)
				} else if (data.command === "answerQuality") {
					sendQualityToaster({ ... data })
				}
			})
		}
	})

	function getCodeHtml(panel) {
		//load image files for feedback window for code search
		const copyImage = vscode.Uri.file( path.join(_.extensionPath, "out/imgs/copy.svg") )
		const upImg = vscode.Uri.file( path.join(_.extensionPath, "out/imgs/thumbs-up.png") )
		const downImg = vscode.Uri.file( path.join(_.extensionPath, "out/imgs/thumbs-down.png") )
		const checkImg = vscode.Uri.file( path.join(_.extensionPath, "out/imgs/white-check.png") )
		const copyImgSrc = panel.webview.asWebviewUri(copyImage)
		const upImgSrc = panel.webview.asWebviewUri(upImg)
		const downImgSrc = panel.webview.asWebviewUri(downImg)
		const checkImgSrc = panel.webview.asWebviewUri(checkImg)

		return `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Blackbox View Test</title>
			<link href="${stylesSrc}" type="text/css" rel="stylesheet"/>
			<script src="${codemirrorJsSrc}"></script>
			<link rel="stylesheet" href="${codemirrorStylesSrc}" />
			<script src="${codemirrorModeJsSrc}"></script>
			<script src="${codemirrorModePySrc}"></script>
			<script src="${codemirrorModeClikeSrc}"></script>
			<script src="${codemirrorModeCssSrc}"></script>
			<script src="${codemirrorModeHtmlMixedSrc}"></script>
			<script src="${codemirrorModePhpSrc}"></script>
			<script src="${codemirrorModeSimpleSrc}"></script>
			<script src="${codemirrorModeXmlSrc}"></script>
			<script src="${codeMirrorSearchCursorSrc}"></script>
			<link rel="stylesheet" href="${codemirrorThemeSrc}" />
		</head>
		<body>
			<style>
				* {
					padding: 0;
					margin: 0;
					box-sizing: border-box;
				}
		
				.CodeMirror {
					height: auto;
					background-color: transparent !important;
				}
				.CodeMirror-gutters {
					background-color: transparent !important;
					border-right: 0 !important;
				}
				.CodeMirror-hscrollbar{
					height: 2px;
				}
				.CodeMirror-linenumbers {
					padding-right: 20px;
				}
				.highlight {
					background-color: rgba(17, 119, 187, 0.5);
				}
				.cm-s-darcula span.cm-property{
					color:#ff7b72;
				}
				.cm-s-darcula span.cm-string{
					color:#A9B7C6;
				}
				.search-page{
					display:flex;
					flex-direction:column;
					gap:30px;
					padding:15px 50px;
					padding-bottom:100px;
				}
				.CodeMirror-gutter-elt{
					text-align: left;
					padding: 0;
				}
				.input-container{
					padding: 14px;
					position:sticky;
					top:0;
					z-index: 999;
					border-radius: 0 0 5px 5px;
					display: flex;
					align-items: center;
					background-color:var(--vscode-editor-background);
				}
				.input-icon{
					cursor: pointer;
					position: absolute;
					top: 50%;
					transform: translateY(-50%);
					right: 20px;
					width: 40px;
					display:none;
				}
				.input-icon.active{
					display:block;
				}
				.search-icon{
					cursor: pointer;
					width: 15px;
				}
				.loader-icon{
					cursor: pointer;
					width: 28px;
				}
				
				.input-style {
					width: 100%;
					margin: 10px 0;
					outline: none;
					border: 0;
					background-color: #ffffff17;
					padding: 5px;
					color: #fff;
					outline-color:rgb(14, 99, 156)!important;
				}
				.el-holder{
					padding-bottom: 3em;
					white-space: pre;
				}

				/* code search multi results tab */
				.result-tab {
					width: 100%;
					text-align: center;
					padding: 5px;
					margin: 0 2px;
					border-radius: 4px;
					transition:0.3s ease all;
					cursor:pointer;
					border: 1px solid #444;
					opacity:0.4;
				}
				.result-tab.active {
					opacity:1;
				}
				.result-tab:hover {
					opacity:1
				}
				.result-tab-holder{
					display: flex;
    				align-items: center;
					position: sticky;
					top: 75px;
					background-color:var(--vscode-editor-background);
					z-index: 99;
					padding-bottom: 14px;
				}

				/* code search feedback window */
				.CodeMirror-gutter-elt{
					text-align: left;
					padding: 0;
				}
				.top-code-bar{
					position: absolute;
					right: 0;
					margin: 6px;
					z-index:2;
					display:flex;
					align-items:center;
					gap:5px;
					opacity:0;
				}
				.code-copy-img{
					width: 17px;
    				cursor: pointer;
					transition: 0.3s ease all;
					fill: rgb( 139, 148, 158)
				}
				.copy-text{
					font-size:10px;
					display:none;
					height: 18px;
				}
				.copy-text.active{
					display:block
				}
				.result-tab {
					width: 100%;
					text-align: center;
					padding: 5px;
					margin: 0 2px;
					border-radius: 4px;
					transition:0.3s ease all;
					cursor:pointer;
					border: 1px solid #444;
					opacity:0.4;
				}
				.result-tab.active {
					opacity:1;
				}
				.result-tab:hover {
					opacity:1
				}
				.result-tab-holder{
					display: flex;
    				align-items: center;
					position: sticky;
					top: 75px;
					background-color:var(--vscode-editor-background);
					z-index: 99;
					padding-bottom: 14px;
				}
				.code-snippet-holder{
					position: relative;
					transition: 0.3s ease all;
					margin-top: 10px;
					border-radius: 5px;
					border: 1px solid #606060;
				}
				.code-snippet-holder:hover .top-code-bar{
					opacity:1;
				}
				.cm-s-darcula.CodeMirror {
					margin: 0 10px;
				}
				.quality-toaster{
					position: fixed;
					bottom: 10px;
					left: -400px;
					background-color:var(--vscode-editor-background);
					border-radius: 5px;
					border: 1px solid #363636;
					padding: 5px;
					transition:0.3s ease all;
					z-index:99;
					width: 240px;
				}
				.quality-toaster.active{
					left: 10px;
				}
		
				.toaster-text{
					margin-bottom: 10px;
					text-align: center;
				}
		
				.toaster-icon {
					width: 35px;
					padding:5px;
					transition:0.3s ease all;
					border-radius:50%;
					cursor: pointer;
				}
				.toaster-icon:hover {
					background-color: #202938;
				}
		
				.icons-holder{
					display: flex;
					align-items: center;
					justify-content: center;
					gap:20px;
				}

				.suggestion-tab{
					width:fit-content;
					margin:0;
				}
				.suggestion-tab:hover{
					opacity:0.5
				}
				.examples{
					gap:5px;
					display: flex;
   					flex-direction: column;
					padding: 0 14px;
				}
			</style>
			<div class="holder">
				<div class="search-page">
					<div class="input-container">
						<input
							type="text"
							id = "codesearch-input"
							class="search-input input-style"
							placeholder="Search for Code"
						/>
						<img class="loader-icon input-icon" style="cursor: pointer" class="btn-search" src="${loaderImgSrc}">
						<img class="search-icon input-icon active" style="cursor: pointer" class="btn-search" src="${searchIconSrc}">
					</div>
					<div class="examples">
						<div class="examples-title">Here are some suggestions</div>
						<div class='result-tab active suggestion-tab'>create a stripe customer in python</div>
						<div class='result-tab active suggestion-tab'>create an express server in node js</div>
					</div>
					<div class="result-holder"></div>
				</div>
			</div>
			<script src="https://code.jquery.com/jquery-3.6.3.js" integrity="sha256-nQLuAZGRRcILA+6dMBOvcRh5Pe310sBpanc6+QBmyVM=" crossorigin="anonymous"></script>
			<script>
				(function() {
					const vscode = acquireVsCodeApi();
							
					function postMessage(obj){
						vscode.postMessage(obj)
					}
					function getCodeLanguage(fileExtension){
						var language = "javascript"
						var stringLanguage = language
						if(fileExtension === "py"){
							language = "python"
							stringLanguage = "python"
						} else if(fileExtension === "ts"){
							language = "text/typescript"
							stringLanguage = "typescript"
						} else if(fileExtension === "html"){
							language = "htmlmixed"
							stringLanguage = "html"
						} else if(fileExtension === "css"){
							language = "css"
							stringLanguage = "css"
						} else if(fileExtension === "php"){
							language = "php"
							stringLanguage = "php"
						} else if (fileExtension === "cs") {
							language = "text/x-csharp"
							stringLanguage = "csharp"
						} else if (fileExtension === "java") {
							language = "text/x-java"
							stringLanguage = "java"
						} else if (fileExtension === "scala") {
							language = "text/x-scala"
							stringLanguage = "scala"
						} else if (fileExtension === "ceylon") {
							language = "text/x-ceylon"
							stringLanguage = "java"
						} else if (fileExtension === "h"){
							language = "text/x-csrc"
							stringLanguage = "c"
						} else if (fileExtension === "kt" || fileExtension === "kts"){
							language = "kotlin"
							stringLanguage = "java"
						} else if (fileExtension === "cpp" || fileExtension === "c++"){
							language = "text/x-c++src"
							stringLanguage = "cpp"
						}
						return [language, stringLanguage]
					}
					const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
					
					//variables defined for feedback codesearch
					let lastAnswer = ""
					let lastQuery = ""
					let lastViewedResultRank = 0

					function removeSuggestions(){
						$(".examples").remove()
					}
					$(".suggestion-tab").on("click", function(){
						if(!isLoading){
							const query = $(this).text()
							$(".search-input").val(query)
							showLoader()
							postMessage({command:"fetchCode", query})
						}
					})

					function showCode(data){
						const {allResults, code, query} = data
						if(allResults.length){
							removeSuggestions()
						}
						if(query){
							$(".search-input").val(query)
						}
						const $holder = $(".result-holder")
						$holder.empty()
						
						//adding holders from the multi results tabs
						const $tabHolder = $("<div class='result-tab-holder'></div>")
						const $codeHolder = $("<div class='result-code-holder'></div>")
						$holder.append($tabHolder)
						$holder.append($codeHolder)
						
						//display the tabs for multi results
						if (allResults && allResults.length > 1){
							allResults.forEach((tab, idx)=>{
								var resClass = ""
								if(!idx){
									resClass = "active"
								}
								const $tab = $("<div class='result-tab "+resClass+"'>Result "+(idx + 1)+"</div>")
								$tabHolder.append($tab)
								$tab.on("click", function(){
									$codeHolder.empty()
									$(".result-tab").removeClass("active")
									$(this).addClass("active")
									postMessage({command:"otherResults", url: allResults[idx]})
									lastViewedResultRank = idx
								})
							})
						}

						showCodePart(code) // display the code comment array in the view
						
						//trigger the display or hide of the feedback toaster
						if(code && code.length > 0){
							showFeedbackToaster()
						}
						else{
							hideQualityToaster()
						}
					}

					function showCodePart(dataArr){
						// if (dataArr == ''){
						// 	dataArr = [['//Try another search', '']]
						// }
						const $codeHolder = $(".result-code-holder")
						if (dataArr){
							lastAnswer = dataArr
							dataArr.forEach((arr, idx)=>{
								var $comment
								var $code
								const comment = arr[1].trim()
								const code = arr[0].trim()
								const $el = $('<div class="el-holder"></div>')
								if(comment.length > 0){
									$comment = $('<div class="code-comment">'+comment+'</div>')
									$el.append($comment)
								}
								if(code.length > 0){
									$code = $('<div class="code-snippet-holder"><div class="top-code-bar"><div class="copy-text">Copied!</div><img src="${copyImgSrc}" class="code-copy-img" /></div><textarea class="code-snippet">'+code+'</textarea></div>')
									$el.append($code)
									$code.find(".code-copy-img").on("click", function(){
										navigator.clipboard.writeText(code).then(() => {
											$code.find(".copy-text").addClass("active")
											setTimeout(()=>{
												$code.find(".copy-text").removeClass("active")
											},2000)
										})
									})
								}
								$codeHolder.append($el)
								if(code.length > 0){
									const codeMirrorEditor = CodeMirror.fromTextArea($el.find(".code-snippet")[0], {
										lineNumbers: true,
										theme:"darcula",
										mode: "javascript",
										viewportMargin: Infinity,
										readOnly:true
									})
								}
							})
						}
					}
					function showLoader(){
						isLoading = true
						$(".loader-icon").addClass("active")
						$(".search-icon").removeClass("active")
					}
					function hideLoader(){
						isLoading = false
						$(".loader-icon").removeClass("active")
						$(".search-icon").addClass("active")
					}
					var isLoading = false
					$(document).on("keydown", ".search-input", function(e){
						const key = e.key
						if(key === "Enter" && !isLoading){
							const query = $(this).val()
							if(query){
								showLoader()
								postMessage({command:"fetchCode", query})
							}
						}
					})
					function getCode(){
						postMessage({command:"getCode"})
					}

					//functions to show and hide the feedback for code search
					function showQualityToaster(){
						lastQuery = $(".search-input").val().trim()
						postMessage({command:"showQualityToaster", answer: lastAnswer, query: lastQuery})
					}
					function showFeedbackToaster(){
						if(!$(".quality-toaster").length){
							const $el = $('<div class="quality-toaster"><div class="toaster-text">How was the quality of your answer?</div><div class="icons-holder"><img src="${downImgSrc}" class="bad-icon toaster-icon"><img src="${upImgSrc}" class="good-icon toaster-icon"></div></div>')
				
							$el.find(".toaster-icon").on("click", function(){
								var type = '1' // 1 means thumbs up
								if($(this).hasClass("bad-icon")){
									type = '-1' // -1 is thumbs down
								}
								let currentQuery = document.getElementById('codesearch-input').value
								postMessage({command:"answerQuality", type, query: currentQuery, answer: lastAnswer, lastViewedResultRank})
								qualityToasterSuccess()
							})
					
							$("body").prepend($el)
							setTimeout(() => {
								$(".quality-toaster").addClass("active")
							}, 50);	
						}
					}
				
					function hideQualityToaster(instant){
						var timeToRemove = 1000
						if(instant){
							timeToRemove = 0
						}
						setTimeout(() => {
							setTimeout(()=>{$(".quality-toaster").remove()},300)
							$(".quality-toaster").removeClass("active")
						}, timeToRemove);
					}
					function qualityToasterSuccess(){
						$(".quality-toaster").find(".toaster-text").text("Thank you!")
						$(".quality-toaster").find(".icons-holder").empty()
						$(".quality-toaster").find(".icons-holder").append('<img src="${checkImgSrc}" class="toaster-icon">')
						hideQualityToaster()
					}

					window.addEventListener('message', event => {
						const data = event.data
						if(data.command == "showCode"){
							showCode(data)
							hideLoader()
						}else if(data.command === "showCodePart"){
							showCodePart(data.result.response)
						}
					})
					getCode()
					
					//auto focus search box on view load
					document.getElementById('codesearch-input').focus()
				}())
			</script>
		</body>
		</html>
		`
	}

	function removeHistoryItem(key) {
		var savedLines = JSON.parse(_.globalState.get("savedSnippets"))
		delete savedLines[key]
		_.globalState.update("savedSnippets", JSON.stringify(savedLines))
	}
	function publishHistoryItem(key, updatePublishStatus) {
		var savedLines = JSON.parse(_.globalState.get("savedSnippets"))
		if (savedLines[key]['uId'] == undefined) savedLines[key]['uId'] = uuid()
		savedLines[key]['publish'] = updatePublishStatus
		_.globalState.update("savedSnippets", JSON.stringify(savedLines))
		publishSnippet(savedLines[key])
	}
	function editHistoryItem(data) {
		const { key, newValue } = data
		var savedLines = JSON.parse(_.globalState.get("savedSnippets"))
		const newDate = new Date().getTime()
		savedLines[newValue] = {
			addedAt: newDate,
			lastUsed: newDate,
			language: savedLines[key].language,
			text: savedLines[key].text
		}
		delete savedLines[key]
		_.globalState.update("savedSnippets", JSON.stringify(savedLines))
	}

	function getCodeSearchView(panel) {
		return `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">

			<title>Blackbox View Test</title>

			<link href="${stylesSrc}" type="text/css" rel="stylesheet"/>
			<script src="${codemirrorJsSrc}"></script>
			<link rel="stylesheet" href="${codemirrorStylesSrc}" />
			<script src="${codemirrorModeJsSrc}"></script>
			<script src="${codemirrorModePySrc}"></script>
			<script src="${codemirrorModeClikeSrc}"></script>
			<script src="${codemirrorModeCssSrc}"></script>
			<script src="${codemirrorModeHtmlMixedSrc}"></script>
			<script src="${codemirrorModePhpSrc}"></script>
			<script src="${codemirrorModeSimpleSrc}"></script>
			<script src="${codemirrorModeXmlSrc}"></script>
			<script src="${codeMirrorSearchCursorSrc}"></script>
			<link rel="stylesheet" href="${codemirrorThemeSrc}" />
		</head>
		<body>
			<style>
				* {
					padding: 0;
					margin: 0;
					box-sizing: border-box;
				}
		
				.input-style {
					width: 100%;
					margin: 10px 0;
					outline: none;
					border: 0;
					background-color: #ffffff17;
					padding: 5px;
					color: #fff;
					outline-color:rgb(14, 99, 156)!important;
				}

				.CodeMirror {
					height: auto;
					background-color: transparent !important;
				}
				.CodeMirror-gutters {
					background-color: transparent !important;
					border-right: 0 !important;
				}
				.CodeMirror-linenumbers {
					padding-right: 20px;
				}

				.result-holder{
					border-bottom: 1px solid #565656;
					margin-bottom: 47px;
				}

				.highlight {
					background-color: rgba(17, 119, 187, 0.5);
				}

				.cm-s-darcula span.cm-property{
					color:#ff7b72;
				}

				.cm-s-darcula span.cm-string{
					color:#A9B7C6;
				}

				.input-container{
					padding: 14px;
					position:sticky;
					top:0;
					z-index: 999;
					border-radius: 0 0 5px 5px;
					display: flex;
					align-items: center;
					background-color:var(--vscode-editor-background);
				}
				.input-icon{
					cursor: pointer;
					position: absolute;
					top: 50%;
					transform: translateY(-50%);
					right: 20px;
					width: 40px;
				}

				.search-icon{
					cursor: pointer;
					width: 15px;
				}

				.loader-icon{
					cursor: pointer;
					right: 50px;
					width: 28px;
					display:none;
				}
				.loader-icon.active{
					display:block;
				}
				.CodeMirror {
					height: auto;
					background-color: transparent !important;
				}
				.CodeMirror-gutters {
					background-color: transparent !important;
					border-right: 0 !important;
				}-
				.CodeMirror-linenumbers {
					padding-right: 20px;
				}
				.highlight {
					background-color: rgba(17, 119, 187, 0.5);
				}
				.cm-s-darcula span.cm-property{
					color:#ff7b72;
				}
				.cm-s-darcula span.cm-string{
					color:#A9B7C6;
				}
				.search-page{
					display:flex;
					flex-direction:column;
					gap:30px;
					padding:15px 50px;
				}
				.CodeMirror-gutter-elt{
					text-align: left;
					padding: 0;
				}
				.top-code-bar{
					display: flex;
					align-items: center;
					justify-content: flex-end;
					border-radius: 5px 5px 0 0;
					height:18px;
				}
				.code-copy-img{
					width: 15px;
    				cursor: pointer;
				}
				.copy-text{
					font-size:10px;
					display:none
				}
				.copy-text.active{
					display:block
				}
			</style>
			<div class="holder">
				<div class="input-container">
					<input
						type="text"
						id="input-search"
						class="search-input input-style"
						placeholder="Search for Code (For example: 'how to upload files to google drive in nodejs')"
					/>
					<img class="loader-icon input-icon" style="cursor: pointer" class="btn-search" src="${loaderImgSrc}">
					<img class="search-icon input-icon" style="cursor: pointer" class="btn-search" src="${searchIconSrc}">
				</div>
				<div class="search-page"></div>
			</div>
			<script src="https://code.jquery.com/jquery-3.6.3.js" integrity="sha256-nQLuAZGRRcILA+6dMBOvcRh5Pe310sBpanc6+QBmyVM=" crossorigin="anonymous"></script>
			<script>
				(function() {
					const vscode = acquireVsCodeApi();
							
					function postMessage(obj){
						vscode.postMessage(obj)
					}

					var isLoading = false
					$(document).on("keydown",".search-input", function(e){
						const key = e.key
						if(key === "Enter" && !isLoading){
							const query = $(this).val()
							if(query){
								isLoading = true
								$(".loader-icon").addClass("active")
								postMessage({
									command:"searchCode",
									query
								})
							}
						}
					})
					$(document).on("click",".search-icon", function(e){
						if(!isLoading){
							const query = $(".search-input").val()
							if(query){
								isLoading = true
								$(".loader-icon").addClass("active")
								postMessage({
									command:"searchCode",
									query
								})
							}
						}
					})
					function getCodeLanguage(fileExtension){
						var language = "javascript"
						var stringLanguage = language
						if(fileExtension === "py"){
							language = "python"
							stringLanguage = "python"
						} else if(fileExtension === "ts"){
							language = "text/typescript"
							stringLanguage = "typescript"
						} else if(fileExtension === "html"){
							language = "htmlmixed"
							stringLanguage = "html"
						} else if(fileExtension === "css"){
							language = "css"
							stringLanguage = "css"
						} else if(fileExtension === "php"){
							language = "php"
							stringLanguage = "php"
						} else if (fileExtension === "cs") {
							language = "text/x-csharp"
							stringLanguage = "csharp"
						} else if (fileExtension === "java") {
							language = "text/x-java"
							stringLanguage = "java"
						} else if (fileExtension === "scala") {
							language = "text/x-scala"
							stringLanguage = "scala"
						} else if (fileExtension === "ceylon") {
							language = "text/x-ceylon"
							stringLanguage = "java"
						} else if (fileExtension === "h"){
							language = "text/x-csrc"
							stringLanguage = "c"
						} else if (fileExtension === "kt" || fileExtension === "kts"){
							language = "kotlin"
							stringLanguage = "java"
						} else if (fileExtension === "cpp" || fileExtension === "c++"){
							language = "text/x-c++src"
							stringLanguage = "cpp"
						}

						return [language, stringLanguage]
					}
					function showCode(code){
						const $holder = $(".search-page")
						$holder.empty()
						code.forEach((arr, idx)=>{
							var $comment
							var $code
							const comment = arr[1].trim()
							const code = arr[0].trim()
							const $el = $('<div class="el-holder"></div>')
							if(comment.length > 0){
								$comment = $('<div class="code-comment">'+comment+'</div>')
								$el.append($comment)
							}
							if(code.length > 0){
								$code = $('<div class="code-snippet-holder"><div class="top-code-bar"><div class="copy-text">Copied!</div></div><textarea class="code-snippet">'+code+'</textarea></div>')
								$el.append($code)
								$code.find(".code-copy-img").on("click", function(){
									navigator.clipboard.writeText(code).then(() => {
										$code.find(".copy-text").addClass("active")
										setTimeout(()=>{
											$code.find(".copy-text").removeClass("active")
										},2000)
									})
								})
							}
							$holder.append($el)
							if(code.length > 0){
								const codeMirrorEditor = CodeMirror.fromTextArea($el.find(".code-snippet")[0], {
									lineNumbers: true,
									theme:"darcula",
									mode: "javascript",
									viewportMargin: Infinity,
									readOnly:true
								})
							}
						})
					}
					window.addEventListener('message', event => {
						const data = event.data
						if(data.command == "showCode"){
							showCode(data.codes)
							isLoading = false
							$(".loader-icon").removeClass("active")
						}
					})
					document.getElementById('input-search').focus()
				}())
			</script>
		</body>
		</html>
		`
	}

	function getHistorySearchView() {
		return `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Blackbox View Test</title>
			<link href="${stylesSrc}" type="text/css" rel="stylesheet"/>
			<script src="${codemirrorJsSrc}"></script>
			<link rel="stylesheet" href="${codemirrorStylesSrc}" />
			<script src="${codemirrorModeJsSrc}"></script>
			<script src="${codemirrorModePySrc}"></script>
			<script src="${codemirrorModeClikeSrc}"></script>
			<script src="${codemirrorModeCssSrc}"></script>
			<script src="${codemirrorModeHtmlMixedSrc}"></script>
			<script src="${codemirrorModePhpSrc}"></script>
			<script src="${codemirrorModeSimpleSrc}"></script>
			<script src="${codemirrorModeXmlSrc}"></script>
			<script src="${codeMirrorSearchCursorSrc}"></script>
			<link rel="stylesheet" href="${codemirrorThemeSrc}" />
		</head>
		<body>
			<style>
				* {
					padding: 0;
					margin: 0;
					box-sizing: border-box;
				}
		
				.input-style {
					width: 100%;
					margin: 10px 0;
					outline: none;
					border: 0;
					background-color: #ffffff17;
					padding: 10px;
					color: #fff;
					outline-color:rgb(14, 99, 156)!important;
					border-radius:5px;
					padding-left: 35px;
					margin-right:10px;
				}
				.CodeMirror {
					height: auto;
					background-color: transparent !important;
				}
				.CodeMirror-gutters {
					background-color: transparent !important;
					border-right: 0 !important;
				}
				.CodeMirror-linenumbers {
					padding-right: 20px;
				}
				.result-holder{
					border-bottom: 1px solid #5656564d;
					transition:0.3s ease all;
				}
				.result-holder:hover{
					background-color:#ffffff0f;
				}
				.result-holder:hover .btn-container{
					visibility:visible
				}
				.highlight {
					background-color: rgba(17, 119, 187, 0.5);
				}
				.cm-s-darcula span.cm-property{
					color:#ff7b72;
				}
				.cm-s-darcula span.cm-string{
					color:#A9B7C6;
				}
				.input-container{
					padding: 14px;
					position: absolute;
					top: 50%;
					background-color: transparent;
					z-index: 999;
					border-radius: 0 0 5px 5px;
					width: 100%;
					transform: translateY(-50%);
					transition:0.3s ease all;
					max-width:60%
				}
				.input-icon{
					cursor: pointer;
					position: absolute;
					top: 50%;
					transform: translateY(-50%);
					right: 20px;
					width: 40px;
				}
				.search-icon{
					cursor: pointer;
					width: 15px;
					right:unset;
					left:10px;
				}
				.loader-icon{
					cursor: pointer;
					right: 20px;
					width: 28px;
					display:none;
				}
				.loader-icon.active{
					display:block;
				}
				.suggestion{
					cursor:pointer;
					font-size: 14px;
					color: #cfcfcf;
					background-color: #ffffff17;
					padding: 5px;
					border-radius: 5px;
				}
				.example{
					font-size: 12px;
					color: #a3a3a3;
				}
				.outer-holder{
					display: flex;
					align-items: center;
					justify-content: center;
					flex-direction:column;
				}
				.outer-holder.active{
					position:sticky;
					top:0;
					background-color:var(--vscode-editor-background);
					z-index:99;
				}
				.outer-holder.active .suggestion-holder{
					display:none;
				}
				.outer-holder.active .blackbox-logo{
					display:none;
				}
				.outer-holder.active .input-container{
					transform: unset;
					position:relative;
				}
				.blackbox-logo{
					width: 110px;
				}
				.sug-hold{
					display: flex;
					flex-wrap: wrap;
					gap: 10px;
					margin-top: 10px;
				}
				.btn-container{
					display:flex;
					align-items:center;
					gap:10px;
					justify-content: flex-end;
					visibility: hidden;
				}
				.text-container{
					color:#7e7e7e85;
					font-size:12px;
				}
				.top-container{
					display: flex;
					align-items: center;
					justify-content: space-between;
					margin: 0 20px;
				}
				.btn-option{
					padding:5px;
					cursor:pointer;
					border-radius:4px;
					color:#7e7e7e;
					font-size:12px;
				}
				.btn-option:hover{
					color:rgb(14, 99, 156);
				}
				.special-gutter{
					left: -51px;
					width: 40px;
					position: absolute;
					z-index: 99!important;
					background-color: var(--vscode-editor-background)!important;
					text-align: center!important;
					color:#999;
				}
				.upper-holder{
					display: flex;
					align-items: center;
					width: 100%;
					position:relative;
				}
				.select-style{
					background-color: #212121;
					outline: rgb(14, 99, 156)!important;
					color: #fff;
					border: 1px solid #3e3e3e;
					padding: 5px;
					border-radius: 5px;
				}
				.filter-holder{
					display:flex;
					gap:10px;
					align-items:center;
					justify-content:center;
				}
				.information-line{
					padding: 20px;
					padding-bottom: 0;
					color: #b5b5b5;
				}
				.text-container{
					display: flex;
					align-items: center;
					gap: 10px;
				}
			</style>
			<div class="holder">
				<div class="search-page">
					<div class="outer-holder">
						<div class="input-container">
							<img class="blackbox-logo" style="cursor: pointer" src="${blackboxLogoSrc}">
							<div class="upper-holder">
								<img class="search-icon input-icon" style="cursor: pointer" src="${searchIconSrc}">
								<input
									type="text"
									class="search-input input-style"
									style="width:70%"
									placeholder="Search blackbox"
								/>
								<img class="loader-icon input-icon" src="${loaderImgSrc}">
								<a href="https://www.youtube.com/watch?v=a4v9N7_WXo8">How it Works</a>
							</div>
							<div class="suggestion-holder">
								<div class="example"><b>Search Examples: </b>Search 100M+ Open source repos</div>
								<div class="sug-hold">
									<div class="suggestion">Stripe.customer.create</div>
									<div class="suggestion">Import torch</div>
									<div class="suggestion">console.log</div>
									<div class="suggestion">public static void</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<script src="https://code.jquery.com/jquery-3.6.3.js" integrity="sha256-nQLuAZGRRcILA+6dMBOvcRh5Pe310sBpanc6+QBmyVM=" crossorigin="anonymous"></script>
			<script>
				(function() {
					const vscode = acquireVsCodeApi();
							
					function postMessage(obj){
						vscode.postMessage(obj)
					}
					$(document).on("click", ".suggestion", function(e){
						const query = $(this).text()
						if(query){
							$(".search-input").val(query)
							sendQuery(query)
						}
					})
					function searchHistory(query){
						$(".CodeMirror").each((idx, el)=>{
							const editor = el.CodeMirror
							editor.doc.getAllMarks().forEach(marker => marker.clear())
							$(el).closest(".result-holder").show()
							if(query){
								var words = query.split('.').join('||||').split(' ').join('||||').split('||||')
								var found = false
								words.forEach((word)=>{
									var cursor = editor.getSearchCursor(word)
									while (cursor.findNext()) {
										found = true
										editor.markText(
											cursor.from(),
											cursor.to(),
											{ className: 'highlight' }
										);
									}
								})
								if(!found){
									$(el).closest(".result-holder").hide()
								}
							}
						})
					}
					function showHistory(){
						$(".outer-holder").addClass("active")
						isLoading = true
						$(".loader-icon").addClass("active")
						postMessage({
							command:"showHistory"
						})
					}
					showHistory()
					function sendQuery(query){
						isLoading = true
						$(".loader-icon").addClass("active")
						searchHistory(query)
						isLoading = false
						$(".loader-icon").removeClass("active")
					}
					var isLoading = false
					$(document).on("keydown",".search-input", function(e){
						const key = e.key
						if(key === "Enter" && !isLoading){
							const query = $(this).val()
							sendQuery(query)
						}
					})
					$(document).on("click",".search-icon", function(e){
						if(!isLoading){
							const query = $(".search-input").val()
							sendQuery(query)
						}
					})
					function getCodeLanguage(fileExtension){
						var language = "javascript"
						var stringLanguage = language
						if(fileExtension === "python"){
							language = "python"
							stringLanguage = "python"
						} else if(fileExtension === "typescript"){
							language = "text/typescript"
							stringLanguage = "typescript"
						} else if(fileExtension === "html"){
							language = "htmlmixed"
							stringLanguage = "html"
						} else if(fileExtension === "css"){
							language = "css"
							stringLanguage = "css"
						} else if(fileExtension === "php"){
							language = "php"
							stringLanguage = "php"
						} else if (fileExtension === "csharp") {
							language = "text/x-csharp"
							stringLanguage = "csharp"
						} else if (fileExtension === "java") {
							language = "text/x-java"
							stringLanguage = "java"
						} else if (fileExtension === "scala") {
							language = "text/x-scala"
							stringLanguage = "scala"
						} else if (fileExtension === "ceylon") {
							language = "text/x-ceylon"
							stringLanguage = "java"
						} else if (fileExtension === "c"){
							language = "text/x-csrc"
							stringLanguage = "c"
						} else if (fileExtension === "kotlin"){
							language = "kotlin"
							stringLanguage = "java"
						} else if (fileExtension === "cpp" || fileExtension === "c++"){
							language = "text/x-c++src"
							stringLanguage = "cpp"
						}
						return [language, stringLanguage]
					}
					const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
					function showCode(data){
						let {codes, query, lineNumbers, timings, languages, publishStatus} = data
						let publishedItems = publishStatus.reverse()
						timings = timings.reverse()
						$(".result-holder").remove()
						codes.forEach((codeVal, idx)=>{
							var codeInformation = ""
							var code = codeVal
							const $holder = $('<div data-id='+idx+' class="result-holder"></div>')
							const $el = $('<textarea class="code-area"></textarea>')
							let collapsedCode = code
							var showExpand = false
							if(collapsedCode.split("\\n").length > 10){
								showExpand = true
								collapsedCode = code.split("\\n").slice(0, 9).join("\\n")
							}
							
							$el.val(collapsedCode)
							const language = languages.reverse()[idx]
							var langArr = getCodeLanguage(language)
							$holder.append($el)
							$(".search-page").append($holder)
							const codeMirrorEditor = CodeMirror.fromTextArea($el[0], {
								lineNumbers: true,
								gutters: ["CodeMirror-linenumbers", "lineLength"],
								theme:"darcula",
								mode: langArr[0],
								viewportMargin: Infinity,
								readOnly: true
							})
							var savedValue = code
							const idxTime = new Date(timings[idx])
							const idxDate = monthNames[idxTime.getMonth()] + " "+ idxTime.getDate()+", "+idxTime.getFullYear() +" at "+ idxTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
							let publishDiv = ''
							if (publishedItems[idx] == true){
								publishDiv = '<div class="btn-unpublish btn-all-publishstatus btn-option">Unpublish</div>'
							}else{
								publishDiv = '<div class="btn-publish btn-all-publishstatus btn-option">Publish</div>'
							}
							var expandDiv = ""
							if(showExpand){
								expandDiv = '<div class="btn-expand btn-option">Expand</div>'
							}
							const $btns = $('<div class="top-container"><div class="text-container"><div class="top-date">'+idxDate+'</div><div class="top-language">'+language+'</div></div><div class="btn-container"><div class="btn-delete btn-option">Delete</div><div class="btn-edit btn-option">Edit</div>'+expandDiv+''+publishDiv+'</div></div>')
							$holder.prepend($btns)
							$btns.find(".btn-option").on("click", function(){
								if($(this).hasClass("btn-delete")){
									postMessage({
										command:"deleteHistoryItem",
										key: savedValue
									})
									$(this).closest(".result-holder").remove()
								}
								else if($(this).hasClass("btn-publish")){
									$(this).text("Unpublish")
									$(this).removeClass("btn-publish")
									$(this).addClass("btn-unpublish")
									postMessage({
										command:"publishHistoryItem",
										key: savedValue,
										updatePublishStatus: true
									})
								}
								else if($(this).hasClass("btn-unpublish")){
									$(this).text("Publish")
									$(this).removeClass("btn-unpublish")
									$(this).addClass("btn-publish")
									postMessage({
										command:"publishHistoryItem",
										key: savedValue,
										updatePublishStatus: false
									})
								}
								else if($(this).hasClass("btn-edit")){
									$(this).text("Save")
									$(this).removeClass("btn-edit")
									$(this).addClass("btn-save")
									$holder.addClass("stop-show")
									codeMirrorEditor.setOption("readOnly", false)
								}
								else if($(this).hasClass("btn-save")){
									const newValue = codeMirrorEditor.getValue()
									codeMirrorEditor.setOption("readOnly", true)
									$holder.removeClass("stop-show")
									$(this).text("Edit")
									$(this).addClass("btn-edit")
									$(this).removeClass("btn-save")
									postMessage({
										command:"editHistoryItem",
										key: savedValue,
										newValue
									})
								}
								else if($(this).hasClass("btn-expand")){
									codeMirrorEditor.setValue(code)
									$(this).text("Collapse")
									$(this).removeClass("btn-expand")
									$(this).addClass("btn-collapse")
								}
								else if($(this).hasClass("btn-collapse")){
									codeMirrorEditor.setValue(collapsedCode)
									$(this).text("Expand")
									$(this).removeClass("btn-collapse")
									$(this).addClass("btn-expand")
								}
							})
							
							$holder.on("click", function(e){
								if(!$(e.target).hasClass("btn-option") && !$(this).hasClass("stop-show")){
									const codeId = $($holder).attr("data-id")
									postMessage({
										command:"showFullCode",
										codeId,
										languageId: langArr[1]
									})
								}
							})
						})
					}
					window.addEventListener('message', event => {
						const data = event.data
						if(data.command == "showCode"){
							showCode(data)
							isLoading = false
							$(".loader-icon").removeClass("active")
						}
					})
				}())
			</script>
		</body>
		</html>
		`
	}

	async function addEnableAC(userId) {
		const response = await (0, node_fetch_1.default)(
			"https://www.useblackbox.io/addenableac",
			{
				method: "POST",
				body: JSON.stringify({ userId: userId }),
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json"
				}
			}
		)
	}
	async function selectionFct(event) {
		try{
			const response = await (0, node_fetch_1.default)(
				"https://www.useblackbox.io/selection",
				{
					method: "POST",
					body: JSON.stringify({
						userId: userId,
						selected: event,
						source: "visual studio"
					}),
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json"
					}
				}
			)
			try{
				const result = await response.json()
			}catch(e){
				console.log(e)
			}
		}catch(e){
			console.log(e)
		}
	}

	//function to verify on load if code autocomplete disabled 
	async function isCodeAutocompleteDisabled(userId) {
		//remove '"' from start and end of userId
		if (userId.includes('"')) userId = userId.replace(/^["']|["']$/g, '')
		try{
			const response = await (0, node_fetch_1.default)(
				`https://www.useblackbox.io/isdisabled/${userId}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json"
					}
				}
			)
			try{
				const result = await response.json()
				if (result['status']==false){
					_.globalState.update("extensionStatus", true)
					EXTENSION_STATUS = true

					if (result['premium']==true){
						_.globalState.update("premiumStatus", true)
						premium_status = true
					}
				}else{
					_.globalState.update("extensionStatus", false)
					EXTENSION_STATUS = false
				}
			}catch(e){
				console.log(e)
			}
		}catch(e){
			console.log(e)
		}
	}

	async function is_chat_stream(){
		try{
			const response = await (0, node_fetch_1.default)(
				'https://www.useblackbox.io/chatstreamstatus',
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json"
					}
				}
			)
			try{
				const result = await response.json()
				if (result['status'] != undefined){
					if(result['status']) is_stream = true
					else is_stream = false
				}else{
					is_stream=false
				}
			}catch(e){
				is_stream=false
			}
		}catch(e){
			is_stream=false
		}
	}

	async function publishSnippet(snippetData) {
		const response = await (0, node_fetch_1.default)(
			"https://www.useblackbox.io/publishsnippet",
			{
				method: "POST",
				body: JSON.stringify({
					snippetData: snippetData,
				}),
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json"
				}
			}
		)
		const result = await response.json()
	}
	async function acceptSuggestion(prompt, suggestion, languageId) {
		try{
			const response = await (0, node_fetch_1.default)(
				"https://www.useblackbox.io/acceptcc",
				{
					method: "POST",
					body: JSON.stringify({
						userId: gloablUserId,
						prompt: prompt,
						suggestion: suggestion,
						languageId: languageId
					}),
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json"
					}
				}
			)
			const result = await response.json()
		}catch(e){
			console.log(e)
		}
	}
	async function signinFct(userId) {
		// console.log(`==> Green: Start signin check`)
		const response = await (0, node_fetch_1.default)(
			"https://www.useblackbox.io/signinvscode",
			{
				method: "POST",
				body: JSON.stringify({ userId: userId }),
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json"
				}
			}
		)
		const result = await response.json()
		// console.log(`==> Green: Signin - `, result)
		if (result.status == "success") {
			gloablUserId = result.userId
			_.globalState.update("userId", JSON.stringify(result.userId))
			userId = result.userId
			// socket.emit("getUserName", { userId })
			vscode.window.showInformationMessage(`You're now logged in`)
			//activate for premium profile
			if (result.isPremium == true){
				_.globalState.update("extensionStatus", true)
				EXTENSION_STATUS = true
				vscode.window.showInformationMessage(
					"Blackbox Autocomplete Enabled"
				)
				selectionFct("Autcomplete Enabled")
				_.globalState.update("userId", userId)
				addEnableAC(userId)

				_.globalState.update("premiumStatus", true)
				premium_status = true
			}
		}
	}

	async function upgradeFct(localuserId) {
		const response = await (0, node_fetch_1.default)(
			"https://www.useblackbox.io/upgradevsce",
			{
				method: "POST",
				body: JSON.stringify({ userId: localuserId }),
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json"
				}
			}
		)
		const result = await response.json()
		userId = result.userId
		_.globalState.update("extensionStatus", true)
		EXTENSION_STATUS = true
		_.globalState.update("userId", JSON.stringify(result.userId))
	}

	async function openInPage(content, languageId = "") {
		const filePath = path.join(__dirname, "blackbox-snippets")
		fs.writeFile(filePath, content, async function (err) {
			if (err) {
				return console.log(err)
			}
			var showPage = true
			vscode.workspace.textDocuments.forEach((doc) => {
				if (doc.fileName.includes("blackbox-snippets.git")) {
					showPage = false
				}
			})

			const document = await vscode.workspace.openTextDocument(
				filePath,
				{}
			)

			if (showPage) {
				vscode.window.showTextDocument(document, {
					viewColumn: vscode.ViewColumn.Beside
				})
			}

			if (languageId) {
				vscode.languages.setTextDocumentLanguage(document, languageId)
			}
		})
	}

	function getSelectedText() {
		var editor = vscode.window.activeTextEditor
		if (!editor) {
			return null
		}

		var selection = editor.selection
		var text = editor.document.getText(selection)
		return text
	}
	function addItem(text) {
		text = text.trim()
		var oldArr = _.globalState.get("savedSnippets")
		if (oldArr === undefined) {
			oldArr = {}
		} else {
			oldArr = JSON.parse(oldArr)
		}
		if (oldArr[text.trim()] === undefined) {
			const newArr = { ...oldArr }
			const newTime = new Date().getTime()
			newArr[`${text}`] = {
				uses: 2,
				lastUsed: newTime,
				addedAt: newTime,
				text: `${text}`,
				language: vscode.window.activeTextEditor.document.languageId
			}
			// vscode.window.showInformationMessage("Saved snippet!")
			vscode.window.showInformationMessage(
					"Saved Snippet! View All Saved Snippets",
					...["View Snippets"]
				)
				.then(async (option) => {
					if (option === "View Snippets") vscode.commands.executeCommand("blackbox.historySearch")
				})
			selectionFct("Autocomplete Saved Snippet")
			_.globalState.update("savedSnippets", JSON.stringify(newArr))
		}
	}


	async function loginOrSignup() {
		try{
			if (userId.startsWith('"')){
				userId = userId.substring(1, userId.length - 1)
			}
			const response = await (0, node_fetch_1.default)(
				`https://www.useblackbox.io/verify/${userId}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json"
					}
				}
			)
			const result = await response.json()
			if (result) {
				if (result["status"] == "login") {
					vscode.window.showInformationMessage( "Blackbox Code Suggestions (Press Tab to Accept Suggestions)" )

					vscode.window
						.showInformationMessage(
							"Signin to your Blackbox Account",
							...["Signin"]
						)
						.then(async (option) => {
							let loginUserId = userId
							if (loginUserId.startsWith('"')) loginUserId = loginUserId.slice(1, loginUserId.length-1)
							if (option === "Signin") {
								open(
									`https://www.useblackbox.io/signin?vsCode=${loginUserId}`
								)
								signinFct(loginUserId)
							}
						})
				}else{
					_.globalState.update("extensionStatus", true)
					EXTENSION_STATUS = true
					vscode.window.showInformationMessage(
						"Blackbox Autocomplete Enabled"
					)
					selectionFct("Autcomplete Enabled")
					_.globalState.update("userId", userId)
					addEnableAC(userId)
				}
			}
		}catch(e){
			console.log('Error - loginOrSignup', e)
		}
	}
	var panel = null
	function getWebViewContent(page) {
		if (page == "chat") {
			return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<title>Blackbox title</title>
			</head>
			<body>
				<style>
					html,
					body {
						padding: 0;
						margin: 0;
						box-sizing: border-box;
						width: 100%;
						height: 100%;
						overflow: hidden;
						line-height: 20.25px;
						text-align: start;
					}
					body{
						background-color: transparent !important;
					}

					.input-styles {
						margin: 0;
						min-height: 14.5px;
						outline: none !important;
						background-color: transparent;
						padding: 5px;
						color: #fff;
						width: 97%;
						border: 0;
						resize: none;
						margin-top: 10px;
					}
					.input-styles:focus .text-area-holder {
						border: 1px solid rgb(129, 131, 133);
					}
					.chat-connected {
						display: none;
						height: 100%;
						overflow-y: hidden;
						flex-direction: column;
					}
					.chat-connected.active {
						display: flex;
					}
					.thread-connected {
						display: none;
						height: 100%;
						overflow-y: hidden;
						flex-direction: column;
					}
					.thread-connected.active {
						display: flex;
					}
					.lobby {
						display: none;
						height: 80%;
					}
					.lobby.active {
						display: block;
					}

					.btn-holder {
						display: flex;
						justify-content: center;
						gap: 10px;
					}

					.btn-moderator {
						padding: 7px;
						margin: 14px;
						border: 0;
						background-color: rgb(14, 99, 156);
						color: #fff;
						border-radius: 2px;
						cursor: pointer;
						text-align: center;
						height: 21px;
					}
					.btn-moderator:hover {
						background-color: rgba(17, 119, 187);
					}
					
					.btn-default {
						padding: 7px;
						margin: 14px;
						border: 0;
						background-color: rgb(14, 99, 156);
						color: #fff;
						border-radius: 2px;
						cursor: pointer;
						text-align: center;
						height: 21px;
					}
					.btn-default:hover {
						background-color: rgba(17, 119, 187);
					}

					@media (max-width: 250px) {
						.btn-holder {
							flex-direction: column;
						}
					}

					.text-area-holder {
						display: flex;
						justify-content: center;
						flex-direction: column;
						flex-shrink: 0;
						width: 98.7%;
						border: 1px solid rgb(86, 88, 86);
						border-radius: 10px;
						padding: 5px;
						min-height: 80px;
					}

					.conn-input-style {
						width: 97%;
						margin: 10px 0;
						outline: none;
						border: 0;
						background-color: #ffffff17;
						padding: 5px;
						color: #fff;
					}
					.chat-notification {
						color: #eee;
						text-align: center;
					}
					.lobby.invalid .conn-input-style {
						border: 1px solid red;
					}
					.lobby.invalid .error-message {
						display: block;
					}
					.lobby .error-message {
						color: tomato;
						font-size: 12px;
						text-align: center;
						margin-bottom: 10px;
						display: none;
					}

					.add-new-chat {
						display: flex;
						align-items: center;
						justify-content: center;
						flex-direction: column;
						padding: 0 20px;
					}

					.chats-holder {
						max-height: 500px;
						overflow-y: auto;
						overflow-x: hidden;
					}

					::-webkit-scrollbar {
						width: 5px;
					}

					::-webkit-scrollbar-thumb {
						background: #445561;
					}

					::-webkit-scrollbar-thumb:hover {
						background: #445561;
					}

					.all-chats {
						padding: 20px;
					}
					.all-title {
						text-align: center;
						font-size: 20px;
						font-weight: bold;
						margin-bottom: 20px;
					}

					.chat-back {
						border-radius: 5px;
						padding: 10px 20px;
						transition: 0.3s ease all;
						cursor: pointer;
						position: relative;
					}
					.chat-back:hover {
						background-color: #ffffff17;
					}
					.chat-back .badge {
						right: 0;
						top: 0;
					}
					.thread-back {
						border-radius: 5px;
						padding: 10px 20px;
						transition: 0.3s ease all;
						cursor: pointer;
						position: relative;
					}
					.thread-back:hover {
						background-color: #ffffff17;
					}
					.thread-back .badge {
						right: 0;
						top: 0;
					}
					.badge {
						position: absolute;
						background-color: #3794ff;
						border-radius: 50%;
						width: fit-content;
						padding: 3px;
						font-size: 12px;
						color: #fff;
						width: 10px;
						height: 10px;
						display: flex;
						align-items: center;
						justify-content: center;
						transform: translateY(-50%);
					}
					.badge:empty {
						display: none;
					}
					.numb:empty {
						display: none;
					}

					.chat .right-holder {
						position: relative;
					}
					.chat .badge {
						right: 20px;
					}

					.chats-holder:empty:before {
						content: "No chats";
					}
					.code-block-input {
						cursor: text;
						min-height: 14px;
						height: fit-content;
						max-height: 300px;
						overflow-y: auto;
						tab-size: 1;
					}

					.textBox {
						color: #fff;
						white-space: pre;
						border: 1px solid rgb(77, 77, 77);
						background-color: #2f3138;
						padding: 5px;
						width: 100%;
						border-radius: 5px;
						font-family: monospace;
						tab-size: 7px;
					}
					.invite-form {
						display: flex;
						align-items: center;
					}

					.code-block-btn {
						width: 65px;
						background-color: #282828;
						border: 0;
						outline: none;
						color: #b3b3b3;
						padding: 5px;
						border-radius: 5px;
					}

					.search-bar div {
						width: 100%;
					}

					.search-bar{
						margin: 7px 0;
						position: relative;
						width: 100%;
						display: flex;
						justify-content: center;
						align-items: center;
						padding-right:15px;
					}

					.search-bar div input {
						width: 94.3%;
						border: none;
						outline: none;
						background: transparent !important;
						border-radius: 7px;
						padding: 6px;
						height: 38px;
						font-size: 14px;
						align-items: center;
						color: #e9edef;
						padding-left: 45px;
					}
					.search-bar svg {
						width: 24;
						height: 24;
						vertical-align: middle;
					}

					.search-btn{
						border: none;
						background-color: transparent;
						position: absolute;
						left: 14px;
						top: 14px;
						font-size: 1em;
						color: #aebac1;
						justify-content: center;
						align-items: center;
						transition: .8s all;
						padding:0;
					}

					.chat {
						position: relative;
						width: 97%;
						display: flex;
						align-items: center;
						padding: 15px;
						border-bottom: 0.7px solid #2a3942;
						cursor: pointer;
					}

					.chat:hover {
						background: #ffffff17;
					}

					.imgBox {
						position: relative;
						min-width: 50px;
						height: 50px;
						overflow: hidden;
						border-radius: 50%;
						margin-right: 10px;
						width: 50px;
						height:50px;
						background-color:#000;
						border-radius:50%;
						/* position: absolute;
						top: 0;
						left: 0;
						width: 100%;
						height: 100%;
						object-fit: cover; */
					}

					.chat .head {
						position: relative;
						width: 100%;
						display: flex;
						align-items: center;
						justify-content: space-between;
						margin-bottom: 2px;
					}

					.chat .head h4 {
						font-size: 16px;
						font-weight: 400;
						color: #e9edef;
						letter-spacing: 0.4px;
						margin-bottom: 0;
					}

					.chat .head .time {
						font-size: 11px;
						font-weight: 400;
						color: #8696a0;
						margin-bottom: 0rem;
					}

					.chat .message-chat {
						display: flex;
						align-items: center;
					}

					.chat .message-chat .white-tick {
						color: #8696a0;
					}

					.chat .message-chat .chat-text-icon {
						display: flex;
						width: 100%;
						align-items: center;
						justify-content: space-between;
					}

					.chat .message-chat .chat-text-icon .preview {
						overflow: hidden;
						font-size: 13.5px;
						font-weight: 400;
						color: #8696a0;
						display: -webkit-box;
						-webkit-line-clamp: 1;
						-webkit-box-orient: vertical;
						word-break: break-all;
					}

					.chat .message-chat .chat-text-icon .unread {
						display: flex;
					}

					.numb {
						background: #3794ff;
						color: #fff;
						font-weight: 500;
						min-width: 20px;
						height: 20px;
						border-radius: 50%;
						display: flex;
						justify-content: center;
						align-items: center;
						font-size: 0.75em;
						margin-left: auto;
						margin-right: 7px;
					}

					.white-tick{
						vertical-align: middle;
					}

					.chatBox {
						position: relative;
						flex: 1 1;
						padding: 20px;
						overflow-y: auto;
					}

					.chatBox .chat__date-wrapper {
						text-align: center;
						margin: 10px 0 14px;
						position: relative;
					}

					.chatBox .chat__date {
						background: #1e2a30;
						color: rgba(241, 241, 242, .92);
						display: inline-block;
						font-size: .75rem;
						padding: 7px 10px;
						border-radius: 5px;
					}

					.chatBox .chat-notification {
						background: #1e2a30;
						color: #ffd279;
						font-size: 12.5px;
						text-align: center;
						padding: 5px 12px 6px;
						position: relative;
						margin-bottom: 8px;
						border-radius: 5px;
						line-height: 20px;
					}

					.threadBox {
						position: relative;
						flex: 1 1;
						padding: 20px;
						overflow-y: auto;
					}

					.threadBox .chat__date-wrapper {
						text-align: center;
						margin: 10px 0 14px;
						position: relative;
					}

					.threadBox .chat__date {
						background: #1e2a30;
						color: rgba(241, 241, 242, .92);
						display: inline-block;
						font-size: .75rem;
						padding: 7px 10px;
						border-radius: 5px;
					}

					.threadBox .chat-notification {
						background: #1e2a30;
						color: #ffd279;
						font-size: 12.5px;
						text-align: center;
						padding: 5px 12px 6px;
						position: relative;
						margin-bottom: 8px;
						border-radius: 5px;
						line-height: 20px;
					}

					.sent {
						background: #ffffff17;
						margin-left: auto!important;
					}

					.recieved {
						background: #ffffff17;
						margin-right: auto!important;
					}

					.chatMessage {
						position: relative;
						width: fit-content;
						max-width: 100%;
						padding: 6px 7px 8px 9px;
						border-radius: 7.5px;
						line-height: 20px;
						font-size: 13px;
						color: #e9edef;
						margin: 10px 0;
						width: 97%;
						white-space: pre;
						cursor: pointer;
					}
					.p-rich_text_block {
						text-align: left;
						-webkit-user-select: text;
						user-select: text;
						width: 100%;
						font-family: Monaco,Menlo,Consolas,Courier New,monospace!important;
					}
					.c-mrkdwn__pre {
						padding: 8px;
					}
					.c-mrkdwn__pre, .c-mrkdwn__quote {
						margin-bottom: 4px;
						margin-top: 4px;
					}

					.chatMessage .by{
						color: #8696a0;
						margin-bottom: 5px;
					}

					

					

					.chatMessage .msg-time {
						color: #8696a0;
						font-size: .7rem;
						font-weight: 500;
						text-align: end;
						font-size: 12px;
						margin-top: -3px;
						display:inline-block;
						margin-left: 15px;
					}
					.chatMessage .msg-reply {
						color: #8696a0;
						font-size: .7rem;
						font-weight: 500;
						text-align: left;
						font-size: 12px;
						margin-top: -3px;
						cursor: pointer;
						display:inline-block;
						color: #3794ff
					}
					.msg-reply:hover{
						text-decoration: underline;
					}

					.header {
						position: relative;
						height: 60px;
						background: transparent !important;
						display: flex;
						justify-content: space-between;
						align-items: center;
						padding: 0 15px;
						z-index: 999;
					}
					.thread-header{
						position: relative;
						height: 60px;
						background: transparent !important;
						display: flex;
						justify-content: space-between;
						align-items: center;
						padding: 0 15px;
						z-index: 999;
					}
					.threadMessage {
						position: relative;
						width: fit-content;
						max-width: 100%;
						padding: 6px 7px 8px 9px;
						border-radius: 7.5px;
						line-height: 20px;
						font-size: 13px;
						color: #e9edef;
						margin: 10px 0;
						width: 97%;
						white-space: pre;
					}
					.threadMessage .by{
						color: #8696a0;
						margin-bottom: 5px;
					}
					
					.threadMessage .msg-time {
						color: #8696a0;
						font-size: .7rem;
						font-weight: 500;
						text-align: end;
						font-size: 12px;
						margin-top: -3px;
						display:inline-block;
					}

					.imgText {
						position: relative;
						display: flex;
						justify-content: center;
						align-items: center;
					}

					.userImg {
						position: relative;
						width: 40px;
						height: 40px;
						border-radius: 50%;
						overflow: hidden;
					}

					.imgText .room-id {
						font-weight: 600;
						font-size: 16px;
						line-height: 1.2em;
						color: #e9edef;
					}

					.imgText .room-id span {
						font-weight: 400;
						color: #8696a0;
						font-size: 13px;
					}

					.imgText .thread-id {
						font-weight: 600;
						font-size: 16px;
						line-height: 1.2em;
						color: #e9edef;
					}

					.imgText .thread-id span {
						font-weight: 400;
						color: #8696a0;
						font-size: 13px;
					}

					.chat-side {
						display: flex;
						margin-right: 48px;
					}

					.chat-footer {
						position: relative;
						width: 100%;
						background: transparent !important;
						justify-content: space-between;
						align-items: center;
					}

					.chat-input-wrapper {
						padding: 10px;
						height: 60px;
						position: relative;
						display: -webkit-flex;
						display: flex;
						-webkit-align-items: center;
						align-items: center;
					}
					.thread-input-wrapper {
						padding: 10px;
						height: 60px;
						position: relative;
						display: -webkit-flex;
						display: flex;
						-webkit-align-items: center;
						align-items: center;
					}

					.chat-footer .chat-attach {
						position: relative;
					}

					.chat-footer .icons {
						color: #8696a0;
					}

					.chat-footer .send-message {
						position: relative;
						width: 100%;
						margin: 5px 10px;
						padding: 9px 12px 11px;
						background: #ffffff17;
						border-radius: 6px;
						border: none;
						outline: none;
						color: #e9edef;
						font-size: 14px;
						height: 18px;
						white-space: pre-wrap;
					}

					.thread-footer .chat-attach {
						position: relative;
					}

					.thread-footer .icons {
						color: #8696a0;
					}

					.thread-footer .send-message {
						position: relative;
						width: 100%;
						margin: 5px 10px;
						padding: 9px 12px 11px;
						background: #ffffff17;
						border-radius: 6px;
						border: none;
						outline: none;
						color: #e9edef;
						font-size: 15px;
						height: 18px;
						white-space: pre-wrap;
					}

					.room-status{
						cursor:pointer
					}
					.d-none{
						display:none
					}
					.code-block-input{
						cursor: text;
						min-height:14px;
						height:fit-content;
						max-height:300px;
						overflow-y:auto;
						border-radius: 5px;
						cursor: pointer;
					}
				</style>
				<div class="chat-connected">
						<div class="header">
							<div class="imgText">
								<div class="chat-back">
									<
									<div class="badge"></div>
								</div>
								<div>
									<div class="room-id" style="display: inline-block"></div>
									<div class="btn-moderator" style="display: inline-block">Become Moderator</div>
									<div class="users-count" style="display: none"></div>
								</div>
								
							</div>
							<div class="chat-side">
								<button class="leave-room btn-default" style="display: none">Leave room</button>
							</div>
						</div>
						<div class="invite-form"></div>
						<div class="chatBox chat-area"></div>

						<div class="chat-footer">
							<div class="chat-input-wrapper">

								<textarea
									id="text-area"
									type="text"
									placeholder="Post a question to the community"
									class="send-message text-area input-styles"
								></textarea>
							</div>
						</div>
					</div>
					<div class="thread-connected">
						<div class="thread-header">
							<div class="imgText">
								<div class="thread-back">
									<
									<div class="threadbadge"></div>
								</div>
								<div>
									<div class="thread-id"></div>
								</div>
							</div>
						</div>
						<div class="threadBox thread-area"></div>

						<div class="thread-footer">
							<div class="thread-input-wrapper">

								<textarea
									id="thread-area"
									type="text"
									placeholder="Type a Reply"
									class="send-message text-area input-styles"
								></textarea>
							</div>
						</div>
					</div>
					<div class="lobby active">
						<div class="add-new-chat" style="display: none">
							<span class="disconnect-text"
								>Ask for the room's ID to join (room name)</span
							>
							<input
								type="text"
								class="conn-input conn-input-style"
								id="connection-input"
								placeholder="Room ID"
							/>
							<span class="error-message"></span>
							<div class="btn-holder">
								<button class="connect btn-default">Connect</button>
								<button class="create-room btn-default">
									Create a new room
								</button>
							</div>
						</div>

						<div class="all-chats">
							<div class="all-title">BLACKBOX COMMS<span style="font-size:9px;font-style:italic;" class="all-title">(Beta)</span></div>
							<div style="text-align: left">
								<span style="font-style:italic;" center="">Blackbox COMMS is built to connect developers. Here are 3 tips:
								<ul> <li class="li1" style="margin: 0px; font-variant-numeric: normal; font-variant-east-asian: normal; font-stretch: normal; font-size: 13px; line-height: normal; font-family: &quot;Helvetica Neue&quot;;">Write a brief description of your problem</li> <li class="li1" style="margin: 0px; font-variant-numeric: normal; font-variant-east-asian: normal; font-stretch: normal; font-size: 13px; line-height: normal; font-family: &quot;Helvetica Neue&quot;;">If you already have a code that you tried, share it along with the error you faced</li> <li class="li1" style="margin: 0px; font-variant-numeric: normal; font-variant-east-asian: normal; font-stretch: normal; font-size: 13px; line-height: normal; font-family: &quot;Helvetica Neue&quot;;">Post your question in the right channel</li> </ul>
								</span>
							</div>
							<div class="btn-default btn-refer">
								<span class="btn-refer">Refer a friend</span>
							</div>
							<div style="text-align: left"><span style="font-weight:bold; opacity: 50%; color:#CCCCC" center="">Channels</span></div>
							<div class="chats-holder"></div>
						</div>
					</div>
				<script>
				(function() {
					const vscode = acquireVsCodeApi();
					
					function postMessage(obj){
						vscode.postMessage(obj)
					}

					postMessage("start of file")
					const sendBtn = document.getElementsByClassName('send')[0];
					document.querySelector('.connect').addEventListener("click", connectToRoom);
					document.querySelector('.create-room').addEventListener("click", createNewRoom);
					
					document.addEventListener("click", (e)=>{
						let roomId
						if(e.target.classList.contains("chat") || e.target.classList.contains("head") || e.target.classList.contains("room-name") ){
							let parentElement = e.target
							if (parentElement.classList.contains("head")) parentElement = parentElement.parentElement
							else if (parentElement.classList.contains("room-name")) parentElement = parentElement.parentElement.parentElement
							changeActiveChat(parentElement.getAttribute("data-id"))
							showChat(parentElement.getAttribute("data-id"))
						}
						else if(e.target.classList.contains("chat-back")){
							showLobby()
						} 
						else if(e.target.classList.contains("invite-btn")){
							inviteUser()
						}else if(e.target.classList.contains('msg-reply')){
							let msgId = e.target.getAttribute("msg-id")
							let roomId = document.getElementsByClassName('room-id')[0].innerText.split('#')[1]
							showThread(msgId, roomId)
						}else if(e.target.classList.contains("thread-back")){
							document.querySelector(".thread-area").innerHTML = ""
							document.querySelector(".thread-connected").classList.remove("active")
							document.querySelector(".chat-connected").classList.add("active")
						} else if(e.target.classList.contains("btn-refer") ) {
							postMessage({command: "refer"})
						} else if( e.target.classList.contains('btn-moderator') ) {
							postMessage({command: "moderator"})
						} else if (e.target.classList.contains('chatMessage') || e.target.parentElement.classList.contains('chatMessage')){
							let messageElement
							if ( e.target.classList.contains('chatMessage') ) messageElement = e.target
							else if ( e.target.parentElement.classList.contains('chatMessage') ) messageElement = e.target.parentElement
							let msgId = messageElement.innerHTML.split('id="')[1].split('"')[0]
							let roomId = document.getElementsByClassName('room-id')[0].innerText.split('#')[1]
							showThread(msgId, roomId)
						}
					})
					function uuidv4() {
						return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
						  (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
						);
					}
					
					document.getElementsByClassName('text-area')[0].addEventListener("keydown", (e)=>{
						if(e.key === "Enter"){
							e.preventDefault()
							let roomId = document.getElementsByClassName('room-id')[0].innerText.split('#')[1]
							let msgId = uuidv4()
							sendMessage(null, null, true, "text", msgId)
						}
					});
					document.getElementById('thread-area').addEventListener('keydown', (e)=>{
						if (e.key=="Enter"){
							e.preventDefault()
							let msgId = uuidv4()
							let threadId = document.querySelector(".thread-connected").getAttribute("thread-id")
							sendThread(null, null, username, true,"text", msgId, threadId)
						}
					})
					document.getElementsByClassName('leave-room')[0].addEventListener("click", disconnectFromRoom);
					postMessage("after event listeners")

					var userCount = 0
					var username = ""

					function changeRoomStatus(){
						postMessage({command: "changeRoomStatus"})
					}

					function showChat(roomId){
						postMessage({command:"showChat", roomId})
					}

					function showThread(threadId, roomId){
						postMessage({command:"showThread", threadId, roomId})
					}

					function codeBlock() {
						var codeBox = document.querySelector(".code-block-input")
		
						if (!codeBox) {
							var text = document.querySelector(".text-area").value
							const codeBox = document.createElement("textarea")
							codeBox.classList.add("code-block-input")
							codeBox.classList.add("input-styles")
							codeBox.setAttribute("wrap", "off")
							codeBox.innerHTML = text
		
							document
								.querySelector(".text-area-holder")
								.appendChild(codeBox)
		
							codeBox.focus()
							document.querySelector(".text-area").style.display = "none"
		
							codeBox.addEventListener("keydown", function (e) {
								if (e.key === "Enter") {
									e.preventDefault()
									var text = codeBox.value
									if(text){
										sendMessage(text, null, true, "code")
										removeCodeBlock()
									}
								}
								else{
									this.style.height = 0;
									this.style.height = this.scrollHeight + 'px';
								}
							})

							codeBox.addEventListener("paste", function(){
								setTimeout(()=>{
									this.style.height = 0;
									this.style.height = this.scrollHeight + 'px';
								},50)
							})
						} else {
							var text = codeBox.value
							removeCodeBlock()
						}
					}

					function removeCodeBlock(){
						document.querySelector(".code-block-input").remove()
						document.querySelector(".text-area").style.display = "block"
						document.querySelector(".text-area").value = text
						document.querySelector(".text-area").focus()
					}

					function sendMessage(
						message = null,
						time = null,
						sendToApi = true,
						type = "text",
						msgId = '',
						replyCount = 0
					) {
						const textEl = document.querySelector(".text-area")
						var str = message
						if (!str) {
							str = textEl.value
						}
		
						if (str) {
							const holder = document.createElement("div")
							holder.classList += "code-block-input chatMessage sent"
		
							const msgBy = document.createElement("div")
							msgBy.classList += "by"
							msgBy.textContent = username.split("@")[0]
		
							const chatMessageText = document.createElement("div")
							chatMessageText.classList += "chatMessage-text"
							chatMessageText.textContent = str
		
							const msgTime = document.createElement("div")
							msgTime.classList += "msg-time"
		
							var currTime
							if (!time) {
								var currTime = new Date()
								let dateDisplay = currTime.toDateString().split(' ').slice(1,3).join(' ')
								currTime = currTime.toLocaleString("en-US", {
									hour: "numeric",
									minute: "numeric",
									hour12: true
								})
								dateDisplay = dateDisplay+' '+ currTime
								currTime = dateDisplay
							} else currTime = time
		
							msgTime.textContent = currTime

							let msgReply = document.createElement("div")
							msgReply.classList += "msg-reply"
							if (replyCount == 0) msgReply.textContent = "Reply"
							else if (replyCount ==1 ) msgReply.textContent = replyCount+' Reply'
							else msgReply.textContent = replyCount+' Replies'
							msgReply.setAttribute("msg-id", msgId)
							msgReply.id = msgId

							holder.append(msgBy)
							holder.append(chatMessageText)
							if (msgId != null & msgId != '') holder.appendChild(msgReply)
							holder.appendChild(msgTime)
		
							document
								.getElementsByClassName("chat-area")[0]
								.appendChild(holder)
							var objDiv = document.getElementsByClassName("chat-area")[0]
							objDiv.scrollTop = objDiv.scrollHeight
		
							if (sendToApi) {
								postMessage({
									command: "sendMessage",
									message: str,
									time: currTime,
									parentId: '',
									msgId: msgId
								})
							}
							textEl.value = ""
						}
					}
					function recieveMessage(str, from, time = null, msgId, parentId = '', replyCount = 0) {
						const holder = document.createElement("div")
						holder.classList += "code-block-input chatMessage recieved"
		
						const msgBy = document.createElement("div")
						msgBy.classList += "by"
						msgBy.textContent = ''
						if (from) msgBy.textContent = from.split("@")[0]
		
						const chatMessageText = document.createElement("div")
						chatMessageText.classList += "chatMessage-text"
						chatMessageText.textContent = str
		
						const msgTime = document.createElement("div")
						msgTime.classList += "msg-time"
		
						var currTime
						if (!time) {
							var currTime = new Date()
							currTime = currTime.toLocaleString("en-US", {
								hour: "numeric",
								minute: "numeric",
								hour12: true
							})
						} else currTime = time
		
						msgTime.textContent = currTime

						let msgReply = document.createElement("div")
						msgReply.classList += "msg-reply"
						if (replyCount == 0) msgReply.textContent = "Reply"
						else if (replyCount ==1 ) msgReply.textContent = replyCount+' Reply'
						else msgReply.textContent = replyCount+' Replies'
						msgReply.setAttribute("msg-id", msgId)
						msgReply.id = msgId
		
						holder.append(msgBy)
						holder.append(chatMessageText)
						if (msgId != null & msgId != '') holder.appendChild(msgReply)
						holder.appendChild(msgTime)
		
						document
							.getElementsByClassName("chat-area")[0]
							.appendChild(holder)
						var objDiv = document.getElementsByClassName("chat-area")[0]
						objDiv.scrollTop = objDiv.scrollHeight
					}

					function sendThread(
						message = null,
						time = null,
						from = "",
						sendToApi = true,
						type = "text",
						msgId,
						threadId
					) {
						const textEl = document.getElementById("thread-area")
						var str = message
						if (!str) {
							str = textEl.value
						}
		
						if (str) {
							const holder = document.createElement("div")
							holder.classList += "code-block-input threadMessage sent"
		
							const msgBy = document.createElement("div")
							msgBy.classList += "by"
							msgBy.textContent = from
		
							const chatMessageText = document.createElement("div")
							chatMessageText.classList += "threadMessage-text"
							chatMessageText.textContent = str
		
							const msgTime = document.createElement("div")
							msgTime.classList += "msg-time"
		
							var currTime
							if (!time) {
								var currTime = new Date()
								let dateDisplay = currTime.toDateString().split(' ').slice(1,3).join(' ')
								currTime = currTime.toLocaleString("en-US", {
									hour: "numeric",
									minute: "numeric",
									hour12: true
								})
								dateDisplay = dateDisplay+' '+ currTime
								currTime = dateDisplay
							} else currTime = time
		
							msgTime.textContent = currTime

							holder.append(msgBy)
							holder.append(chatMessageText)
							holder.appendChild(msgTime)
		
							document
								.getElementsByClassName("thread-area")[0]
								.appendChild(holder)
							var objDiv = document.getElementsByClassName("thread-area")[0]
							objDiv.scrollTop = objDiv.scrollHeight
		
							if (sendToApi) {
								postMessage({
									command: "sendMessage",
									message: str,
									time: currTime,
									msgId: msgId,
									parentId: threadId
								})
								let msgReplyElement = document.getElementById(threadId)
								let replyCount = msgReplyElement.innerHTML.split(' Repl')[0]
								if (replyCount == 'Reply') replyCount = 0
								replyCount = parseInt(replyCount);
								replyCount+=1
								if (replyCount == 1) msgReplyElement.innerHTML = '1 Reply'
								else if (replyCount > 1) msgReplyElement.innerHTML = replyCount+' Replies'
							}
							textEl.value = ""
						}
					}

					function createNewRoom(){
						const objToSend = {command: "createNewRoom"}
						const con = document.getElementById("connection-input").value
						if(con){
							objToSend["roomId"] = con
						}
						postMessage(objToSend)
					}

					function inviteUser(){
						const user = document.querySelector(".invite-input").value
						if(user){
							postMessage({command: "inviteUser", user})
						}
					}
					
					function connectToRoom(){
						const conEl = document.getElementById("connection-input")
						const conName = conEl.value

						if(conName){
							postMessage({
								command: 'connectToRoom',
								message: conName
							})
						}
					}
					function disconnectFromRoom(){
						postMessage({
							command: 'disconnectFromRoom'
						})
						resetRoom()
						showLobby()
					}
					function login(){
						postMessage({
							command: 'loginUser'
						})
					}

					function addChatNotification(str){
						
					}

					function addRoomToLobby(roomId, badgeCount = 0) {
						const holder = document.querySelector(".chats-holder")
		
						const chat = document.createElement("div")
						chat.classList.add("chat")
						chat.setAttribute("data-id", roomId)
		
						
		
						const head = document.createElement("div")
						head.classList.add("head")
		
						const roomName = document.createElement("div")
						roomName.classList.add("room-name")
						roomName.textContent = "#" + roomId
		
						const badge = document.createElement("span")
						badge.classList.add("numb")
		
						if (badgeCount > 0) {
							badge.textContent = badgeCount
						}
		
						head.appendChild(roomName)
						head.appendChild(badge)
		
						
						chat.appendChild(head)
		
						holder.appendChild(chat)
					}

					function changeActiveChat(roomId){
						resetRoom()
						postMessage({
							command: "changeActiveChat",
							roomId
						})
					}

					function createInviteForm(){
						postMessage("create invite form")
						document.querySelector(".invite-form").innerHTML = ""
						const input = document.createElement("input")
						input.classList.add("input-styles")
						input.classList.add("invite-input")
						input.setAttribute("placeholder", "email")

						const btn = document.createElement("button")
						btn.classList.add("btn-default")
						btn.classList.add("invite-btn")
						btn.textContent = "Invite"
						
						document.querySelector(".invite-form").appendChild(input)
						document.querySelector(".invite-form").appendChild(btn)
					}

					function resetRoom(){
						document.querySelector(".invite-form").innerHTML = ""
						document.querySelector(".chat-area").innerHTML = ""
					}

					function showLobby(){
						document.querySelector(".chat-connected").classList.remove("active")
						document.querySelector(".lobby").classList.add("active")
						changeActiveChat(null)
					}

					function countReplies(parentId, messages){
						let count = 0;
						messages.forEach(message => {
							if (message.parentId == parentId) count +=1
						})
						return count
					}

					window.addEventListener('message', event => {
						const data = event.data;
						postMessage("in webview: "+data.command)
						if(data.command === "recieveVscodeMessage"){
							if (data.parentId==''){
								recieveMessage(data.message, data.from, data.time, data.msgId, data.parentId)
							}else{
								if (document.querySelector(".thread-connected")){
									let threadId = document.querySelector(".thread-connected").getAttribute("thread-id")
									if (data.parentId == threadId) {
										sendThread(data.message, data.time, data.from, false, "text", data.msgId, data.parentId)
									}
								}
							}
						}
						else if(data.command === "userJoinedRoom"){
							addChatNotification(data.user + " has joined the chat")
							document.querySelector(".users-count").textContent = data.userCount+" user"

							document.getElementsByClassName("error-message")[0].textContent = ""
							document.getElementsByClassName("lobby")[0].classList.remove("invalid")
						}
						else if(data.command === "userLeftRoom"){
							addChatNotification(data.user + " has left the chat")
							document.querySelector(".users-count").textContent = data.userCount+" user"
						} 
						else if(data.command === "setUserCount"){
							userCount = data.userCount
							document.querySelector(".users-count").textContent = userCount+" user"
						}
						else if(data.command === "roomTaken"){
							document.getElementsByClassName("error-message")[0].textContent = data.message
							document.getElementsByClassName("lobby")[0].classList.add("invalid")
						}
						else if(data.command === "setUserName"){
							username = data.username
						}
						else if(data.command === "addRoomToLobby"){
							addRoomToLobby(data.roomId)
						}
						else if(data.command === "updateBadges"){
							const roomId = data.roomId
							const chats = document.querySelectorAll(".chat")
							chats.forEach((chat)=>{
								if(chat.getAttribute("data-id") === roomId){
									if(data.badge === 0){
										chat.querySelector(".numb").textContent = ""
									}else{
										chat.querySelector(".numb").textContent = data.badge
									}
								}
							})
							document.querySelector(".chat-back .badge").textContent = data.totalCount
						}
						else if(data.command === "flipRoomStatus"){
							
						}
						else if(data.command === "setRoomAdmin"){
							//createInviteForm()
						} 
						else if(data.command === "initializeChat"){
							document.querySelector(".chat-connected").classList.add("active")
							document.querySelector(".lobby").classList.remove("active")
							document.querySelector(".thread-connected").classList.remove("active")
							document.querySelector(".room-id").textContent = "#"+data.roomId
							const messages = data.chatState.messages
							if(messages){
								messages.forEach((el)=>{
									if(el.type === "message" && el.parentId == ''){
										if(el.by === username){
											let replyCount = countReplies(el.msgId, messages)
											sendMessage(el.message, el.time, false, "text", el.msgId, replyCount)
										}
										else{
											let msgId = ''
											if (el.msgId != undefined) msgId = el.msgId
											let replyCount = countReplies(msgId, messages)
											recieveMessage(el.message, el.by, el.time, msgId, '', replyCount)
										}
									} else if (el.type === "join"){
										addChatNotification(el.by + " has joined the chat")
									} else if(el.type === "leave"){
										addChatNotification(el.by + " has left the chat")
									}
								})

								
								document.querySelector(".users-count").textContent = data.chatState.userCount+ " user"

								if(data.chatState.admins.includes(data.currId)){
									//createInviteForm()
								}
								
								postMessage({command: "removeBadge", roomId: data.roomId})
							}
						}
						else if(data.command === "initializeThread"){
							document.querySelector(".thread-connected").classList.add("active")
							document.querySelector(".chat-connected").classList.remove("active")
							document.querySelector(".lobby").classList.remove("active")
							document.querySelector(".thread-id").textContent = "#"+data.roomId+' Thread'
							const messages = data.chatState.messages
							let threadId = data.threadId
							if(messages){
								messages.forEach((el)=>{
									if (el.msgId == data.threadId){//display the post
										sendThread(el.message, el.time, el.by, false, "text", el.msgId, data.threadId)
										// sendThread(null, null, true,"text", msgId, data.threadId)
									} else if(el.parentId == data.threadId ) {
										sendThread(el.message, el.time, el.by, false, "text", el.msgId, data.threadId)
										// sendThread(el.message, el.time, false, data.threadId)
									}
								})
							}
							document.querySelector(".thread-connected").setAttribute("thread-id", threadId)
						}
						else if(data.command === "initLobby"){

							document.querySelector(".chats-holder").innerHTML = ""
							const chats = data.data

							for(var key in chats){
								addRoomToLobby(key, chats[key])
							}
						}
						else if(data.command === "showInviteForm"){
							//createInviteForm()
						}
					});

					postMessage({command:"getUserName"})
					postMessage({command: "init"})
				}())
				</script>
			</body>
			</html>
		`
		} else {
			//load the code autocomplete status
			let ccStatus = "Enable"
			if (_.globalState.get("extensionStatus")) ccStatus = "Enabled"
			return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<title>Blackbox View Test</title>

				<link href="${stylesSrc}" type="text/css" rel="stylesheet"/>
			</head>
			<body>
				<style>
					.btn-holder {
						display: flex;
						justify-content: center;
						gap: 10px;
					}

					.btn-default {
						padding: 7px;
						border: 0;
						background-color: rgb(14, 99, 156);
						color: #fff;
						border-radius: 2px;
						cursor: pointer;
						text-align: center;
					}
					.btn-default:hover {
						background-color: rgba(17, 119, 187);
					}
					.text-description{
						color: #CCCCCC
					}

					* {
						padding: 0;
						margin: 0;
						box-sizing: border-box;
					}
			
					.input-style {
						width: 100%;
						margin: 10px 0;
						outline: none;
						border: 0;
						background-color: #ffffff17;
						padding: 5px;
						color: #fff;
					}
					.CodeMirror {
						height: auto;
						background-color: transparent !important;
					}
					.CodeMirror-gutters {
						background-color: transparent !important;
						border-right: 0 !important;
					}
					.CodeMirror-linenumbers {
						padding-right: 20px;
					}
					.page-holder{
						display:none;
					}
					.page-holder.active{
						display:block
					}
					.result-holder{
						border-bottom: 1px solid #5656564d;
						margin-bottom: 47px;
					}
					.highlight {
						background-color: orange;
					}
					.btn-premium{
						background-image: linear-gradient(191deg, #f1dc39 0%, #c96e05 87%);
					}
					.btn-premium:hover{
						background-image: linear-gradient(191deg, #c9b411 0%, #be6703 87%);
					}
				</style>
				<p class='text-description'>All Features</p>
				<l class='text-description'>
					Help & Getting Started
					<div class="btn-default btn-getstarted">
						<span>Get Started</span>
					</div>
					1. Code Autocomplete<br>
					<i>(Press Tab to Accept Suggestions)</i>
					<br>
					<div>
					<div class="btn-default btn-features">
						<span class="btn-features">${ccStatus} Code Autocomplete</span>
					</div>
				</div>
					2. Code Chat<br><br>
					<div class="btn-default btn-code-chat-holder">
						<span class="btn-code-chat">BlackboxAI Code Chat</span>
					</div>
					3. Blackbox AI Code History<br><br>
					<div class="btn-default btn-versioner btn-on">
						<span>Enable Blackbox Diff</span>
					</div>
					<div class="btn-default btn-diff-open btn-on">
						<span>View Diff History</span>
					</div>
					4. Create the README.md file <br><br>
					<div class="btn-default btn-readme">
						<span>Generate README.md</span>
					</div>
					5. Blackbox Premium<br><br>
					<div class="btn-default btn-premium">
						<span>Blackbox Premium</span>
					</div>
					6. Schedule an Onboarding Call<br><br>
					<div class="btn-default btn-onboarding">
						<span>Call Onboarding/Support</span>
					</div>
				</l>
				<br><br>
				<div style="display: none;">
					<br><br>
					<p class='text-description'>Blackbox COMMS is built to connect developers. Post your questions in one of these groups and other developers will be reading your questions and responding.</p>
					<p class="text-description"> Get access to Blackbox COMMS.</p>
					<div class="btn-default btn-chat">
						<span class="btn-chat">Enable</span>
					</div>
				</div>
				<script src="https://code.jquery.com/jquery-3.6.3.js" integrity="sha256-nQLuAZGRRcILA+6dMBOvcRh5Pe310sBpanc6+QBmyVM=" crossorigin="anonymous"></script>
				<script>
					(function() {
						const vscode = acquireVsCodeApi();
								
						function postMessage(obj){
							vscode.postMessage(obj)
						}
						document.addEventListener("click", (e)=>{
							if(e.target.classList.contains("btn-features") ) {
								if (e.target.innerText == 'Enable Code Autocomplete'){
									postMessage({command: "features-enable"})
									e.target.innerText = 'Code Autocomplete Enabled'
								}else if (e.target.innerText == 'Code Autocomplete Enabled' || e.target.innerText == 'Enabled Code Autocomplete'){
									postMessage({command: "features-disable"})
									e.target.innerText = 'Enable Code Autocomplete'
								}
							}
							else if(e.target.classList.contains("btn-search") ) postMessage({command: "search"})
							else if(e.target.classList.contains("btn-chat") ) postMessage({command: "chatEnable"})
						})

						$(document).on("click", ".btn-code-search-holder", function(){
							postMessage({command:"showCodeSearch"})
						})

						$(document).on("click", ".btn-code-chat-holder", function(){
							postMessage({command:"showCodeChat"})
						})
						$(document).on("click", ".btn-versioner", function(){
							if($(this).hasClass("btn-on")){
								postMessage({command:"versionerOn"})
							}
							else{
								postMessage({command:"versionerOff"})
							}
						})

						$(document).on("click", ".btn-diff-open", function(){
							postMessage({command:"versionerOpen"})
						})

						$(document).on("click", ".btn-readme", function(){
							postMessage({command:"createReadme"})
						})

						$(document).on("click", ".btn-getstarted", function(){
							postMessage({command:"getStarted"})
						})

						$(document).on("click", ".btn-onboarding", function(){
							postMessage({command:"onboardingCall"})
						})

						$(document).on("click", ".btn-premium", function(){
							postMessage({command:"blackboxPremium"})
						})

						window.addEventListener('message', event => {
							const data = event.data
							if(data.command === "versionerOn"){
								$(".btn-versioner").text("Disable Blackbox Diff")
								$(".btn-versioner").removeClass("btn-on")
								$(".btn-versioner").addClass("btn-off")
							}
							else if(data.command === "versionerOff"){
								$(".btn-versioner").text("Enable Blackbox Diff")
								$(".btn-versioner").removeClass("btn-off")
								$(".btn-versioner").addClass("btn-on")
							}
						})

						postMessage({command: "initBtns"})
					}())
				</script>
			</body>
			</html>
		`
		}
	}

	var chatPanel = undefined
	var isPaused = false
	var continueObj = {}
	var chatHistory = []
	vscode.commands.registerCommand("blackbox.showChat", (queryParam) => {
		if (chatPanel) { 
			chatPanel.reveal(vscode.ViewColumn.Two)
			if (is_triggered_from_Q) {
				chatPanel.webview.postMessage({ command: "showChatCode", query: lastSearchedQuery, queryFromOutside })
				is_triggered_from_Q = false;
				queryFromOutside = false;
			}
		}
		else {
			function postMessage(obj) {
				chatPanel.webview.postMessage(obj)
			}
			chatPanel = vscode.window.createWebviewPanel(
				"blackbox-chat",
				"Blackbox AI Chat",
				vscode.ViewColumn.Two,
				{
					enableScripts: true
				}
			)

			chatPanel.webview.html = getChatHtml(chatPanel.webview)
			chatPanel.onDidDispose(() => {
				chatPanel = undefined
			})

			if (queryParam) {
				chatPanel.webview.postMessage({ command: "showChatCode", query: queryParam  })
			}

			async function checkIfCode(str) { 
				const modulOperations = new ModelOperations();
				return await modulOperations.runModel(str)
			}

			var cumalativeAnswer = ""
			chatPanel.webview.onDidReceiveMessage(async (data) => { 
				if (data.command === "sendMessage") {
					isPaused = false
					var obj = {
						textInput: data.message,
						userId: userId,
						source: "visual studio",
						allMessages: data.allMessages,
						clickedContinue: false,
						stream: ""
					}
					var clickedContinue = false
					if (data.continue) {
						clickedContinue = true
						obj.clickedContinue = true
					}
	
					let answer = ''
					var answerArr = []
					const id = data.continue ? continueObj.id : new Date().getTime()
					if (!data.continue) {
						chatHistory.push({ question: obj.textInput, time: new Date().getTime() })
						chatHistory.push("")
						postMessage({ command: "showAnswer", answer, type: { confidence: 0 }, id })

						let related_results = []
						try{
							const response = await (0, node_fetch_1.default)(
								"https://useblackbox.io/relatedResults",
								{
									method: "POST",
									body: JSON.stringify({query: data.message, userId: userId}),
									headers: {
										"Content-Type": "application/json",
										Accept: "application/json"
									}
								}
							)
							const json = await response.json()
							related_results = json
							postMessage({command:"showRelated", id, arr: related_results})
						}catch(e){}
					}
					

					//Sleep function
					function sleep(ms) {
						return new Promise(resolve => setTimeout(resolve, ms));
					}

					answer = ''
					let completed = false
					let iterations = data.continue ? continueObj.iterations : 0
					iterations = iterations ? iterations : 0
					let max_iterations = data.continue ? continueObj.max_iterations : 1
					max_iterations = max_iterations ? max_iterations : 1
					if (data.continue) { 
						delete continueObj.iterations
						delete continueObj.max_iterations
						continueObj.clickedContinue = true
						continueObj.stream = ""
						continueObj.allMessages = data.allMessages
						obj = continueObj
					}

					// postMessage({command:"showPause"})

					try {
						let full_answer = ''//compiled streamed answer for allAnswers array append
						let is_excess_context_size = false
						let steam_context_size = 3000
						if (JSON.stringify(data.allMessages).length > steam_context_size) is_excess_context_size = true
						let is_demo = false
						let demo_examples = [
							'write a function that reads data from a json file',
							'how to delete docs from mongodb in python',
							'connect to mongodb in node js'
						]
						if (data.allMessages.length == 1){
							if (data.allMessages[0]['user']){
								if (demo_examples.includes(data.allMessages[0]['user'])) is_demo = true
							}
						}
						let qFromOustide = false
						if (data.queryFromOutside) {
							qFromOustide = data.queryFromOutside
							if (qFromOustide) is_stream = true
						}
						obj.qFromOustide = qFromOustide
						if (is_stream && is_excess_context_size == false && webSocketChat.readyState == 1 && is_demo == false){// Stream Response
							webSocketChat.onmessage = (event) => {
								if (event.data != 'connection established' && event.data != 'stream done'){
									postMessage({ command: 'showPart', part: event.data, type: { confidence: 0 }, completed, id, clickedContinue });
									full_answer += event.data
								}
								if (event.data == 'stream done'){
									postMessage({ command: 'finishPart' });
									postMessage({ command: 'removeTyping', id, raw: full_answer });
									answerArr = []
									if (full_answer.includes('<|endoftext|>')) full_answer = full_answer.replace('<|endoftext|>', '')
									const splitted = full_answer.split("```")
									for (let i = 0; i < splitted.length; i++) {
										const part = splitted[i]
										if (part.trim().length) {
											if (i % 2) {
												// code
												var language = part.split("\n")[0]
												var text = part
												if (language.trim().length) {
													text = part.split("\n").slice(1).join("\n")
												}											
												answerArr.push({ type: "code", text, language })
											}
											else {
												// plain
												answerArr.push({ type: "plain", text: part })
											}
										}
									}
									chatHistory[chatHistory.length - 1] = {answer: answerArr, id, raw: full_answer}
								}
							};
				
							full_answer = ''
							webSocketChat.send(JSON.stringify({command: 'generate', content: data.allMessages, userId: userId}));
						}else{
							const response = await (0, node_fetch_1.default)(
								"https://useblackbox.io/chat-request-v4",
								{
									method: "POST",
									body: JSON.stringify(obj),
									headers: {
										"Content-Type": "application/json",
										Accept: "application/json"
									}
								}
							)
			
							const result = await response.json()
							iterations += 1

							//detect code or plain text

							answerArr = []
							if (clickedContinue) { 
								cumalativeAnswer += result['response'][0][0]
							}
							else {
								cumalativeAnswer = result['response'][0][0]
							}
							const splitted = cumalativeAnswer.split("```")
							for (let i = 0; i < splitted.length; i++) {
								const part = splitted[i]
								if (part.trim().length) {
									if (i % 2) {
										// code
										var language = part.split("\n")[0]
										var text = part
										if (language.trim().length) {
											text = part.split("\n").slice(1).join("\n")
										}
										else {
											language = await checkIfCode(text)
											if (language[0]){
												if (language[0].languageId){
													language = language[0].languageId
												}
											}
										}

										
										answerArr.push({ type: "code", text, language })
									}
									else {
										// plain
										answerArr.push({ type: "plain", text: part })
									}
								}
							}

							chatHistory[chatHistory.length - 1] = {answer: answerArr, id, raw: result['response'][0][0]}
							if (!result['response'][0][0].trim().length) { 
								continueObj = {}
								postMessage({ command: "removeTyping", id, raw: cumalativeAnswer })
								cumalativeAnswer = ""
								postMessage({command:"hideBeside"})
							} else {
								if (!completed) {
									if (!isPaused) {
										continueObj = obj
										continueObj.iterations = iterations
										continueObj.max_iterations = max_iterations
										continueObj.id = id
										postMessage({ command: "showStream", answer: answerArr, type: { confidence: 0 }, completed, id, clickedContinue, raw: result['response'][0][0] })
									} else {
										postMessage({ command: "pauseTyping", id })
									}
								}
								
								if (iterations == max_iterations && !completed) {
									delete continueObj.iterations
									delete continueObj.max_iterations
									isPaused = true
									postMessage({ command: "removeTyping", id, raw: result['response'][0][0] })
									if (result['response'][0][0].length > 1500) { 
										// postMessage({command:"showContinue"})
									}
									else {
										postMessage({command:"hideBeside"})
									}
									// postMessage({command:"showContinue"})
								}	
							}
						}
					} catch (e) {
						console.log(e)
					}
				}
				else if (data.command === "answerFeedback") { 
					const obj = {feedback: `${data.type}`, query: data.query, result: data.answer, userId: userId, source: 'visual studio'}

					try{
						const response  = await (0, node_fetch_1.default)(
							"https://useblackbox.io/feedbackChatResult",
							{
								method: "POST",
								body: JSON.stringify(obj),
								headers: {
									"Content-Type": "application/json",
									Accept: "application/json"
								}
							}
						)
						const result = await response.json()
					}catch(e){
						console.log(e)
					}
				}
				else if (data.command === "pause") {
					isPaused = true
					// postMessage({command:"showContinue"})
				}
				else if (data.command === "continue") {
					if(isPaused){
						postMessage({command:"continueTyping", id: continueObj.id})
						// postMessage({command:"showPause"})
					}
				}
				else if(data.command === "resetHistory"){
					chatHistory = []
					isPaused = true
					setTimeout(() => {
						isPaused = false
					}, 1000);
					continueObj = {}
					postMessage({command:"hideBeside"})
				}
				else if(data.command === "check_if_query_editor"){
					if (is_triggered_from_Q){
						postMessage({ command: "showChatCode", query: lastSearchedQuery, queryFromOutside })
						is_triggered_from_Q = false;
						queryFromOutside = false;
					}
				}
				else if (data.command === "init") {
					postMessage({command:"showHistory", chatHistory})
				}
				else if (data.command == 'openWalkthrough'){
					vscode.commands.executeCommand("blackbox.welcome")
				}
				else if (data.command == 'onboardingCall'){
					open(onboarding_call_url)
				}else if (data.command == 'results-on-web') {
					const urlHistory = _.workspaceState.get('browser-last-url') || [];
					const urlIndex = urlHistory.indexOf(data.text);

					if (urlIndex >= 0 ) {
					  urlHistory.splice(urlIndex,1);
					}

					urlHistory.push(data.text);
					_.workspaceState.update('browser-last-url', urlHistory);

					await installDependencies();
					if (!eletronBrowser) {
					 await createElectronBrowser(data.text);
					}

					setTimeout(() => {
					  searchOnWeb(data.text)
					}, 1000)
					selectionFct('click web results')
				}else if (data.command === "blackboxPremium") {
					open('https://www.useblackbox.io/pricing')
					selectionFct('blackbox premium open chat')
				}
			})
		}
		selectionFct('open chat')
	})

	function getChatHtml(webview) {
		const planeImg = vscode.Uri.file(
			path.join(_.extensionPath, "out/imgs/send-icon.png")
		)
		const loadingIcon = vscode.Uri.file(
			path.join(_.extensionPath, "out/imgs/loading-icon.svg")
		)
		const codeMirrorCobalt = vscode.Uri.file(
			path.join(_.extensionPath, "out/theme/cobalt.css")
		)
		const thumbsUp = vscode.Uri.file(
			path.join(_.extensionPath, "out/imgs/thumbs-up.png")
		)
		const thumbDown = vscode.Uri.file(
			path.join(_.extensionPath, "out/imgs/thumbs-down.png")
		)
		const copyImg = vscode.Uri.file(
			path.join(_.extensionPath, "out/imgs/copy-icon.png")
		)
		const resetImg = vscode.Uri.file(
			path.join(_.extensionPath, "out/imgs/reset.png")
		)
		const checkImg = vscode.Uri.file(path.join(_.extensionPath, "out/imgs/white-check.png"))

		const checkImgSrc = webview.asWebviewUri(checkImg)
		const resetImgSrc = webview.asWebviewUri(resetImg)
		const stylesSrc = webview.asWebviewUri(styles)
		const planeSrc = webview.asWebviewUri(planeImg)
		const loadingIconSrc = webview.asWebviewUri(loadingIcon)
		const thumbsUpSrc = webview.asWebviewUri(thumbsUp)
		const thumbsDownSrc = webview.asWebviewUri(thumbDown)
		const copyImgSrc = webview.asWebviewUri(copyImg)

		codemirrorStylesSrc = webview.asWebviewUri(codemirrorStyles)
		codemirrorJsSrc = webview.asWebviewUri(codemirrorJs)
		codemirrorModeJsSrc = webview.asWebviewUri(codemirrorModeJs)
		codemirrorModePySrc = webview.asWebviewUri(codemirrorModePy)
		codemirrorModeClikeSrc = webview.asWebviewUri(codemirrorModeClike)
		codemirrorModeCssSrc = webview.asWebviewUri(codemirrorModeCss)
		codemirrorModeHtmlMixedSrc = webview.asWebviewUri(
			codemirrorModeHtmlMixed
		)
		codemirrorModePhpSrc = webview.asWebviewUri(codemirrorModePhp)
		codemirrorModeSimpleSrc = webview.asWebviewUri(codemirrorModeSimple)
		codemirrorModeXmlSrc = webview.asWebviewUri(codemirrorModeXml)
		const codeMirrorCobaltSrc = webview.asWebviewUri(codeMirrorCobalt)
		const extensionsNMPath = path.join(_.extensionPath, 'out', 'browser-renderer', 'node_modules');

		let browserReadyToshow = false;
		if (fs.existsSync(extensionsNMPath)) {
			browserReadyToshow = true;
		}
		return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<title>Blackbox Chat</title>

				<link href="${stylesSrc}" type="text/css" rel="stylesheet"/>

				<script src="${codemirrorJsSrc}"></script>
				<link rel="stylesheet" href="${codemirrorStylesSrc}" />
				<script src="${codemirrorModeJsSrc}"></script>
				<script src="${codemirrorModePySrc}"></script>
				<script src="${codemirrorModeClikeSrc}"></script>
				<script src="${codemirrorModeCssSrc}"></script>
				<script src="${codemirrorModeHtmlMixedSrc}"></script>
				<script src="${codemirrorModePhpSrc}"></script>
				<script src="${codemirrorModeSimpleSrc}"></script>
				<script src="${codemirrorModeXmlSrc}"></script>
				<link rel="stylesheet" href="${codeMirrorCobaltSrc}" />
			</head>

			<style>
				.CodeMirror {
					height: auto;
					background-color: transparent !important;
				}
				.CodeMirror-gutters {
					background-color: transparent !important;
					border-right: 0 !important;
				}
				.CodeMirror-linenumbers {
					padding-right: 20px;
				}

				.chatMessage .CodeMirror-sizer{
					margin-left: 0px!important;
				}
				.CodeMirror-hscrollbar{
					height: 0px;
				}
				.chatMessage .CodeMirror-linenumber.CodeMirror-gutter-elt{
					display: flex;
					justify-content: flex-start;
					padding: 0;
				}
				.message-disclaimer{
					font-size:10px;
					justify-content: flex-start;
					padding-left:25px;
					padding-bottom:7px;
					padding-right:7px;
					opacity:0.4;
				}
				.msg-time{
					display: flex!important;
					align-items: center;
					justify-content: space-between;
					gap: 26px;
				}
				.typing{
					display: flex;
					align-items: center;
					justify-content: space-between;
					font-style: italic;
				}
				.code-snippet-holder {
					position: relative;
					margin-top: 10px;
					padding-left: 10px;
					transition: all 0.3s ease 0s;
					border-radius: 5px;
					border-width: 1px;
					border-style: solid;
					border-color: rgb(96, 96, 96);
					border-image: initial;
					padding-top:15px;
					background: #ffffff17;
				}
				.top-code-bar {
					position: absolute;
					right: 0px;
					z-index: 2;
					display: flex;
					align-items: center;
					opacity: 0;
					margin: 6px;
					gap: 5px;
					transition:0.3s ease all;
					top:0;
				}
				.copy-text {
					display: none;
					margin-right: 5px;
					font-size: 10px!important;
					color: #a7b5c4;
					line-height: 11px;
				}
				.copy-text.active {
					display: block;
				}
				.code-copy-img {
					width: 15px;
					cursor: pointer;
				}
				.code-snippet-holder:hover .top-code-bar {
					opacity: 1;
				}
				.recieved .chatMessage-text{
					padding: 5px 10px;
					
				}
				.date-display{
					font-size:10px;
					margin-top:5px;
				}
				.typing-loading{
					margin-top:7px;
				}
				.code-block-input{
					padding-left: 20px;
					padding-right: 20px;
				}
				.sent.starter-text{
					margin-bottom: 8px;
					text-transform:capitalize
				}
				.suggestion-title{
					margin-right: 20px;
				}
				::placeholder { /* Chrome, Firefox, Opera, Safari 10.1+ */
					color: var(--vscode-editor-foreground);
					opacity:0.5
				}
				:-ms-input-placeholder { /* Internet Explorer 10-11 */
					color: var(--vscode-editor-foreground);
					opacity:0.5
				}
				::-ms-input-placeholder { /* Microsoft Edge */
					color: var(--vscode-editor-foreground);
					opacity:0.5
				}

				.quality-toaster{
					position: relative;
					bottom: 0px;
					left: -400px;
					background-color:var(--vscode-editor-background);
					border-radius: 5px;
					border: 1px solid #363636;
					padding: 0px;
					transition:0.3s ease all;
					z-index:99;
					width: 240px;
				}
				.quality-toaster.active{
					left: 10px;
				}
		
				.toaster-text{
					margin-bottom: 0px;
					text-align: center;
				}
		
				.toaster-icon {
					width: 30px;
					padding:5px;
					transition:0.3s ease all;
					border-radius:50%;
					cursor: pointer;
					box-sizing:border-box;
				}
				.toaster-icon:hover {
					background-color: #202938;
				}
		
				.icons-holder{
					display: flex;
					align-items: center;
					justify-content: center;
					gap:20px;
				}
				.option-icon{
					background: var(--vscode-badge-foreground);
				}

				.button-holder-feedback{
					display: flex;
					align-items: center;
					gap: 10px;
					flex-shrink: 0;
					justify-content: left;
				}
				.button-holder{
					display: flex;
					align-items: center;
					gap: 10px;
					flex-shrink: 0;
					justify-content: center;
				}

				.beside-btn{
					padding: 8px;
					border-radius: 4px;
					cursor: pointer;
					transition: 0.3s ease all;
					margin: 0;
					background-color: transparent;
					border: 1px solid #444;
					display: none;
					width: 60px;
					text-align: center;
					color: var(--vscode-editor-foreground);
				}
				.beside-btn.active{
					display:block;
				}
				.chatBox{
					padding-bottom:0;
				}
				.chat-footer{
					padding-top: 15px;
				}
				.beside-btn:hover {
					opacity: 0.5;
				}

				.rel-holder{
					display: flex;
					align-items: flex-start;
					gap: 5px;
					flex-direction: column;
					margin-top: 10px;
					font-size: 12px;
				}
			
				.rel{
					transition:0.3s ease all;
					color: #148ad9;
					text-decoration: none;
				}

				.rel-preview{
					transition:0.3s ease all;
					text-decoration: none;
					display:none;
					color:#e9edef;
				}
				.rel-preview.active{
					display:block;
				}

				.rel-show-preview{
					transition:0.3s ease all;
					color: #148ad9;
					text-decoration: none;
				}

				.rel-show-preview:hover{
					color:#fff;
				}
			
				.rel-src{
					font-size: 11px;
					color: #939393;
				}
			
				.rel-item.hidden{
					display:none
				}

				.rel-item{
					text-decoration: none;
					border-bottom: 1px solid #6a6a6a;
					width: 100%;
					padding-bottom: 10px;
				}

				.rel:hover{
					color:#fff;
				}

				.rel-preview:hover{
					color:#fff;
				}
			
				.rel-btn{
					margin-top:10px;
					color: #148ad9;
					transition:0.3s ease all;
				}
			
				.rel-btn:hover{
					color:#fff;
				}

				.reset-chat{
					margin-left:10px;
					padding: 8px;
					cursor:pointer;
					transition:0.3s ease all;
					border-radius:4px;
					background-color: #64646417;
				}
				.reset-chat:hover{
					background-color: #9b9b9b17;
				}
				.button-ai-search-copy {
					width: 10px;
					grid-column-gap: 12px;
					grid-row-gap: 12px;
					color: #fff;
					cursor: pointer;
					border-radius: 15px;
					flex: none;
					justify-content: center;
					align-items: center;
					padding: 10px 15px;
					font-size: 14px;
					font-weight: 300;
					line-height: 20px;
					display: flex;
					position: relative;
				  }

				.tooltip-text{
					position: absolute;
					bottom: 60%;
					right: 10px;
					width: 50px;
					padding: 5px;
					border-radius: 4px;
					font-size: 11px;
					background-color: #64646417;
					transition: 0.3s ease all;
					opacity:0;
					pointer-events:none;
				}
				.tooltip-holder{
					display: flex;
					align-items: center;
					justify-content: center;
					position: relative;
				}
				.tooltip-holder:hover .tooltip-text{
					opacity:1;
					bottom: 120%;
				}
				.rel-bottom-holder{
					display: flex;
					gap: 10px;
					align-items: center;
				}
				.chat-button-containber {
					grid-column-gap: 16px;
					grid-row-gap: 16px;
					flex-flow: wrap;
					justify-content: flex-end;
					align-items: center;
					display: flex;
				}
				.vscode-button {
					text-align: center;
					letter-spacing: .5px;
					background-color: #2f5dcd;				
					justify-content: center;
					padding: 8px 16px;
					font-size: 14px;
					font-style: normal;
					font-weight: 400;
					line-height: 24px;
					display: flex;
				}
				.vscode-button.white {
					color: #0d1116;
					background-color: #fff;
					padding-left: 20px;
					padding-right: 20px;
					border-radius: 99px;
					font-size: 13px;
					line-height: 20px;
				}
				.w-button {
					display: inline-block;
					padding: 9px 15px;
					background-color: #3898EC;
					color: white;
					border: 0;
					line-height: inherit;
					text-decoration: none;
					cursor: pointer;
					border-radius: 0;
				}
			</style>
			<body>
				<div class="chat-connected active">
					<div class="chatBox chat-area"></div>

					<div class="chat-footer">
						<div class="button-holder-feedback"></div>
						<div class="button-holder">
							<div class="beside-btn continue-btn">Continue</div>
							<div class="beside-btn pause-btn">Pause</div>
						</div>
						<div class="chat-input-wrapper">
							<textarea
								id="text-area"
								type="text"
								placeholder="Ask any coding question"
								class="send-message text-area input-styles"
							></textarea>
							<img src='${planeSrc}' class="send-message-icon">
							<div class="button-ai-search-copy reset-chat">
								<div id="chat-input-new-chat">+</div>
						  	</div>
						</div>
					</div>
					<div class="message-disclaimer">Blackbox AI Chat is in beta and Blackbox is not liable for the content generated. Blackbox may produce inaccurate information about people, places, facts, code and more. By using Blackbox, you acknowledge that you agree to agree to Blackbox's <a href="https://www.useblackbox.io/terms" style="text-decoration: none; color: inherit;">Terms</a> and <a style="text-decoration: none; color: inherit;" href="https://www.useblackbox.io/privacy">Privacy Policy</a></div>
				</div>
				<script src="https://code.jquery.com/jquery-3.6.3.js" integrity="sha256-nQLuAZGRRcILA+6dMBOvcRh5Pe310sBpanc6+QBmyVM=" crossorigin="anonymous"></script>
				<script>
				(function() {
					const vscode = acquireVsCodeApi();
					
					function postMessage(obj){
						vscode.postMessage(obj)
					}
					
					var lastSearchedQuery = ""
					var lastAnswer = ""
					let allAnswers = []
					var altDown = false
					$(document).on("keydown", ".send-message", function(e){
						const key = e.key
						if(key === "Shift"){
							e.preventDefault()
							e.stopPropagation()
							shiftDown = true
						}
						else if(key === "Alt"){
							e.preventDefault()
							e.stopPropagation()
							altDown = true
						}
						else if(key === "Enter"){
							if(altDown){
								$(".send-message").val($(".send-message").val()+"\\r\\n")
								$(this).height(1);
								var totalHeight = $(this).prop('scrollHeight') - parseInt($(this).css('padding-top')) - parseInt($(this).css('padding-bottom'));
								$(this).height(totalHeight);
								$(this)[0].scrollTop = $(this)[0].scrollHeight;
							}else{
								e.preventDefault()
								e.stopPropagation()
								const question = $(this).val().trim()
								if(question){
									setTimeout(()=>{
										$(this).css("height", "")
									},10)
									sendMessage(
										question,
										time = null,
										sendToApi = true
									)
								}
							}
						}
						else{
							altDown = false
							shiftDown = false
						}
					})
					$(".reset-chat").on("click", function(){
						$(".chatMessage:not(.starter-text)").remove()
						lastSearchedQuery = ""
						lastAnswer = ""
						allAnswers = []
						postMessage({command:"resetHistory"})
						hideQualityToaster()
					})
					$(document).on("click", ".pause-btn", function(){
						postMessage({command:"pause"})
					})
					$(document).on("click", ".continue-btn", function(){
						postMessage({command:"continue"})
					})
					$(document).on("click", ".btn-walkthrough", function(){
						postMessage({command:"openWalkthrough"})
					})

					$(document).on("click", ".btn-premium", function(){
						postMessage({command:"blackboxPremium"})
					})

					$(document).on("click", ".btn-onboarding", function(){
						postMessage({command:"onboardingCall"})
					})
					$(document).on("keyup", ".send-message", function(e){
						const key = e.key
						if(key === "Alt"){
							e.preventDefault()
							e.stopPropagation()
							altDown = false
						}
					})
					$(document).on("click", ".send-message-icon", function(e){
						const question = $(".send-message").val().trim()
						if(question){
							sendMessage(
								question,
								time = null,
								sendToApi = true,
							)
						}
					})

					$(".text-area").on('input', function(){
						$(this).height(1);
						var totalHeight = $(this).prop('scrollHeight') - parseInt($(this).css('padding-top')) - parseInt($(this).css('padding-bottom'));
						$(this).height(totalHeight);
					});

					function sendMessage(
						message = null,
						time = null,
						sendToApi = false,
						code = false,
						queryFromOutside = false
					) {
						if(!$(".send-message").attr("disabled")){
							$(".send-message").attr("disabled", true)
							lastSearchedQuery = message
							if (queryFromOutside) allAnswers = []
							allAnswers.push({'user': message})
							const textEl = document.querySelector(".text-area")
							var str = message
							if (!str) {
								str = textEl.value
							}
			
							if (str) {
								const holder = document.createElement("div")
								holder.classList += "code-block-input chatMessage sent"
			

								var chatMessageText = document.createElement("div")
								
								if(code){
									chatMessageText = document.createElement("textarea")
									chatMessageText.value = str
								}
								else{
									chatMessageText.classList += "chatMessage-text"
									chatMessageText.textContent = str
								}
			
								const msgTime = document.createElement("div")
								msgTime.classList += "msg-time"
			
								var currTime
								if (!time) {
									currTime = new Date().getTime()
								} else currTime = time
								const setTime = new Date(currTime)
								
								var localTime = setTime.toLocaleString("en-US", {
									hour: "numeric",
									minute: "numeric",
									hour12: true
								})
								var dateDisplay = setTime.toDateString().split(' ').slice(1,3).join(' ')
								dateDisplay = dateDisplay+' '+ localTime
			
								msgTime.innerHTML = "<div class='date-display'>"+dateDisplay+"</div>"

								holder.append(chatMessageText)
								holder.appendChild(msgTime)

								document
									.getElementsByClassName("chat-area")[0]
									.appendChild(holder)
								var objDiv = document.getElementsByClassName("chat-area")[0]
								objDiv.scrollTop = objDiv.scrollHeight

								if(code){
									const cmEditor = CodeMirror.fromTextArea(chatMessageText, {
										lineNumbers: false,
										theme:"cobalt",
										mode: "javascript",
										viewportMargin: Infinity,
										readOnly:true
									})
								}

								if (queryFromOutside) {
									holder.style.display = 'none';
								}
			
								if (sendToApi) {
									showLoading()
									postMessage({
										command: "sendMessage",
										message: str,
										allMessages: allAnswers,
										queryFromOutside: queryFromOutside
									})
								}
								textEl.value = ""
							}
						}
					}

					$(".send-message").focus()

					function showLoading(){
						const $el = $("<div class='code-block-input chatMessage recieved loading-box' style='padding-bottom:0;'><div class='by'>BLACKBOX</div><img src='${loadingIconSrc}' style='width:40px'></div>")

						$(".chat-area").append($el)
						var objDiv = document.getElementsByClassName("chat-area")[0]
						objDiv.scrollTop = objDiv.scrollHeight
					}
					function hideLoading(){
						$(".send-message").attr("disabled", false)
						$(".send-message").focus()

						$(".loading-box").remove()
					}

					function getCodeLanguage(fileExtension){
						var language = "javascript"
						var stringLanguage = language
						if(fileExtension === "py"){
							language = "python"
							stringLanguage = "python"
						} else if(fileExtension === "ts"){
							language = "text/typescript"
							stringLanguage = "typescript"
						} else if(fileExtension === "html"){
							language = "htmlmixed"
							stringLanguage = "html"
						} else if(fileExtension === "css"){
							language = "css"
							stringLanguage = "css"
						} else if(fileExtension === "php"){
							language = "php"
							stringLanguage = "php"
						} else if (fileExtension === "cs") {
							language = "text/x-csharp"
							stringLanguage = "csharp"
						} else if (fileExtension === "java") {
							language = "text/x-java"
							stringLanguage = "java"
						} else if (fileExtension === "scala") {
							language = "text/x-scala"
							stringLanguage = "scala"
						} else if (fileExtension === "ceylon") {
							language = "text/x-ceylon"
							stringLanguage = "java"
						} else if (fileExtension === "kt" || fileExtension === "kts"){
							language = "kotlin"
							stringLanguage = "java"
						} else if (fileExtension === "cpp" || fileExtension === "c++"){
							language = "text/x-c++src"
							stringLanguage = "cpp"
						}
						return [language, stringLanguage]
					}


					function showStarterText(){
						const recommendationsArr = [
							"Define the coding language in your questions e.g. 'create a stripe subscription in nodejs'",
							"Clarify as much as possible what you are looking for in your questions"
						]
						var recommendations = ""
						recommendationsArr.forEach((el, idx)=>{
							recommendations += "<li>"+el+"</li>"
						})
						const new_features_arr = [
							"Blackbox Version History. You can review the code version history and BlackboxAI generates a title for each code change. <a href='https://www.useblackbox.io/demo?feature=diff'>Watch Demo</a>",
							"Blackbox AutoCommit. Let BlackboxAI write the commit message for you. <a href='https://www.useblackbox.io/demo?feature=commit'>Watch Demo</a>"
						]
						var new_features = ""
						new_features_arr.forEach((el, idx)=>{
							new_features += "<li>"+el+"</li>"
						})
						
						let $el = null
						if (${is_show_chat_premium} == false){
							$el = $('<div class="code-block-input chatMessage recieved starter-text"><div class="by">BLACKBOX</div><div class="chatMessage-text">Hello, Blackbox AI Chat can answer coding questions. Below are recommendations to get the best out of BLACKBOX</div><ul>'+recommendations+'</ul><div class="chat-button-containber"><div style="cursor:pointer" class="btn-onboarding">Schedule Onboarding</div><div class="vscode-button white w-button btn-walkthrough">Discover More Features</div></div><br></div>')
						}else{
							$el = $('<div class="code-block-input chatMessage recieved starter-text"><div class="by">BLACKBOX</div><div class="chatMessage-text">Hello, Blackbox AI Chat can answer coding questions. Below are recommendations to get the best out of BLACKBOX</div><ul>'+recommendations+'</ul><div class="chat-button-containber"><div style="cursor:pointer" class="btn-walkthrough">Discover More Features</div><div class="vscode-button white w-button btn-premium">Blackbox Premium</div></div><br></div>')
						}

						$(".chat-area").append($el)

						const suggestionsArr = [
							"write a function that reads data from a json file",
							"how to delete docs from mongodb in python",
							'connect to mongodb in node js'
						]

						var suggestions = ""
						suggestionsArr.forEach((el, idx)=>{
							suggestions += '<div class="code-block-input chatMessage sent starter-text"><div class="chatMessage-text">'+el+'</div></div>'
						})

						const $suggestions = $('<div class="starter-suggestions-holder"><div class="suggestion-title">Here are some suggestions</div>'+suggestions+'</div>')

						$(".chat-area").append($suggestions)

						$suggestions.find(".starter-text").on("click", function(){
							const question = $(this).text().trim()
							sendMessage(
								question,
								time = null,
								sendToApi = true,
							)
						})
						var objDiv = document.getElementsByClassName("chat-area")[0]
						objDiv.scrollTop = objDiv.scrollHeight
					}

					showStarterText()
					
					function recieveMessage(str, from, time = null, type, id) {
						lastAnswer = str
						const holder = document.createElement("div")
						holder.classList += "code-block-input chatMessage recieved feedback-btns"
						$(holder).attr("data-id", id)
						const msgBy = document.createElement("div")
						msgBy.classList += "by"
						msgBy.textContent = ''
						if (from) msgBy.textContent = from.split("@")[0]
						var answerType = "plain"
						if(type){
							if(type.confidence > 0.1){
								answerType = "code"
							}
						}
						var timeCheck
						var chatMessageText = document.createElement("div")
						if(answerType === "code"){
							chatMessageText = document.createElement("textarea")
							chatMessageText.value = str
						}
						else{
							chatMessageText.classList += "chatMessage-text"
							chatMessageText.textContent = str
						}
		
						const msgTime = document.createElement("div")
						msgTime.classList += "msg-time"
		
						var currTime
						if (!time) {
							currTime = new Date().getTime()
						} else currTime = time
						const setTime = new Date(currTime)
							
						var localTime = setTime.toLocaleString("en-US", {
							hour: "numeric",
							minute: "numeric",
							hour12: true
						})
						var dateDisplay = setTime.toDateString().split(' ').slice(1,3).join(' ')
						dateDisplay = dateDisplay+' '+ localTime
		
						$(msgTime).html("<div class='typing'>blackbox typing<img src='${loadingIconSrc}' class='typing-loading'></div><div class='date-display'>"+dateDisplay+"</div>")

						holder.append(msgBy)
						holder.append(chatMessageText)
						holder.appendChild(msgTime)
						document
							.getElementsByClassName("chat-area")[0]
							.appendChild(holder)
							var languageId = "javascript"
						if(answerType === "code"){
							languageId = getCodeLanguage(type.languageId)[0]
							const cmEditor = CodeMirror.fromTextArea(chatMessageText, {
								lineNumbers: false,
								theme:"cobalt",
								mode: languageId,
								viewportMargin: Infinity,
								readOnly:true
							})
							cmEditor.refresh()
						}else{
							chatMessageText.textContent = str
						}
						setTimeout(()=>{
							var objDiv = document.getElementsByClassName("chat-area")[0]
							objDiv.scrollTop = objDiv.scrollHeight
						},10)
					}

					function showContinue(){
						// hideBeside()
						// $(".continue-btn").addClass("active")
					
						// var objDiv = screen.width > 479 ? $(".chatlog-container")[0] : $(".tab-pane-vscode")[0]
						// 		objDiv.scrollTop = objDiv.scrollHeight
					}
					function hideBeside(){
						$(".beside-btn").removeClass("active")
					}
					var currType = 'string';
						
					function finishPart() {
						currType = "string";
						//showFeedbackToaster(); 
						showContinue();
					}
					function showPart(part, id) {
						const currHolder = $('.chatMessage[data-id='+id+']');
						const $holder =  $(currHolder.find(".chatMessage-text")[0])
						if (part == '<|endoftext|>') part = ''
						if(part.startsWith('\`\`\`')){
							currType = currType == "code" ? "string" : "code"
						}
						var $lastChild = $holder.children().last()
						if(currType == "string"){
							const $spanStr = $("<span></span>")
							$spanStr.html(part.replace("\`\`\`", ""))
							$holder.append($spanStr)
						}
						else if(currType == "code"){
							if(!$lastChild.length || !$lastChild.hasClass("code-snippet-holder")){
							const language = part.replace("\`\`\`", "")
							$lastChild = $('<div class="code-snippet-holder"></div>')
							const $topBar = $('<div class="top-code-bar"><div class="copy-text">Copied!</div><img class="code-copy-img" src="${copyImgSrc}"></div>')
							const $area = $('<textarea class="pre-cm"></textarea>')
							$lastChild.append($area)
							$holder.append($lastChild)
							const cmEditor = CodeMirror.fromTextArea($area[0], {
								lineNumbers: false,
								theme:"cobalt",
								mode: getCodeLanguage(language)[0],
								viewportMargin: Infinity,
								readOnly:true
							})
							$area.remove()
							setTimeout(()=>{
								cmEditor.refresh()
								$lastChild.prepend($topBar)
							},10)
							$topBar.on("click", async function(){
								await navigator.clipboard.writeText(cmEditor.getValue().trim())
								$(this).find(".copy-text").addClass("active")
								setTimeout(()=>{
								$(this).find(".copy-text").removeClass("active")
								}, 2000)
							})
							}
							else{
							$lastChild.find(".CodeMirror")[0].CodeMirror.doc.getEditor().replaceRange(part, {line: Infinity})
							}
						}
						const height = $('.chat-area').prop('scrollHeight');
						$('.chat-area').scrollTop(height);
					}

					function receiveStream(answerArr, from, time = null, type, completed, id, clickedContinue, raw) {
						addToAllAnswers(raw)
						var objDiv = document.getElementsByClassName("chat-area")[0]
						const scrollToBottom = isScrolledToBottom(objDiv)

						const $parent = $('.chatMessage[data-id='+id+']')
						let chatMessageText =  $parent.find(".chatMessage-text")[0]

						if(clickedContinue){
							$(chatMessageText).empty()
						}
						var answerType = "plain"
						if(type && answerArr.length === 1){
							if(type.confidence > 0.1){
								answerType = "code"
							}
						}
						var allText = ""
						if(answerArr.length > 1){
							answerArr.forEach((answerObj, idx)=>{
								const str = answerObj.text
								const type = answerObj.type
								allText += str + "\\n"
								if(type === "code"){
									// code
									const $areaHolder = $('<div class="code-snippet-holder"></div>')
									const $topBar = $('<div class="top-code-bar"><div class="copy-text">Copied!</div><img class="code-copy-img" src="${copyImgSrc}"></div>')
									const $area = $('<textarea class="pre-cm"></textarea>')
									$area.val(str)
									$areaHolder.append($area)
									$(chatMessageText).append($areaHolder)
									const cmEditor = CodeMirror.fromTextArea($area[0], {
										lineNumbers: false,
										theme:"cobalt",
										mode: getCodeLanguage(answerObj.language)[0],
										viewportMargin: Infinity,
										readOnly:true
									})
									$area.remove()
									setTimeout(()=>{
										cmEditor.refresh()
										$areaHolder.prepend($topBar)
									},10)

									$topBar.on("click", async function(){
										await navigator.clipboard.writeText(cmEditor.getValue().trim())
										$(this).find(".copy-text").addClass("active")
										setTimeout(()=>{
											$(this).find(".copy-text").removeClass("active")
										}, 2000)
									})
								}
								else{
									const allLinks = str.match(/\\[(.*?)\\]\\((.*)\\)/g) || []
									var strToAdd = str
									allLinks.forEach((link, idx)=>{
										const title = link.match(/(?<=\\[).+?(?=\\])/gm)[0]
										const linkHref = link.match(/(?<=\\().+?(?=\\))/g)[0]
										const element = '<a href="'+linkHref+'" target="_blank">'+title+'</a>'
										strToAdd = strToAdd.replace(link, element)
									})
									const $spanStr = $("<span></span>")
									$spanStr.html(strToAdd)
									$(chatMessageText).append($spanStr)
								}
							})
						}
						else{
							const str = answerArr[0].text
							allText = str
							answerType = answerArr[0].type
							if(answerType === "code"){	
								const $areaHolder = $('<div class="code-snippet-holder"></div>')
								const $topBar = $('<div class="top-code-bar"><div class="copy-text">Copied!</div><img class="code-copy-img" src="${copyImgSrc}"></div>')
								const $area = $('<textarea class="pre-cm"></textarea>')
								$area.val(str)
								$areaHolder.append($area)
								$(chatMessageText).append($areaHolder)
								const cmEditor = CodeMirror.fromTextArea($area[0], {
									lineNumbers: false,
									theme:"cobalt",
									mode: getCodeLanguage(answerArr[0].language)[0],
									viewportMargin: Infinity,
									readOnly:true
								})
								$area.remove()
								setTimeout(()=>{
									cmEditor.refresh()
									$areaHolder.prepend($topBar)
								},10)

								$topBar.on("click", async function(){
									await navigator.clipboard.writeText(cmEditor.getValue().trim())
									$(this).find(".copy-text").addClass("active")
									setTimeout(()=>{
										$(this).find(".copy-text").removeClass("active")
									}, 2000)
								})
							}
							else{
								const allLinks = str.match(/\\[(.*?)\\]\\((.*)\\)/g) || []
								var strToAdd = str
								allLinks.forEach((link, idx)=>{
									const title = link.match(/(?<=\\[).+?(?=\\])/gm)[0]
									const linkHref = link.match(/(?<=\\().+?(?=\\))/g)[0]
									const element = '<a href="'+linkHref+'" target="_blank">'+title+'</a>'
									strToAdd = strToAdd.replace(link, element)
								})
								const $spanStr = $("<span></span>")
								$spanStr.html(strToAdd)
								$(chatMessageText).append($spanStr)
							}
						}
							
						if(scrollToBottom){
							objDiv.scrollTop = objDiv.scrollHeight
						}
						// if (completed){
						// 	showFeedbackToaster()
						// }
					}

					function isScrolledToBottom(el) {
						var $el = $(el);
						return el.scrollHeight - $el.scrollTop() - $el.outerHeight() < 30;
					}

					function addToAllAnswers(text){
						const $chatMessages = $(".chatMessage")
						const from = ($chatMessages.length - 4) % 2 === 0 ? "blackbox" : "user"
						lastAnswer = text
						if(allAnswers[$chatMessages.length - 5]){
							allAnswers[$chatMessages.length - 5].blackbox = allAnswers[$chatMessages.length - 5].blackbox + "\\n"+text
						}
						else{
							allAnswers[$chatMessages.length - 5] = {'blackbox': text}
						}
						allAnswers = allAnswers.filter(n => n)
					}

					function showFeedbackToaster(){
						if(!$(".quality-toaster").length){
							const $el = $('<div class="quality-toaster"><div class="toaster-text">How was the quality of your answer?</div><div class="icons-holder"><img src="${thumbsDownSrc}" class="bad-icon toaster-icon"><img src="${thumbsUpSrc}" class="good-icon toaster-icon"></div></div>')
				
							$el.find(".toaster-icon").on("click", function(){
								var type = '1' // 1 means thumbs up
								if($(this).hasClass("bad-icon")){
									type = '-1' // -1 is thumbs down
								}
								postMessage({command:"answerFeedback", type, query: lastSearchedQuery, answer: lastAnswer})
								qualityToasterSuccess()
							})
					
							$(".button-holder-feedback").prepend($el)
							setTimeout(() => {
								$(".quality-toaster").addClass("active")
							}, 50);	
						}

						if (${browserReadyToshow}) {
							showResultsOnWeb();
						}
						setTimeout(() => {
							var objDiv = document.getElementsByClassName("chat-area")[0]
							objDiv.scrollTop = objDiv.scrollHeight+5;
						}, 500)
					}

					function showResultsOnWeb() {
						const alreadyExists =  $('.msg-time').last().find('.a-link');
						// if (alreadyExists) {
						//   return;
						// }
						let browserReadyToshow = ${browserReadyToshow};
						const $sLink = $('<a class="a-link" href style="text-decoration: none;">See Web Results</a>');
						const $div = $('<div class="web-results"></div>');
						
						if(browserReadyToshow){
							$div.append($sLink);
						}
						$('.msg-time').last().append($div);
			
						$sLink.on('click', function(event) {
						  const $userMsg = $(event.target).parent().parent().parent().prevAll('.chatMessage.sent').first();
						  const text = $userMsg.find('.chatMessage-text').text()
						  postMessage({ command: 'results-on-web', text });
						});
					  }
				
					function hideQualityToaster(instant){
						var timeToRemove = 1000
						if(instant){
							timeToRemove = 0
						}
						setTimeout(() => {
							setTimeout(()=>{$(".quality-toaster").remove()},300)
							$(".quality-toaster").removeClass("active")
						}, timeToRemove);
					}
					function qualityToasterSuccess(){
						$(".quality-toaster").find(".toaster-text").text("Thank you!")
						$(".quality-toaster").find(".icons-holder").empty()
						$(".quality-toaster").find(".icons-holder").append('<img src="${checkImgSrc}" class="toaster-icon">')
						hideQualityToaster()
					}

					function showRelated(data){
						const {arr, id} = data
						const relArr = []
						if(relArr.length){
							const $el = $('.chatMessage[data-id='+id+']')
							const $related = $("<div class='rel-holder'><div class='related-title'>related code search results: </div></div>")
							var objDiv = document.getElementsByClassName("chat-area")[0]
							relArr.forEach((el, idx)=>{
								var domain = new URL(el.url).hostname.split(".")
								if(domain[1].toLowerCase() == "com"){
									domain = domain[0]
								}
								else{
									domain = domain[1]
								}

								var extraClass = ""
								var previewClass = "active"
								var previewBtn = ""
								var previewText = '<a target="_blank" href="'+el.url+'" class="rel-preview active" style="display:none">'+truncate(el.preview, 140)+'</a>'
								
								const $elToAppend = $('<div class="rel-item '+extraClass+'"><a target="_blank" href="'+el.url+'"  class="rel">'+el.title+'</a><div class="rel-bottom-holder"><div class="rel-src">(source: '+domain+')</div>'+previewBtn+'</div>'+previewText+'</div>')
								
								$related.append($elToAppend)
							})
		
							$el.append($related)
		
							var objDiv = document.getElementsByClassName("chat-area")[0]
							

							setTimeout(()=>{
								objDiv.scrollTop = objDiv.scrollHeight
							},30)
							
						}
					}

					function truncate(str, n){
						return (str.length > n) ? str.slice(0, n-1) + '...' : str;
					}

					function showHistory(data){
						const {chatHistory} = data
						chatHistory.forEach((el, idx)=>{
							if(idx % 2 == 0){
								sendMessage(el.question, el.time, false)
								$(".send-message").attr("disabled", false)
							}
							else{
								recieveMessage("", "BLACKBOX AI Chat", null, { confidence: 0 }, el.id)
								receiveStream(el.answer, "BLACKBOX", null, { confidence: 0 }, false, el.id, false, el.raw)
							}
						})

						$(".chatMessage").find(".typing").css("display", "none")
					}

					window.addEventListener('message', event => {
						const data = event.data
						if(data.command === "showAnswer"){
							hideLoading()
							recieveMessage(data.answer, from = "BLACKBOX AI Chat", time = null, data.type, data.id)
						}else if(data.command === "showStream"){
							receiveStream(data.answer, from = "BLACKBOX", time = null, data.type, data.completed, data.id, data.clickedContinue, data.raw)
						}else if(data.command === "showPart"){
							showPart(data.part, data.id)
						}else if(data.command === "finishPart"){
							finishPart()
						}else if(data.command === "removeTyping"){
							$(".chatMessage[data-id="+data.id+"]").find(".typing").css("display", "none")
							lastAnswer = data.raw
							addToAllAnswers(lastAnswer)
							showFeedbackToaster()
						}else if(data.command === "continueTyping"){
							$(".chatMessage[data-id="+data.id+"]").find(".typing").css("display", "flex")
							$(".chatMessage[data-id="+data.id+"]").find(".typing").html("blackbox typing <img src='${loadingIconSrc}' class='typing-loading'>")
							postMessage({
								command: "sendMessage",
								continue:true,
								allMessages: allAnswers
							})
						}else if(data.command === "pauseTyping"){
							$(".chatMessage[data-id="+data.id+"]").find(".typing").html("blackbox paused")
						}else if(data.command === "showPause"){
							var objDiv = document.getElementsByClassName("chat-area")[0]
							const scrollToBottom = isScrolledToBottom(objDiv)
							$(".beside-btn").removeClass("active")
							$(".pause-btn").addClass("active")
							if(scrollToBottom){
								objDiv.scrollTop = objDiv.scrollHeight
							}
						}else if(data.command === "showContinue"){
							var objDiv = document.getElementsByClassName("chat-area")[0]
							const scrollToBottom = isScrolledToBottom(objDiv)
							$(".beside-btn").removeClass("active")
							$(".continue-btn").addClass("active")
							if(scrollToBottom){
								objDiv.scrollTop = objDiv.scrollHeight
							}
						}else if(data.command === "hideBeside"){
							$(".beside-btn").removeClass("active")
						}else if(data.command === "showRelated"){
							showRelated({arr: data.arr.response, id: data.id})
						}else if(data.command === "addAnswerToArr"){
							addToAllAnswers(data.stream)
						}else if (data.command === "showChatCode"){
							if (data.query){
								let question = data.query
								if(question){
									setTimeout(()=>{
										$(this).css("height", "")
									},10)
									sendMessage(
										question,
										time = null,
										sendToApi = true,
										false, 
										data.queryFromOutside
									)
								}
							}
						}else if(data.command === "showHistory"){
							showHistory(data)
						}
					});
					function check_if_query_editor(){
						postMessage({command:"check_if_query_editor"})
					}
					check_if_query_editor()

					postMessage({command:"init"})
				}())
				</script>
			</body>
			</html>
		`
	}
	var isPressedEnter = false
	vscode.workspace.onDidChangeTextDocument(event => {
		const textEditor = vscode.window.activeTextEditor;
		if (textEditor && event.document === textEditor.document) {
			const contentChanges = event.contentChanges;
			const lastChange = contentChanges[contentChanges.length - 1];
			if (lastChange){
				if (lastChange.text.includes('\n')) {
					isPressedEnter = true
				}
			}
		}
	});
	const statusBarBtn = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBarBtn.text = 'Blackbox';
	statusBarBtn.tooltip = 'BLACKBOX AI Code Chat';
	statusBarBtn.command = 'blackbox.showChat';
	statusBarBtn.show();

  	var saveDocRunning = false;

	async function saveDoc() {
		if (saveDocRunning){
			return;
		}
		saveDocRunning = true;

		try {
			const baseFolder = _.globalStorageUri.fsPath;
			const time = Date.now()

			const userTempFolder = path.join(baseFolder,workspaceFolderId);
			let currentDirs = vscode.workspace.workspaceFolders[0].uri.fsPath;
			const ifTheFirstCommit = currentDirs.length <= 1;
			const userTempTimedFolder = path.join(userTempFolder,time.toString());

			try {
				fs.accessSync(userTempTimedFolder)
			} catch(error){
				fs.mkdirSync(userTempTimedFolder,  { recursive: true });
			}

			const documents = vscode.workspace.textDocuments

			const pathsName = []
			const fullPath = path.join(userTempFolder, controlFileName);
			let fileControlContent = {};

			try{
				fileControlContent = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
			}catch(e){}

			let isFileChanged = false;
			for (let i = 0; i < documents.length; i++) {
				const document = documents[i]
				if (!document.uri.fsPath.endsWith('.git') && document.uri.scheme === "file" && document.uri._formatted.startsWith("file")) {

					const documentText = document.getText();

					const relativePath = vscode.workspace.asRelativePath(document.uri.fsPath);
					const relativePathNoLevels = relativePath.split("/").join("$$")

					const relativePathFull = path.join(userTempTimedFolder, relativePathNoLevels);

					if (fileControlContent[relativePathNoLevels]) {
						const lastTime = fileControlContent[relativePathNoLevels].pop();
						const fullFilePath = path.join(userTempFolder, lastTime, relativePathNoLevels);
						
						await unzip(fullFilePath);
						const lastFileContent = fs.readFileSync(fullFilePath, 'utf-8');
						fs.unlinkSync(fullFilePath);

						if (documentText === lastFileContent){// we can user hashes here
							continue;
						}
						else {
							const diff = Diff.createTwoFilesPatch("temp", "temp", lastFileContent, documentText, '', '', { context: 0 })
							const min_diff_char_count = 500
							if (diff.length < min_diff_char_count) { 
								continue
							}
						}
					}

					isFileChanged = true;

					fs.writeFileSync(relativePathFull, documentText);
					await zip(relativePathFull);
					fs.unlinkSync(relativePathFull);
					saveControlFile(userTempFolder, relativePathNoLevels, time)
					
				}
			}

      if (!isFileChanged) {
				try { 
					fs.rmdirSync(userTempTimedFolder)
				} catch(e){}
			}
      
      if (isFileChanged) {
        await GetDiffName({ time, path: userTempTimedFolder, ifTheFirstCommit})
      }
		}
		catch (e) {
			console.log(e)
		}

		if (diffPanel) {
			vscode.commands.executeCommand('blackbox.showDiff');
		}

		setTimeout(()=>{
			saveDocRunning = false;
		}, 1000);
	}

	async function GetDiffName(data) {
		const { time, path, ifTheFirstCommit} = data
		const contents = await getPreviousTimestamp(time.toString())
		var diffString = ""
		contents.forEach((content, idx) => { 
			const diff = Diff.createTwoFilesPatch(content.file, content.file, content.previousContent, content.currentFileContent, '', '', { context: 3 })
			diffString += diff +"\n"
		})

		if (ifTheFirstCommit) {
			try{
				updateFolderName({time, name: 'init', oldPath: path, diffString });
				selectionFct('Request Commit Message')
			}catch {
				console.log('Error init: ', e)
			}
		}else{
			let result = {response: ''}
			try{
				const response = await (0, node_fetch_1.default)(
					"https://www.useblackbox.io/commit-message",
					{
						method: "POST",
						body: JSON.stringify({
							userId: userId,
							diff: diffString
						}
						),
						headers: {
							"Content-Type": "application/json",
							Accept: "application/json"
						}
					}
				)

				result = await response.json()
			}catch(e){
				console.log(`Error while sending commit message to BlackBox server ${e}`)
			}
			updateFolderName({time, name: result.response, oldPath: path})
		}
	}

	function updateFolderName(data) {
		var { time, name, oldPath, diffString } = data

		fs.writeFileSync(path.join(oldPath, "blackbox_difftitle"), name)
	}


	vscode.workspace.onDidSaveTextDocument(async event => {
		if(inWorkSpace && versionerStatus) saveDoc()
	})
	function createConfig() { 
		const idPath = _.workspaceState.get('workspaceFolderId');
		workspaceFolderId = idPath;

		if (!idPath) {
			workspaceFolderId = uuid()
			_.workspaceState.update('workspaceFolderId', workspaceFolderId);
		}
	}

	function zip(input) {
		const output = `${input}.gz`;
		const gzip = createGzip();
		const inputRaw = fs.createReadStream(input);
		const outZipped = fs.createWriteStream(output);
		return pipe(inputRaw, gzip, outZipped);
	}
	
	function unzip(file) {
		const input = `${file}.gz`;
		const gunzip = createUnzip();
		const inputZipped = fs.createReadStream(input);
		const outputRaw = fs.createWriteStream(file);
		return pipe(inputZipped, gunzip, outputRaw);
	}
  

  	function saveControlFile(baseDir, fileName, time){
		const fullPath = path.join(baseDir, controlFileName);

		let content = {};
		try{
			content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
		}catch(error){

		}

		if(!content[fileName]){
			content[fileName] = []
		}
		content[fileName].push(time.toString());

		fs.writeFileSync(fullPath, JSON.stringify(content));
	}
	
	async function getFileContent(timestamp, filename) { 
    	const baseFilename = filename.replace('.gz','')
		const baseFolder = _.globalStorageUri.fsPath
		const folder = path.join(baseFolder, workspaceFolderId, timestamp, baseFilename);

    	await unzip(folder);

		const content = fs.readFileSync(folder, "utf8")
    	fs.unlinkSync(folder);

    	return content;
	}

	async function getPreviousTimestamp(folderName) {
    const baseFolder = _.globalStorageUri.fsPath;
  
    const userTempTimedFolder = path.join(baseFolder, workspaceFolderId, folderName);
  
	const currentFiles = fs.readdirSync(userTempTimedFolder).filter(file => file !== 'diff.git' && file !== "blackbox_difftitle");
	const emptyFileFullPath = path.join(baseFolder, workspaceFolderId, 'empty');
	fs.writeFileSync(emptyFileFullPath, '');
  
    const fullPath = path.join(baseFolder, workspaceFolderId, controlFileName);
    let fileControlContent = {};
  
    try {
      fileControlContent = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    } catch (e) {
      console.error(e);
    }
  
    const contents = await Promise.all(
      currentFiles.map(async file => {
        const relativePathNoLevels = file.split('/').join('$$').replace('.gz', '');
  
        const fileFullPath = path.join(userTempTimedFolder, file.replace('.gz', ''));
  
        await unzip(fileFullPath);
        const currentFileContent = fs.readFileSync(fileFullPath, 'utf-8');
  
        fs.unlinkSync(fileFullPath);
  
		let previousFilePath = emptyFileFullPath;
        let previousContent = '';
  
        if (fileControlContent[relativePathNoLevels]) {
          const folderList = fileControlContent[relativePathNoLevels];
         
          let previousTimestamp;
          const currentFolderTimestamp = getFolderTimestamp(folderName);
         
          for (let index = folderList.length - 1; index >= 0; index--) {
            const previousFolderNameTime = getFolderTimestamp(folderList[index]);
           
            if (Number(currentFolderTimestamp) > Number(previousFolderNameTime)) {
              previousTimestamp = folderList[index];
              break;
            }
          }
  
          if (previousTimestamp) {
            previousFilePath = path.join(baseFolder, workspaceFolderId, previousTimestamp, relativePathNoLevels);
            await unzip(previousFilePath);
            previousContent = fs.readFileSync(previousFilePath, 'utf-8');
            fs.unlinkSync(previousFilePath);
          }
        }
  
        return { file: file.split('$$').join('/').replace('.gz', ''), currentFileContent, previousContent, currentFilePath: fileFullPath, previousFilePath };
      })
    );
  
    return contents;
  }
  
  function getFolderTimestamp(folderName) {
    if (Number(folderName)) {
      return folderName;
    }
  
    const timePart = folderName.split('--')[0];
  
    if (Number(timePart)) {
      return timePart;
    }
  
    return folderName;
  }

	var diffPanel
	vscode.commands.registerCommand('blackbox.showDiff', async () => {
    if (!versionerStatus) {
      const enableIt = 'Enable';
      const userResp = await vscode.window.showInformationMessage('Blackbox: versioner is not enabled', enableIt );
      if (userResp !== enableIt) {
        return;
      }
      _.globalState.update("versionerStatus", true);
      versionerStatus = true;
      createConfig();
    }

		if (diffPanel) {
      diffPanel.webview.html = ''
      diffPanel.webview.html = getDiffView(diffPanel.webview)
			diffPanel.reveal(vscode.ViewColumn.Two)
			function postMessage(obj) {
				diffPanel.webview.postMessage(obj)
			}
		} else {
			function postMessage(obj) {
				diffPanel.webview.postMessage(obj)
			}
			diffPanel = vscode.window.createWebviewPanel(
				'blackbox-diff',
				'Blackbox Diff',
				vscode.ViewColumn.Two, {
					enableScripts: true
				}
			)

			diffPanel.webview.html = getDiffView(diffPanel.webview)
			diffPanel.onDidDispose(() => {
				diffPanel = undefined
			})
			diffPanel.webview.onDidReceiveMessage(async data => {
				if (data.command === 'getListOfVersions') {
					const folderPath = path.join(_.globalStorageUri.fsPath, workspaceFolderId)
					if (folderPath) {
						try{
							const timestamps = fs.readdirSync(folderPath)
							const arr = []
							timestamps.forEach((stampFolder, idx) => {
								if (!ignoreFiles.includes(stampFolder)) {
									const obj = {date: parseInt(stampFolder.split("--")[0]), foldername: stampFolder}
									const innerFolder = fs.readdirSync(path.join(folderPath, stampFolder)).filter(file => file !== 'diff.git');
									const changed = []
									innerFolder.forEach((inner, idx) => {
										if (inner == "blackbox_difftitle") {
											obj.title = fs.readFileSync(path.join(folderPath, stampFolder, inner), "utf8")
										}
										else {
											changed.push(inner)
										}
									})

									obj.changed = changed

									if (!obj.title) { 
										const stampFolderTitle = stampFolder
										var title = ""
										if (stampFolderTitle.split("--").length > 1) {
											const splitted = stampFolderTitle.split("--");
											title = splitted.slice(1).join("--").split("%%").join(" ");
			
											if (!title) {
												title = date;
											}
										}

										obj.title = title
									}

									arr.push(obj)
								}
							})
							postMessage({ command: 'listVersions', history: arr, starredDiffs: JSON.parse(_.workspaceState.get("starredDiffs") ?? "[]") })
						}catch(e){
							console.log(`Error while reading ${path}`);
						}
					}
				} else if (data.command === 'getEntryDiff') {
					const { entryA, entryB } = data

					if (!entryA.file || !entryB.file) {
						return;
					}

					const contentA = await getFileContent(entryA.folder, entryA.file)
					const contentB = await getFileContent(entryB.folder, entryB.file)

					const diff = Diff.createTwoFilesPatch(entryA.file.split("$$").join("/").replace('.gz',''), entryB.file.split("$$").join("/").replace('.gz',''), contentA, contentB, '', '', { context: 0 })
					postMessage({ command: 'showCommitDiff', diff })
				} else if (data.command === "showDiff") { 
					const { id } = data
					const contents = await getPreviousTimestamp(id)
					var diffString = ""
					var lines = []
          const currentWorkspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;

          for (let content of contents) {
            if (!content.previousFilePath.endsWith('empty')) {
              await unzip(content.previousFilePath);
            }

            await unzip(content.currentFilePath);

			const gitCommand = 'git diff --no-index --unified=3';
            const commandToRun = `${gitCommand} "${content.previousFilePath}" "${content.currentFilePath}"`;
            let diff = '';
            try {
              diff = execSync(commandToRun, { cwd: currentWorkspaceFolder }).toString();
            } catch (error) {
              if (error.stdout) {
                diff = error.stdout.toString();
              }
            }
						const diffTrimmed = trimDiff(diff)
            .replaceAll(content.previousFilePath.replaceAll('\\','\\\\'), content.file)
            .replaceAll(content.currentFilePath.replaceAll('\\','\\\\'), content.file)
						lines.push(Diff.structuredPatch(content.file, content.file, content.previousContent, content.currentFileContent, '', '', {context: 3}).hunks)
            diffString += diffTrimmed +"\n";

            if (!content.previousFilePath.endsWith('empty')) {
              fs.unlinkSync(content.previousFilePath);
            }

            fs.unlinkSync(content.currentFilePath);
					}

					postMessage({ command: 'showCommitDiff', diff: diffString.trim(), lines })
				}
			})
		}
	})

	function trimDiff(diffString) {
		const splitted = diffString.split('\n');
		let validLine = false;
		const numOfTabs = splitted.reduce((acc,s) => {
			if (!validLine) {
				if (s.startsWith('@@')) {
				validLine = true;
				}
				return acc;
			}
		
			if (s.startsWith('@@')) {
				validLine = true;
				return acc;
			}
		
			const cleanString = s.replace(/\-|\+/,'').replace(/\r/,'');
			if (!cleanString || cleanString.length < 1) {
				return acc;
			}
		
			const count = countSpacesAtBeginning(cleanString);
		
			return acc < count ? acc: count;
		}, Number.MAX_SAFE_INTEGER);
	
		const regTab = new RegExp('\t', 'g');
		if (numOfTabs <= 2) {
			return diffString.replace(regTab, '  ');
		}
	
		const reg = new RegExp(`([ \\t]{${numOfTabs}})`, 'g');
	
		const trimmedDiff = diffString.replace(regTab, ' ').replace(reg, '');
	
		return trimmedDiff;
	}

	function countSpacesAtBeginning(s) {
		let count = 0;
		for (let index = 0; index < s.length; index ++) {
			const c = s.charAt(index);
			if (c !== ' ' && c !== '\t') {
				return count;
			}
			count++;
		}
	
		return count;
	}

	function getDiffView(webview) {
		const chevronUp = vscode.Uri.file(path.join(_.extensionPath, "out/imgs/chevron-up.png"))
		const chevronDown = vscode.Uri.file(path.join(_.extensionPath, "out/imgs/chevron-down.png"))
		const diff2HtmlCss = vscode.Uri.file(path.join(_.extensionPath, "out/css/diff2html.css"))
		const diff2HtmlJs = vscode.Uri.file(path.join(_.extensionPath, "out/js/diff2html.js"))

		const normalize = vscode.Uri.file(path.join(_.extensionPath, "out/css/normalize-diff.css"))
		const webflowCss = vscode.Uri.file(path.join(_.extensionPath, "out/css/webflow-diff.css"))
		const diffCss = vscode.Uri.file(path.join(_.extensionPath, "out/css/diff.css"))
		const dots = vscode.Uri.file(path.join(_.extensionPath, "out/imgs/icon-dots.svg"))
		const webflowJs = vscode.Uri.file(path.join(_.extensionPath, "out/js/webflow-diff.js"))

		const chevronUpSrc = webview.asWebviewUri(chevronUp)
		const chevronDownSrc = webview.asWebviewUri(chevronDown)
		const diff2HtmlCssSrc = webview.asWebviewUri(diff2HtmlCss)
		const diff2HtmlJsSrc = webview.asWebviewUri(diff2HtmlJs)

		const normalizeSrc = webview.asWebviewUri(normalize)
		const webflowCssSrc = webview.asWebviewUri(webflowCss)
		const diffCssSrc = webview.asWebviewUri(diffCss)
		const dotsSrc = webview.asWebviewUri(dots)
		const webflowJsSrc = webview.asWebviewUri(webflowJs)

    	return `
		<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<title>BLACKBOX diff</title>
				<link rel="stylesheet" type="text/css" href="${diff2HtmlCssSrc}" />

				<link href="${normalizeSrc}" rel="stylesheet" type="text/css">
				<link href="${webflowCssSrc}" rel="stylesheet" type="text/css">
				<link href="${diffCssSrc}" rel="stylesheet" type="text/css">

				<link href="https://fonts.googleapis.com" rel="preconnect">
				<link href="https://fonts.gstatic.com" rel="preconnect" crossorigin="anonymous">
				<script src="https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js" type="text/javascript"></script>
				<script type="text/javascript">WebFont.load({  google: {    families: ["Inconsolata:400,700","Inter:200,300,regular,500,600,700,800,900","Source Code Pro:regular,600,700,900"]  }});</script>
				<script type="text/javascript">!function(o,c){var n=c.documentElement,t=" w-mod-";n.className+=t+"js",("ontouchstart"in o||o.DocumentTouch&&c instanceof DocumentTouch)&&(n.className+=t+"touch")}(window,document);</script>
			</head>
			<body>
			<style>
				body{
					padding:0;
					overflow:hidden;
				}
				.page-holder{
					display:flex;
				}

				.left{
					width: 350px;
					display: flex;
					flex-direction: column;
					gap: 10px;
					flex-shrink:0
					height: 100vh;
				}

				.menu-search{
					margin: 5px;
					padding: 9px 12px 11px;
					background: #ffffff17;
					border-radius: 6px;
					border: none;
					outline: none;
					color: #e9edef;
					font-size: 14px;
					white-space: pre-wrap;
					font-family: var(--vscode-font-family);
					position:static;
					top:0;
				}

				.version-container{
					height: calc(100vh - 80px);
				}

				.menu-item .collapse{
					display:none;
				}
				.menu-item.active .collapse{
					display:block;
				}
				.menu-item.active .expand{
					display:none;
				}

				.menu-time{
					font-size: 11px;
					color:#777;
				}
				.d2h-del{
					color: #e6edf3!important;
					background-color: rgba(248,81,73,0.2)!important;
				}
				.d2h-code-side-linenumber {
					color: #6e7681;
					background-color: transparent;
				}
				.d2h-code-side-line {
					color: #d2a8ff!important;
				}

				.d2h-code-line del, .d2h-code-side-line del {
					background-color: rgb(255 182 186 / 15%);
				}
				.d2h-code-line ins, .d2h-code-side-line ins {
					background-color: rgb(151 242 149 / 15%);
				}
				.d2h-code-side-linenumber {
					border: 0;
				}
				
				.d2h-ins {
					color:#e6edf3;
					background-color:rgba(63,185,80,0.3)
				}

				.d2h-code-side-emptyplaceholder, .d2h-emptyplaceholder{
					background-color:transparent;
				}

				.d2h-file-side-diff:nth-of-type(even){
					border-left:1px solid #777;
				}
				.d2h-file-wrapper{
					border-color: #464646;
				}

				.d2h-file-header{
					border-color: #464646;
				}
				.d2h-file-diff .d2h-ins.d2h-change{
					background-color:rgba(63,185,80,0.2);
				}
				.d2h-code-linenumber{
					background-color:unset;
					color:#fff;
				}
				.diff-view{
					flex-grow:1;
					padding:0 20px;
				}

				.menu-info{
					display: flex;
					align-items: center;
					justify-content: space-between;
				}
				.radio-holder{
					display: flex;
					align-items: center;
					gap: 10px;
				}

				.children-holder{
					display:none;
					width:95%;
				}
				.children-holder.active{
					display:flex;
					flex-direction:column;
					gap:5px;
				}

				.child-item{
					padding: 8px 25px;
					border-bottom: 1px solid #4c4c4c;
					display: flex;
					justify-content: space-between;
					align-items: center;
				}
				.option-btn{
					padding:3px;
					transition:0.3s ease all;
					border-radius:5px;
					cursor:pointer;
					width:30px;
				}
				.option-btn:hover{
					background-color:rgba(255,255,255,0.4)
				}

				.icons-holder{
					display:flex;
					position:relative;
					align-items:center;
					gap:5px;
				}

				.d2h-lines-added{
					width: 45px;
					height: 32px;
					display: flex;
					align-items: center;
					justify-content: center;
					color: #32cf0a;
					background-color: rgba(76, 238, 40, .05);
				}

				.d2h-lines-deleted{
					width: 45px;
					height: 32px;
					display: flex;
					align-items: center;
					justify-content: center;
					color: #f84c4c;
					background-color: rgba(255, 0, 0, .05);
				}

				.d2h-file-stats{
					border: 1px solid rgba(255, 255, 255, .18);
    				border-radius: 8px;
				}

				.d2h-file-name{
					color: #fff!important;
					font-size:13px;
				}

				.d2h-file-list>li{
					border-bottom: 1px solid #424242;
				}

				.d2h-icon{
					display:none;
				}

				.d2h-tag{
					display:none;
				}

				.d2h-file-name-wrapper svg{
					display:none;
				}

				.link-block-26 {
					z-index: 2;
					width: 170px;
					color: #fff;
					background-color: #242832;
					border: 1px solid rgba(255, 255, 255, .11);
					border-radius: 4px;
					align-self: center;
					margin-right: 16px;
					padding: 10px;
					display: none;
					position: absolute;
					top: 0%;
					bottom: auto;
					left: auto;
					right: 0%;
					box-shadow: 0 2px 20px rgba(0, 0, 0, .3);
				}

				.d2h-diff-tbody{
					position:relative;
				}

				.restore-popup.active{
					display:flex;
				}

				.d2h-diff-tbody tr:first-child .copy-added{
					display: none;
				}

				.d2h-info {
					background-color: #404040;
					color: rgb(181 181 181);
				}

				.d2h-file-list-header{
					display:none;
				}

				.sidebar-header {
					border-bottom: 1px solid rgba(255, 255, 255, .1);
					justify-content: space-between;
					align-self: stretch;
					align-items: center;
					padding: 20px;
					display: flex;
				}

				.heading-3-5 {
					color: #fff;
					margin-top: 0;
					margin-bottom: 0;
					font-size: 16px;
					font-weight: 500;
					line-height: 28px;
				}

				.version-list{
					display: flex;
					flex-direction: column;
					align-items: end;
				}

				.top-holder{
					width: 95%;
				}

				.d2h-file-header{
					background-color: transparent!important;
				}
				.d2h-file-diff{
					background-color: transparent!important;
				}
				.diff-view{
					height: 100vh;
					overflow-y: auto;
				}
			</style>
				<div class="page-holder">
					<div class="left">
						<div class="sidebar-header"><h1 class="heading-3-5">Revision History</h1></div>
						<!--<input type="text" class="menu-search" placeholder="search...">-->
						<div class="version-container"></div>
					</div>
					<div class="diff-view"></div>
				</div>
				<script src="https://code.jquery.com/jquery-3.6.3.js" integrity="sha256-nQLuAZGRRcILA+6dMBOvcRh5Pe310sBpanc6+QBmyVM=" crossorigin="anonymous"></script>
				<script type="text/javascript" src="${diff2HtmlJsSrc}"></script>
				<script type="text/javascript" src="${webflowJsSrc}"></script>
				<script>
				(function() {
					const vscode = acquireVsCodeApi();
					
					function postMessage(obj){
						vscode.postMessage(obj)
					}

					$(document).on("keyup", ".menu-search", function(){
						const query = $(this).val()
						$(".menu-item").each((idx, el)=>{
							const $el = $(el)
							const title = $el.find(".editable-title").val()
							if(query){
								if(title.includes(query)){
									$el.show()
								}
								else{
									$el.hide()
								}
							}
							else{
								$el.show()
							}
						})
					})

					function showDiff(data){
						const $holder = $(".diff-view")
						$holder.empty()
						var diffHtml = Diff2Html.html(data, {
							drawFileList: true,
							matching: 'lines',
							outputFormat: 'line-by-line',
							theme:'dark'
						});
						$holder.html(diffHtml)
					}

					$(document).on("change", ".view-pos", function(){
						const view = $(this).attr("name")
						const folder = $(this).closest(".child-item").attr("data-folder")
						const file = $(this).closest(".child-item").attr("data-file")

						$("input[name='"+view+"']").each((idx, el)=>{
							const $el = $(el)
							$el.prev().removeClass("w--redirected-checked")
						})

						$(this).prev().addClass("w--redirected-checked")

						if(view === "pre-view"){
							entryA = {file, folder}
						}
						else {
							entryB = {file, folder}
						}

						if (entryA.file === entryB.file) {
							postMessage({command:"getEntryDiff", entryA, entryB})
						}
					})

					const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
					var entryA = {file: "", filename: ""}
					var entryB = {file: "", filename: ""}
					function showVersions(data){
						const $holder = $(".version-container")
						$holder.empty()


						data.sort((a,b)=>(b.date - a.date))

						data.forEach((el, idx)=>{
							const files = el.changed
							var title = el.title
							var date = parseInt(el.date)
							const foldername = el.foldername

							var dTime = new Date(date)
							var elTitle = title
							var elDate = monthNames[dTime.getMonth()] + " "+ dTime.getDate()+", "+dTime.getFullYear() +" - "+ dTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
							if(isNumeric(title)){
								elTitle = monthNames[dTime.getMonth()] + " "+ dTime.getDate()+", "+ dTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
								elDate = ""
							}

							const specClass = idx == 0 ? "active" : ""
							const $item = $('<div class="version-list menu-item" data-id="'+parseInt(date)+'"><div class="top-holder '+specClass+'"><div class="div-block-104"><div class="form-block-5 w-form"><div><div class="editable-title w-input">'+elTitle+'</div></div></div><div class="body-1 tranparent">'+elDate+'</div></div></div></div></div>')

							const $childrenHolder = $('<div class="children-holder active" data-id="'+date+'"></div>')
							
							files.forEach((file, idx)=>{
								const $child = $('<div class="child-item" data-file="'+file+'" data-folder="'+date+'"><div class="child-title">'+file.split("$$").join("/").replace('.gz','')+'</div></div>')

								$childrenHolder.append($child)
							})

							$holder.append($item)
							$item.append($childrenHolder)

							$item.find(".top-holder").on("click", function(e){
								const $target = $(e.target)
								if(!$target.hasClass("option-btn") && !$target.hasClass("radio-button") && !$target.hasClass("restore-popup")){
									$(".top-holder").removeClass("active")
									$item.find(".top-holder").addClass("active")
									$item.addClass("active")
									postMessage({command:"showDiff", id: el.foldername});
                  					resetRadios();
								}
								else if($target.hasClass("list-option")){
									const folderId = $item.attr("data-id")
									if($target.hasClass("collapse")){
										$item.removeClass("active")
										$childrenHolder.removeClass("active")
									}
									else{
										$item.addClass("active")
										$childrenHolder.addClass("active")
									}
								}
							})
						})
						if(data.length){
							postMessage({command:"showDiff", id: data[0].foldername})
						}
					}

					function isNumeric(value) {
						return /^-?\\d+$/.test(value);
					}

					function reverseObject(obj) {
						var reversedObj = {};
						
						for (var key in obj) {
							if (obj.hasOwnProperty(key)) {
							reversedObj[obj[key]] = key;
							}
						}
						
						return reversedObj;
					}

					var canRemovePopup = true

					$(document).on("click", function(e){
						if(canRemovePopup){
							$(".restore-popup.active").removeClass("active")
						}
					})

					function resetRadios() {
						$('input[name="pre-view"]').prop('checked', false);
						$('input[name="post-view"]').prop('checked', false);
					}

					window.addEventListener('message', event => {
						const data = event.data
						if(data.command === "showCommitDiff"){
							showDiff(data.diff)
						}
						else if(data.command === "listVersions"){
							showVersions(data.history)
						}
					});

					function getList(){
						vscode.postMessage({command: 'getListOfVersions'});
					}
					getList()
				}())
				</script>
			</body>
			</html>
		`;
  	}

	  vscode.commands.registerCommand('blackbox.readMe', async () => {
		showWorkspaceFiles()
	})

	async function getFilesRecursively(folderUri) {
		const gitignoreFolders = await retrieveGitignoreFolders(folderUri)
		const files = await vscode.workspace.fs.readDirectory(folderUri)
		const result = []
	  
		for (const [name, type] of files) {
			const uri = vscode.Uri.joinPath(folderUri, name)
		
			if (shouldSkipFolder(uri, gitignoreFolders)) {
				continue // Skip the folder
			}
		
			if (type === vscode.FileType.File) {
				if (!name.startsWith('.') && !uri.fsPath.includes('test') && !uri.fsPath.includes('.git') && !uri.fsPath.includes('node_modules')) {
				result.push(uri)
				}
			} else if (type === vscode.FileType.Directory) {
				const nestedFiles = await getFilesRecursively(uri)
				result.push(...nestedFiles)
			}
		}
		
		return result
	}

	
	async function retrieveGitignoreFolders(folderUri) {
		const gitignorePath = vscode.Uri.joinPath(folderUri, '.gitignore').fsPath
		const gitignoreContent = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : ''
	
		const lines = gitignoreContent.split('\n')
		const folders = []
	
		for (const line of lines) {
			const trimmedLine = line.trim()
	
			if (trimmedLine && !trimmedLine.startsWith('#')) {
				const folderPath = vscode.Uri.joinPath(folderUri, trimmedLine).fsPath
				folders.push(folderPath)
			}
		}
	
		return folders
	}

	function shouldSkipFolder(folderUri, gitignoreFolders) {
		const folderPath = folderUri.fsPath
	
		for (const gitignoreFolder of gitignoreFolders) {
			if (folderPath.startsWith(gitignoreFolder)) {
				return true
			}
		}
	
		return false
	}

	async function showWorkspaceFiles() {
		const workspaceFolders = vscode.workspace.workspaceFolders;

		if (!workspaceFolders) {
			vscode.window.showErrorMessage('No workspace folders found.');
			return;
		}

		const selectedFolderPath = await vscode.window.showWorkspaceFolderPick({
			placeHolder: 'Select a workspace folder'
		});

		if (!selectedFolderPath) {
			return;
		}

		const files = await getFilesRecursively(selectedFolderPath.uri);

		const selectedFiles = await vscode.window.showQuickPick(
			files.map(file => file.fsPath),
			{ canPickMany: true, placeHolder: 'Select files to open' }
		);

		if (!selectedFiles) {
			return;
		}

		const loadingMessage = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
		loadingMessage.text = "$(loading~spin) BLACKBOX Loading..."
		loadingMessage.show()

		var allFiles = []
		for (const filePath of selectedFiles) {
			const fileContent = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
			const fileContentString = fileContent.toString('utf-8');

			const uri = vscode.Uri.file(filePath);
			const relativePath = vscode.workspace.asRelativePath(uri, false);

			allFiles.push(`File: ${relativePath}\n\n${fileContentString}`)
		}

		let result = {response: ''}
		try{
			const response = await (0, node_fetch_1.default)(
				"https://www.useblackbox.io/generate-readme",
				{
					method: "POST",
					body: JSON.stringify({
						allFiles,
						userId: userId
					}),
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json"
					}
				}
			)

			result = await response.json()
		}catch(e){
			console.log('Error generating readme ', e)
		}

		const fileName = 'BLACKBOX_README.md';

		const folderUri = vscode.workspace.workspaceFolders[0].uri;
		const fileUri = vscode.Uri.joinPath(folderUri, fileName);

		try {
			fs.writeFileSync(fileUri.fsPath, result.response);

			await vscode.commands.executeCommand('vscode.open', fileUri);

			vscode.window.showInformationMessage(`File ${fileName} created.`);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to create: ${error}`);
		} finally { 
			loadingMessage.dispose()
		}
	}

	vscode.commands.registerCommand('blackbox.commitMsg', async () => {
		if (!vscode.workspace.workspaceFolders) {
			vscode.window.showInformationMessage('Current VSCode instance is not in a workspace folder');
			return;
		}

		let diffString = ''
		const currentWorkspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;

		try {
			diffString = execSync('git diff', { cwd: currentWorkspaceFolder }).toString();
		} catch (error) {
			console.error(error);
			vscode.window.showErrorMessage('Your current folder doesn\'t seem to be a git repository');
		}

		if (!diffString) {
		  	return;
		}
		vscode.window.withProgress({
			title: 'Generating the commit message...',
			location: vscode.ProgressLocation.Notification
		}, async (progress, token) => {
			await generateCommitMessage(diffString);
			progress.report({increment:100})
		});
	});

	async function generateCommitMessage(diffString) {
		try {
			const response = await (0, node_fetch_1.default)('https://www.useblackbox.io/commit-message', {
				method: 'POST',
				body: JSON.stringify({
					userId: userId,
					diff: diffString,
					source: 'source control'
				}),
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
			})

			const result = await response.json();


			if (!result.response) {
				vscode.window.showErrorMessage('Try Again Generating Commit');
				return;
			}

			vscode.commands.executeCommand('workbench.view.scm');

			const gitExt = vscode.extensions.getExtension("vscode.git");
			const gitExtension = gitExt?.exports;

			const [repository] = gitExtension.getAPI(1).repositories;
			repository.inputBox.value = result.response;
		} catch (error) {
			console.error('Error from commit-message request', error);
		}
	}

	function addTextAtCursor(data) { 
		const { text } = data
		const editor = vscode.window.activeTextEditor

		if (editor) {
			try {
				const position = editor.selection.active

				const edit = new vscode.WorkspaceEdit()

				edit.insert(editor.document.uri, position, text)

				vscode.workspace.applyEdit(edit)
			} catch (e) {
				console.log(e)
			}
		}
	}

	var webSocket;
	var webSocketChat;
	let reconnectAttempt = 0;
	let max_reconnect_attempt = 20
	var penddingMessage = [];
	const server= 'wss://www.useblackbox.io';


	function webSocketChatConnect () {
		webSocketChat = new WebSocket(server);

		webSocketChat.on('open', () =>{
			reconnectAttempt=0
			console.log('WS Connection is open');
			
			if(penddingMessage.length>0){
				webSocketChat.send(JSON.stringify(penddingMessage[penddingMessage.length-1]))
				penddingMessage = [];
			}
		});

		webSocketChat.on('error', (error) =>{
			console.error(error.code);
		});
		webSocketChat.on('close', () =>{
			if (reconnectAttempt < max_reconnect_attempt){
				setTimeout(()=>{
					webSocketChatConnect()
					reconnectAttempt++;
				}, 1000);
			}
		})
		return webSocketChat
	}

	webSocketChatConnect();

	function webSocketConnect () {
		webSocket = new WebSocket(server);

		webSocket.on('open', () =>{
			reconnectAttempt=0
			console.log('WS Connection is open');
			
			if(penddingMessage.length>0){
				webSocket.send(JSON.stringify(penddingMessage[penddingMessage.length-1]))
				penddingMessage = [];
			}
		});

		webSocket.on('error', (error) =>{
			console.error(error.code);
		});
		webSocket.on('close', () =>{
			if (reconnectAttempt < max_reconnect_attempt){
				setTimeout(()=>{
					webSocketConnect()
					reconnectAttempt++;
				}, 1000);
			}
		})
		return webSocket
	}

	webSocketConnect();


	vscode.commands.registerCommand("extension.getSuggest", () => {
		let messageToBeSent = JSON.stringify({command:"editorautocomplete", context: getLinesAbove(), userId: userId});
		if(webSocket.readyState===1){
			webSocket.send(messageToBeSent)
		}else{
			penddingMessage.push(messageToBeSent)
			webSocket = new WebSocket(server);

			webSocket.on('open', () =>{
				reconnectAttempt=0
				
				if(penddingMessage.length>0){
					webSocket.send(penddingMessage[penddingMessage.length-1])
					penddingMessage = [];
				}
			});

			webSocket.on('error', (error) =>{
				console.error(error.code);
			});
			webSocket.on('close', () =>{
				if (reconnectAttempt < max_reconnect_attempt){
					setTimeout(()=>{
						webSocketConnect()
						reconnectAttempt++;
					}, 1000);
				}
			})
		}


		let stream_started = false
		vscode.window.setStatusBarMessage('Blackbox Searching...')
		webSocket.on('message', (event) => {
			let data = event.toString('utf-8')
			if(data == "connection established") data = ''
			if (data == '<|endoftext|>') data = ''
			addTextAtCursor({ text: data })
			if (stream_started == false){
				vscode.window.setStatusBarMessage('Blackbox')
				stream_started = true
			}
		})

		webSocket.on('close', (event) => {
			console.log('Connection closed:', event.code, event.reason);
		})

		webSocket.on('error', (error) =>{
			console.error(error)
		})
	})

	function getActiveSelectedTextInVSCodeEditor(){
		let editor = vscode.window.activeTextEditor;
		return editor && editor.selection ? editor.document.getText(editor.selection).trim(): "";
	}
	
	vscode.commands.registerCommand("extension.explainCode", () => {
		let selected_text = getActiveSelectedTextInVSCodeEditor()
		let prompt = selected_text + '\n\Explain this code'
		lastSearchedQuery = prompt
		is_triggered_from_Q = true
		vscode.commands.executeCommand("blackbox.showChat")
	})
	
	vscode.commands.registerCommand("extension.openChat", () => {
		vscode.commands.executeCommand("blackbox.showChat")
	})

	vscode.commands.registerCommand("extension.generateReadme", () => {
		vscode.commands.executeCommand("blackbox.readMe")
	})

	vscode.commands.registerCommand('blackbox.welcome', async () => {
		selectionFct('open walkthrough')
		await vscode.commands.executeCommand('workbench.action.openWalkthrough')
		return vscode.commands.executeCommand(
			`workbench.action.openWalkthrough`, 
			`Blackboxapp.blackbox#blackbox.welcomeStep`, 
			false
		)
	})
}

function getLinesAroundCursor() {
	const activeEditor = vscode.window.activeTextEditor
	if (activeEditor) {
		const cursorPosition = activeEditor.selection.active;
		const document = activeEditor.document;
		var linesCount = 50 - 2

		var linesAbove = ""
		var linesBelow = ""

		var takeAbove = true
		var takeBelow = true

		var aboveIndex = cursorPosition.line
		var belowIndex = cursorPosition.line
		var docLines = document.lineCount
		var keepLooping = true
		while (keepLooping) { 
			if (takeAbove && linesCount > -1) { 
				aboveIndex--
				if (aboveIndex > -1) {
					const text = document.lineAt(aboveIndex).text
					linesAbove =  text + "\n" + linesAbove
					linesCount--
				}
				else {
					takeAbove = false
				}
			}
			else {
				takeAbove = false
			}

			if (takeBelow && linesCount > -1) { 
				belowIndex++
				if (belowIndex < docLines) { 
					const text = document.lineAt(belowIndex).text
					linesBelow += text + "\n"
					linesCount--
				}
				else {
					takeBelow = false
				}
			}
			else {
				takeBelow = false
			}

			if (!takeAbove && !takeBelow) { 
				keepLooping = false
			}
		}

		return [linesAbove, linesBelow]
	}
	return [];
}

function getLinesAbove() {
	const activeEditor = vscode.window.activeTextEditor
	if (activeEditor) {
		const cursorPosition = activeEditor.selection.active;
		const document = activeEditor.document;
		var linesCount = 50 - 2

		var linesAbove = ""

		var takeAbove = true

		var aboveIndex = cursorPosition.line
		var keepLooping = true
		while (keepLooping) { 
			if (takeAbove && linesCount > -1) { 
				aboveIndex--
				if (aboveIndex > -1) {
					const text = document.lineAt(aboveIndex).text
					linesAbove =  text + "\n" + linesAbove
					linesCount--
				}
				else {
					takeAbove = false
				}
			}
			else {
				takeAbove = false
			}

			if (!takeAbove) { 
				keepLooping = false
			}
		}

		return [linesAbove]
	}
	return [];
}

exports.activate = activate
