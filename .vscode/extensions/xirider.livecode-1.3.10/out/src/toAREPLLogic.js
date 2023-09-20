"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pyGuiLibraryIsPresent_1 = require("./pyGuiLibraryIsPresent");
const settings_1 = require("./settings");
/**
 * formats text for passing into AREPL backend
 * Along the way decides whether backend needs restarting
 */
class ToAREPLLogic {
    constructor(PythonEvaluator, previewContainer) {
        this.PythonEvaluator = PythonEvaluator;
        this.previewContainer = previewContainer;
        this.restartedLastTime = false;
        this.lastSavedSection = "";
        this.lastCodeSection = "";
        this.lastEndSection = "";
    }
    scanForUnsafeKeywords(text, unsafeKeywords = []) {
        const commentChar = "#";
        // user may try to clear setting just by deleting word
        // in that case make sure its cleared correctly
        if (unsafeKeywords.length == 1 && unsafeKeywords[0].trim() == '')
            unsafeKeywords = [];
        if (unsafeKeywords.length == 0)
            return false;
        const unsafeKeywordsRe = new RegExp(`^[^${commentChar}]*${unsafeKeywords.join('|')}`);
        return unsafeKeywordsRe.test(text);
    }
    onUserInput(text, filePath, eol, showGlobalVars = true) {
        const settingsCached = settings_1.settings();
        let codeLines = text.split(eol);
        let savedLines = [];
        let startLineNum = 0;
        let endLineNum = codeLines.length;
        codeLines.forEach((line, i) => {
            if (line.trimRight().endsWith("#$save")) {
                savedLines = codeLines.slice(0, i + 1);
                startLineNum = i + 1;
            }
            if (line.trimRight().endsWith("#$end")) {
                endLineNum = i + 1;
                return;
            }
        });
        const endSection = codeLines.slice(endLineNum).join(eol);
        codeLines = codeLines.slice(startLineNum, endLineNum);
        const unsafeKeywords = settingsCached.get('unsafeKeywords');
        const realTime = settingsCached.get("whenToExecute") == "afterDelay";
        // if not real-time we trust user to only run safe code
        if (realTime && this.scanForUnsafeKeywords(codeLines.join(eol), unsafeKeywords)) {
            throw Error("unsafeKeyword");
        }
        const data = {
            evalCode: codeLines.join(eol),
            filePath,
            savedCode: savedLines.join(eol),
            usePreviousVariables: settingsCached.get('keepPreviousVars'),
            showGlobalVars,
            default_filter_vars: settingsCached.get('defaultFilterVars'),
            default_filter_types: settingsCached.get('defaultFilterTypes')
        };
        // user should be able to rerun code without changing anything
        // only scenario where we dont re-run is if just end section is changed
        if (endSection != this.lastEndSection && data.savedCode == this.lastSavedSection && data.evalCode == this.lastCodeSection) {
            return false;
        }
        this.lastCodeSection = data.evalCode;
        this.lastSavedSection = data.savedCode;
        this.lastEndSection = endSection;
        this.restartMode = pyGuiLibraryIsPresent_1.default(text);
        if (this.restartMode) {
            this.checkSyntaxAndRestart(data);
        }
        else if (this.restartedLastTime) { // if GUI code is gone need one last restart to get rid of GUI
            this.restartPython(data);
            this.restartedLastTime = false;
        }
        else {
            this.PythonEvaluator.execCode(data);
        }
        return true;
    }
    /**
     * checks syntax before restarting - if syntax error it doesnt bother restarting but instead just shows syntax error
     * This is useful because we want to restart as little as possible
     */
    checkSyntaxAndRestart(data) {
        let syntaxPromise;
        // #22 it might be faster to use checkSyntaxFile but this is simpler
        syntaxPromise = this.PythonEvaluator.checkSyntax(data.savedCode + data.evalCode);
        syntaxPromise.then(() => {
            this.restartPython(data);
            this.restartedLastTime = true;
        })
            .catch((error) => {
            // an ErrnoException is a bad internal error
            let internalErr = "";
            if (typeof (error) != "string") {
                internalErr = error.message + '\n\n' + error.stack;
                error = "";
            }
            // todo: refactor above to call arepl to check syntax so we get a actual error object back instead of error text
            this.previewContainer.handleResult({
                userVariables: {}, userError: null, userErrorMsg: error, execTime: 0, totalPyTime: 0, totalTime: 0,
                internalError: internalErr, caller: "", lineno: -1, done: true,
            });
        });
    }
    restartPython(data) {
        this.previewContainer.clearStoredData();
        this.PythonEvaluator.restart(this.PythonEvaluator.execCode.bind(this.PythonEvaluator, data));
    }
}
exports.ToAREPLLogic = ToAREPLLogic;
//# sourceMappingURL=toAREPLLogic.js.map