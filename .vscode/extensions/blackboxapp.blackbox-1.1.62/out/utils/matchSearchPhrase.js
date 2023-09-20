"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchSearchPhrase = void 0;
const config_1 = require("../config");
const vscode_1 = require("vscode");
/**
 * Match the giving string with search pattern
 * @param {string} input
 * @returns {SearchMatchResult | undefined} if found, return the search phrase, comment's opening and closing syntax
 */
function matchSearchPhrase(input) {
    const match = config_1.default.SEARCH_PATTERN.exec(input);
    // const match = [{
    //     commentSyntax: "//",
    //     commentSyntaxEnd: "?",
    //     searchPhrase: "how to connect to mongodb in nodejs"
    // }, {
    //     commentSyntax: "//",
    //     commentSyntaxEnd: "?",
    //     searchPhrase: "how to connect to mongodb in nodejs"
    // }, {
    //     commentSyntax: "//",
    //     commentSyntaxEnd: "?",
    //     searchPhrase: "how to connect to mongodb in nodejs"
    // }]
    // console.log('Math: ', match)
    if (match && match.length > 2) {
        const [_, commentSyntax, searchPhrase, commentSyntaxEnd] = match;
        // @ts-ignore
        let fileType = vscode_1.window.activeTextEditor.document.languageId;
        if (fileType === "plaintext") {
            fileType = "";
        }
        return {
            commentSyntax,
            commentSyntaxEnd,
            searchPhrase: `${searchPhrase} ${fileType}`
        };
    }
    return undefined;
}
exports.matchSearchPhrase = matchSearchPhrase;
