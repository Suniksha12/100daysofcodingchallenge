import * as vscode from 'vscode';

import { search } from './utils/search';
import { matchSearchPhrase } from './utils/matchSearchPhrase';
import { autoCompleteSave } from './utils/autoCompletePhrase';
import { savedLines } from './utils/autoCompletePhrase';
const uuid = require("uuid").v4
const open = require('open')

import fetch from 'node-fetch';
export function activate(_: vscode.ExtensionContext) {
    var EXTENSION_STATUS: any = false
    if (_.globalState.get("extensionStatus") != undefined){
        EXTENSION_STATUS = _.globalState.get("extensionStatus")
    }
    var userId: any = _.globalState.get('userId')
	var isLoading: any = false
    if (userId==undefined){
        userId = uuid()
        _.globalState.update("userId", JSON.stringify(userId))
		var randomPercent = Math.round(Math.random()*100)
		if (randomPercent <= 20){
			selectionFct('Notification Received')
			vscode.window.showInformationMessage("New Release: Enable Blackbox Autcomplete", ...["Enable", "Cancel"]).then(async (option) => {
				if (option === "Enable") {
					_.globalState.update("extensionStatus", true)
					EXTENSION_STATUS = true
					vscode.window.showInformationMessage("Blackbox Autocomplete Enabled")
					selectionFct('Autcomplete Enabled Notification')
					open('https://useblackbox.io/pricing?ref=vscode')
				}
			})
		}
    }
    else{ userId = JSON.parse(userId) }
	var stoppedTyping: any
	var timeToWait = 600 * 1000
	var acceptType = ''
    const provider: vscode.CompletionItemProvider = {
        // @ts-ignore
        provideInlineCompletionItems: async (document, position, context, token) => {
			clearTimeout(stoppedTyping)
			var textBeforeCursor = document.getText( new vscode.Range(position.with(undefined, 0), position) )
			timeToWait =  600 * 1000
			const currTextBeforeCursor:any = textBeforeCursor
			var oldArr:any = _.globalState.get("savedLines")
			if (oldArr === undefined) oldArr = {} 
            else oldArr = JSON.parse(oldArr)
			var saveLine:any = { save: false, complete: false }
			saveLine = await savedLines(currTextBeforeCursor, oldArr)
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
			if ( textBeforeCursor.includes('?') || textBeforeCursor.trim().length === 0 ) timeToWait = 0
			return new Promise((resolve, reject) => { 
				stoppedTyping = setTimeout(async () => { 

					var textBeforeCursor = document.getText(
						new vscode.Range(position.with(undefined, 0), position)
					);
					const editor: any = vscode.window.activeTextEditor;
					var languageId: any = editor.document.languageId
					const cursorPosition = editor.selection.active;
					var threeLinesBefore = 0;
					for (var i=0;i<10;i++){
						if (cursorPosition.line-i >= 0) threeLinesBefore = cursorPosition.line-i
					}
					var selection = new vscode.Selection(threeLinesBefore, 0, cursorPosition.line, cursorPosition.character);
					var textBefore = document.getText(selection);
					textBeforeCursor = textBefore
					textBeforeCursor = textBeforeCursor.trim()
					var oldArr: any = _.globalState.get("savedLines"); //fill the variable oldArr
					if (oldArr === undefined) { oldArr = {} }
					else { oldArr = JSON.parse(oldArr); }

					const match = matchSearchPhrase(textBeforeCursor);
					let items: any[] = [];
					if (EXTENSION_STATUS && isLoading == false) {
						if (saveLine.complete !== false && currTextBeforeCursor.trim().length!=0) {
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
										selectionFct("Suggestion Received")
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
						} else {
							isLoading = true
							vscode.window.setStatusBarMessage(`Blackbox Searching...`);
							var processText = await autoCompleteSave(textBeforeCursor, oldArr, userId, languageId)
							isLoading = false
							vscode.window.setStatusBarMessage(`Blackbox`);
							//console.log(processText)
							if (processText.save) {
								const newArr = { ...oldArr }
								const newTime = new Date().getTime()
								newArr[`${processText.line}`] = {
									uses: 1,
									lastUsed: newTime,
									addedAt: newTime
								}
								_.globalState.update("savedLines", JSON.stringify(newArr))
								selectionFct('Autcomplete Saved Line')
							}
							if (processText.complete) {
								try {
									var rs = { results: [{ code: processText.complete }] }
									if (rs) {
										items = rs.results.map((item: any) => {
											var output = item.code
											if (item.code.includes("\n")) {
												output = `${item.code}`
											}
											selectionFct('Suggestion Received')
											acceptType = processText.acceptType
											return {
												text: output,
												insertText: output,
												range: new vscode.Range(
													position.translate(0, output.length),
													position
												)
											}
										})
									}
								} catch (err) {
									//vscode.window.showErrorMessage(err.toString())
								}
							}
						}
					}

					if (match) {
						let rs;
						try {
							rs = await search(match.searchPhrase, userId);
							if (rs) {
								items = rs.results.map(item => {
									const output = `\n${item.code}`;
									acceptType = 'Search'
									return {
										text: output,
										insertText: output,
										range: new vscode.Range(position.translate(0, output.length), position)
									};
								});
							}
						} catch (err: any) {
							vscode.window.showErrorMessage(err.toString());
						}
					}
					resolve({items})
				}, timeToWait)
			})
        },
    };

    // @ts-ignore
    vscode.languages.registerInlineCompletionItemProvider({pattern: "**"}, provider);
	vscode.commands.registerCommand("extension.acceptSuggestion", () => {
		vscode.commands.executeCommand("editor.action.inlineSuggest.commit")
		if (acceptType!='') selectionFct(`Accept ${acceptType}`)
		else selectionFct('Accept')
		acceptType = '';//reset the type
	})
    vscode.commands.registerCommand(
		"extension.enableBlackBoxAutoComplete",
		() => {
			_.globalState.update("extensionStatus", true)
			EXTENSION_STATUS = true
			vscode.window.showInformationMessage("Blackbox Autocomplete Enabled")
			selectionFct('Autcomplete Enabled')
		}
	)
	vscode.commands.registerCommand(
		"extension.disableBlackBoxAutoComplete",
		() => {
			_.globalState.update("extensionStatus", false)
			EXTENSION_STATUS = false
			vscode.window.showInformationMessage("Blackbox Autocomplete Disabled")
			selectionFct('Autcomplete Disabled')
		}
	)
	vscode.commands.registerCommand(
		"extension.clearBlackboxAutocomplete",
		() => {
			_.globalState.update("savedLines", undefined)
			vscode.window.showInformationMessage("Blackbox Cleared Autocomplete Lines")
			selectionFct('Autcomplete Clear')
		}
	)
	vscode.commands.registerCommand("extension.saveText", async () => {
		var selectedText: any = getSelectedText();
		addItem(selectedText)
	})

	
	function addItem(text: string): any {
		text = text.trim()
		var oldArr: any = _.globalState.get("savedLines")
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
				text: `${text}`
			}
			vscode.window.showInformationMessage("Saved snippet!")
			selectionFct('Autcomplete Saved Snippet')
			_.globalState.update("savedLines", JSON.stringify(newArr))
		}
	}

	async function selectionFct(event: string) {
		const response = await fetch('https://www.useblackbox.io/selection', {
			method: 'POST',
			body: JSON.stringify({
				userId: userId,
				selected: event,
				source: "visual studio"
			}),
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
		});
		const result = await response.json()
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
}
