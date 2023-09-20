"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.search = void 0;
const vscode = require("vscode");
const config_1 = require("../config");
const node_fetch_1 = require("node-fetch");
/**
 * Cache results to avoid VSCode keep refetching
 */
async function search(keyword, userId) {
    // console.log('>> Search input: ', keyword)
    const config = (0, config_1.getConfig)();
    /* eslint "no-async-promise-executor": "off" */
    const promise = new Promise(async (resolve, reject) => {
        let results = [];
        let fetchResult;
        try {
            results = [{
                    code: [],
                    hasCheckMark: false,
                    sourceURL: "",
                    votes: 0,
					result: [],
					query: keyword
                }];
            resolve({ results });
        }
        catch (err) {
            reject(err);
        }
        // When promise resolved, show finished loading for 5 seconds
        vscode.window.setStatusBarMessage(`Blackbox`);
    });
    vscode.window.setStatusBarMessage(`Blackbox Searching...`, promise);
    return promise;
}
function returnCommentSymbol(language = "javascript") {
	const languageObject = {
		bat: "@REM",
		c: "//",
		csharp: "//",
		cpp: "//",
		closure: ";;",
		coffeescript: "#",
		dockercompose: "#",
		css: "/*DELIMITER*/",
		"cuda-cpp": "//",
		dart: "//",
		diff: "#",
		dockerfile: "#",
		fsharp: "//",
		"git-commit": "//",
		"git-rebase": "#",
		go: "//",
		groovy: "//",
		handlebars: "{{!--DELIMITER--}}",
		hlsl: "//",
		html: "<!--DELIMITER-->",
		ignore: "#",
		ini: ";",
		java: "//",
		javascript: "//",
		javascriptreact: "//",
		json: "//",
		jsonc: "//",
		julia: "#",
		latex: "%",
		less: "//",
		lua: "--",
		makefile: "#",
		markdown: "<!--DELIMITER-->",
		"objective-c": "//",
		"objective-cpp": "//",
		perl: "#",
		perl6: "#",
		php: "<!--DELIMITER-->",
		powershell: "#",
		properties: ";",
		jade: "//-",
		python: "#",
		r: "#",
		razor: "<!--DELIMITER-->",
		restructuredtext: "..",
		ruby: "#",
		rust: "//",
		scss: "//",
		shaderlab: "//",
		shellscript: "#",
		sql: "--",
		svg: "<!--DELIMITER-->",
		swift: "//",
		tex: "%",
		typescript: "//",
		typescriptreact: "//",
		vb: "'",
		xml: "<!--DELIMITER-->",
		xsl: "<!--DELIMITER-->",
		yaml: "#"
	}
	return languageObject[language]
}
exports.search = search;
