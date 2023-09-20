"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const utilities_1 = require("./utilities");
/**
 * shows error icons
 */
class PythonInlinePreview {
    constructor(reporter, context) {
        this.reporter = reporter;
        this.errorDecorationType = vscode.window.createTextEditorDecorationType({
            gutterIconPath: context.asAbsolutePath('media/red.jpg'),
        });
    }
    /**
     * Safe - catches and logs any exceptions
     */
    showInlineErrors(error, userErrorMsg) {
        try {
            if (userErrorMsg.includes("AREPL has ran into an error")) {
                // this.showInternalError(userErrorMsg)
                // return
            }
            const decorations = this.convertErrorToDecorationOptions(error);
            if (vscode.window.activeTextEditor) {
                vscode.window.activeTextEditor.setDecorations(
                // <string> indicates the main arepl file
                this.errorDecorationType, decorations["<string>"]);
            }
        }
        catch (internalError) {
            if (internalError instanceof Error) {
                this.reporter.sendError(internalError);
            }
            else {
                this.reporter.sendError(new Error(internalError));
            }
        }
    }
    showInternalError(internalError) {
        throw Error('not implemented');
    }
    convertFrameToDecorationOption(frame) {
        const lineNum = frame.lineno - 1; // python trace uses 1-based indexing but vscode lines start at 0
        // todo: pull endCharNum from relevant line from file
        // remember that the file might not be the active doc...
        const endCharNum = 0;
        const range = new vscode.Range(lineNum, 0, lineNum, endCharNum);
        // temporarily skip error text untill above todo is fixed
        // _str might be empty if user raised an error while leaving message empty
        //const text = error._str ? error._str : error.exc_type["py/type"]
        const text = "";
        return {
            range,
            renderOptions: {
                after: {
                    contentText: text
                }
            }
        };
    }
    /**
     * converts error to dictionary of error decorations indexed by filename
     */
    convertErrorToDecorationOptions(error) {
        const decorations = new utilities_1.DefaultDict(Array);
        if (utilities_1.default.isEmpty(error))
            return { '<string>': [] };
        const flattenedErrors = utilities_1.default.flattenNestedObjectWithMultipleKeys(error, ["__context__", "__cause__"]);
        flattenedErrors.forEach(error => {
            error.stack["py/seq"].forEach(frame => {
                decorations[frame.filename].push(this.convertFrameToDecorationOption(frame));
            });
        });
        // @ts-ignore no idea how to type defaultdict properly
        return decorations;
    }
}
exports.default = PythonInlinePreview;
//# sourceMappingURL=pythonInlinePreview.js.map