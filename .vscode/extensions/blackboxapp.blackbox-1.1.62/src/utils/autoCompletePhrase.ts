import fetch from 'node-fetch';
var lastSentence = ""

export async function autoCompleteSave(text: string, obj: any, userId: any, languageId: any): Promise<{complete: any, save: any, line: any, acceptType: any}> {
	const promise = new Promise<{complete: any, save: any, line: any, acceptType: any }>(async (resolve, reject) => {
		if (text.length) {
			var addToStorage = false
			var acceptType = ''

			var count = 0
			var sentence = ""
			for (const k in obj) {
				var lastLine: any = text
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
			var lastLine: any = text
			if (text.includes('\n')) lastLine = text.split('\n')[text.split('\n').length-1].trim()
			if (lastLine.includes('?')==false && text.length>10){
				var result = {'response': ''}
				try{
					const response = await fetch('https://useblackbox.io/suggest', {
						method: 'POST',
						body: JSON.stringify({
							inputCode: text,
							source: "visual studio",
							userId: userId,
							languageId: languageId
						}),
						headers: {
							'Content-Type': 'application/json',
							Accept: 'application/json',
						},
					});
					result = await response.json()
				}catch(e){}
				lastLine = text.split('\n')[text.split('\n').length-1].trim()
				addToStorage = true
				try{
					sentence = result['response']
					sentence = sentence.trim();
					acceptType = 'Code Complete'
				}catch(e){}
			}
			lastSentence = text
			if (sentence) {
				resolve({
					complete: sentence,
					save: false,
					line: lastLine,
					acceptType: acceptType
				})
			} else {
				resolve({
					complete: false,
					save: false,
					line: "",
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
	return promise;
}
export async function savedLines(text: string, obj: any): Promise<{complete: any, save: any, line: any, acceptType: any}> {
	const promise = new Promise<{complete: any, save: any, line: any, acceptType: any }>(async (resolve, reject) => {
		text = text.trim()
		if (text.length) {
			lastSentence = text
			var count = 0
			var sentence = ""

			for (const k in obj) {
				var lastLine: any = text
				if (text.includes('\n')) lastLine = text.split('\n')[text.split('\n').length-1].trim()
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
					save: false,
					line: '',
					acceptType: ''
				})
			} else {
				resolve({
					complete: false,
					save: false,
					line: '',
					acceptType: ''
				})
			}
		} else {
			var addToStorage:any = false
			if (obj[lastSentence] === undefined && lastSentence.trim().length > 0) {
				addToStorage = true
			}
			resolve({
				complete: false,
				save: addToStorage,
				line: lastSentence,
				acceptType: ''
			})
		}
	})
	return promise;
}