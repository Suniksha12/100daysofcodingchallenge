'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const PreviewManager_1 = require("./PreviewManager");
const vscodeUtilities_1 = require("./vscodeUtilities");
let previewManager = null;
function activate(context) {
    previewManager = new PreviewManager_1.default(context);
    // Register the commands that are provided to the user
    const livecode = vscode.commands.registerCommand("extension.currentlivecodeSession", () => {
        previewManager.startlivecode();
    });
    const newlivecodeSession = vscode.commands.registerCommand("extension.newlivecodeSession", () => {
        vscodeUtilities_1.default.newUnsavedPythonDoc(vscodeUtilities_1.default.getHighlightedText())
            .then(() => { previewManager.startlivecode(); });
    });
    const closelivecode = vscode.commands.registerCommand("extension.closelivecode", () => {
        previewManager.dispose();
    });
    // exact same as above, just defining command so users are aware of the feature
    const livecodeOnHighlightedCode = vscode.commands.registerCommand("extension.newlivecodeSessionOnHighlightedCode", () => {
        vscodeUtilities_1.default.newUnsavedPythonDoc(vscodeUtilities_1.default.getHighlightedText())
            .then(() => { previewManager.startlivecode(); });
    });
    const executelivecode = vscode.commands.registerCommand("extension.executelivecode", () => {
        previewManager.runlivecode();
    });
    const executelivecodeBlock = vscode.commands.registerCommand("extension.executelivecodeBlock", () => {
        previewManager.runlivecodeBlock();
    });
    const printDir = vscode.commands.registerCommand("extension.printDir", () => {
        previewManager.printDir();
    });
    // push to subscriptions list so that they are disposed automatically
    context.subscriptions.push(...[
        livecode,
        newlivecodeSession,
        closelivecode,
        livecodeOnHighlightedCode,
        executelivecode,
        executelivecodeBlock,
        printDir
    ]);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map