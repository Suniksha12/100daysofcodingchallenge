"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.autoCompleteSave = void 0
exports.savedLines = void 0

const config_1 = require("../config")
const vscode_1 = require("vscode")
const node_fetch_1 = require("node-fetch")
/**
 *
 * @param {string} input
 * @returns {SearchMatchResult | undefined}
 */
var checkTime
var lastSentence = ""

async function autoCompleteSave(text, obj, userId, languageId, premium_status, context) {
	const promise = new Promise(async (resolve, reject) => {
		if (text.length) {
			var addToStorage = false
			var acceptType = ''
			clearInterval(checkTime)

			var count = 0
			var sentence = ""
			for (const k in obj) {
				var lastLine = text
				if (text.includes('\n')) lastLine = text.split('\n')[text.split('\n').length-1].trim()
				if (k.startsWith(lastLine)) {
					if (count === 0) {
						count = obj[k].uses
						// sentence = k
					} else {
						if (obj[k].uses > count) {
							count = obj[k].uses
							// sentence = k
						}
					}
				}
			}
			if (sentence) {
				text = lastLine
				acceptType = 'Saved Line Or Snippet'
			}
			var lastLine = text
			if (text.includes('\n')) lastLine = text.split('\n')[text.split('\n').length-1].trim()
			if (text.length>10){
				var result = {'response': ''}
				if (premium_status){
					// text = formattingContext(text, context)
					let url_request = ''
					try{
						const response = await (0, node_fetch_1.default)('https://www.useblackbox.io/suggestv2', {
							method: 'POST',
							body: JSON.stringify({
								inputCode: text,
								source: "visual studio",
								userId: userId,
								languageId: languageId,
								when: Date.now()/1000.0,
								premium: premium_status
							}),
							headers: {
								'Content-Type': 'application/json',
								Accept: 'application/json',
							},
						});
						result = await response.json();
						try{
							sentence = result['response']
							sentence = sentence.trim();
							acceptType = 'Code Complete'
						}catch(e){}
					}catch(e){}
				}else{
					// text = formattingContext(text, context)
					let url_request = ''
					try{
						const response = await (0, node_fetch_1.default)('https://www.useblackbox.io/suggestv2', {
							method: 'POST',
							body: JSON.stringify({
								inputCode: text,
								source: "visual studio",
								userId: userId,
								languageId: languageId,
								when: Date.now()/1000.0,
								premium: premium_status
							}),
							headers: {
								'Content-Type': 'application/json',
								Accept: 'application/json',
							},
						});
						result = await response.json();
						try{
							sentence = result['response']
							sentence = sentence.trim();
							acceptType = 'Code Complete'
						}catch(e){}
					}catch(e){}
				}
			}
			lastSentence = text
			if (sentence) {
				resolve({
					complete: sentence,
					save: false,
					acceptType: acceptType,
					line: lastLine
				})
			} else {
				resolve({
					complete: false,
					save: false,
					acceptType: ''
				})
			}
		} else {
			addToStorage = false
			if (obj[lastSentence] === undefined) {
				addToStorage = true
			}
			resolve({
				complete: false,
				save: false,
				line: lastSentence,
				acceptType: ''
			})
		}
	})
	return promise
}
async function savedLines(text, obj) {
	const promise = new Promise(async (resolve, reject) => {
		text = text.trim()
		if (text.length > 10) {
			lastSentence = text
			var sentence = ""
			var count = 0

			for (const k in obj) {
				var lastLine = text
				if (text.includes("\n"))
					lastLine = text
						.split("\n")
						[text.split("\n").length - 1].trim()
				if (k.startsWith(lastLine)) {
					if (count === 0) {
						count = obj[k].uses
						sentence = k
					} else {
						if (obj[k].uses > count) {
							count = obj[k].uses
							sentence = k
						}
					}
				}
			}

			if (sentence.length) {
				resolve({
					complete: sentence.slice(text.length, sentence.length),
					save: false
				})
			} else {
				resolve({
					complete: false,
					save: false
				})
			}
		} else {
			var addToStorage = false
			if (
				obj[lastSentence] === undefined &&
				lastSentence.trim().length > 0
			) {
				addToStorage = true
			}
			resolve({
				complete: false,
				save: addToStorage,
				line: lastSentence
			})
		}
	})
	return promise
}
function keepOneLine(response){
    //find index of not \n character
    let non_linebreak_index = 0
    for (let i=0;i<response.length;i++){
        if (/\s/.test(response[i]) == false){
            non_linebreak_index = i
            break
        }
    }
    let end_index = response.indexOf('\n', non_linebreak_index)
    let first_actual_line = ''
    if (end_index == -1){
        first_actual_line = response
    }else{
        first_actual_line = response.slice(0, end_index)
    }
	first_actual_line = filterOutput(first_actual_line)
    return first_actual_line
}


function formattingContext(text, context){
	if (context.length == 2){
		if (context[1] != ''){
			text = `<fim_prefix>${context[0]}<fim_suffix>${context[1]}<fim_middle>`
		}
	}
	return text
}

function filterOutput(response){
	if (response == '<|endoftext|>'){
		response = ''
	}else if (response.includes('<|endoftext|>')){
		response = response.replace('<|endoftext|>', '')
	}
	return response
}
exports.autoCompleteSave = autoCompleteSave
exports.savedLines = savedLines