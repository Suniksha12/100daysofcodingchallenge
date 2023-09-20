"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const arepl_backend_1 = require("arepl-backend");
const livecodeUtilities_1 = require("./livecodeUtilities");
const vscode = require("vscode");
const environmentVariablesProvider_1 = require("./env/variables/environmentVariablesProvider");
const environment_1 = require("./env/variables/environment");
const path_1 = require("path");
const previewContainer_1 = require("./previewContainer");
const telemetry_1 = require("./telemetry");
const toAREPLLogic_1 = require("./toAREPLLogic");
const python_shell_1 = require("python-shell");
const settings_1 = require("./settings");
const printDir_1 = require("./printDir");
const platformService_1 = require("./env/platform/platformService");
const pathUtils_1 = require("./env/platform/pathUtils");
const vscodeUtilities_1 = require("./vscodeUtilities");
const workspace_1 = require("./env/application/workspace");
/**
 * class with logic for starting livecode and livecode preview
 */
class PreviewManager {
    /**
     * assumes a text editor is already open - if not will error out
     */
    constructor(context) {
        this.subscriptions = [];
        this.runningStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.runningStatus.text = "Running python...";
        this.runningStatus.tooltip = "livecode is currently running your python file.  Close the livecode preview to stop";
        this.reporter = new telemetry_1.default(settings_1.settings().get("telemetry"));
        this.previewContainer = new previewContainer_1.PreviewContainer(this.reporter, context);
        this.highlightDecorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'yellow'
        });
    }
    loadAndWatchEnvVars() {
        return __awaiter(this, void 0, void 0, function* () {
            const platformService = new platformService_1.PlatformService();
            const envVarsService = new environment_1.EnvironmentVariablesService(new pathUtils_1.PathUtils(platformService.isWindows));
            const workspaceService = new workspace_1.WorkspaceService();
            const e = new environmentVariablesProvider_1.EnvironmentVariablesProvider(envVarsService, this.subscriptions, platformService, workspaceService, process);
            return e.getEnvironmentVariables(livecodeUtilities_1.default.getEnvFilePath(), vscodeUtilities_1.default.getCurrentWorkspaceFolderUri());
        });
    }
    startlivecode() {
        return __awaiter(this, void 0, void 0, function* () {
            // see https://github.com/Microsoft/vscode/issues/46445
            vscode.commands.executeCommand("setContext", "livecode", true);
            // reload reporter (its disposed when livecode is closed)
            this.reporter = new telemetry_1.default(settings_1.settings().get("telemetry"));
            if (!vscode.window.activeTextEditor) {
                vscode.window.showErrorMessage("no active text editor open");
                return;
            }
            this.pythonEditor = vscode.window.activeTextEditor;
            // var ranges = this.pythonEditor.visibleRanges
            // console.log(ranges)
            // var tt = new vscode.Range(100,0,101,0)
            // console.log(tt)
            // this.pythonEditor.revealRange(tt, 3)
            // vscode.onDidChangeTextEditorVisibleRanges()
            // needs window not editor, look at github example of use of event
            // this.subscriptions.push(
            // vscode.window.onDidChangeTextEditorVisibleRanges((event) => {
            //     console.log(event.textEditor.visibleRanges[0].start.line)
            // })
            // )
            this.pythonEditorDoc = this.pythonEditor.document;
            let panel = this.previewContainer.start(path_1.basename(this.pythonEditorDoc.fileName));
            panel.onDidDispose(() => this.dispose(), this, this.subscriptions);
            this.subscriptions.push(panel);
            this.startAndBindPython();
            if (this.pythonEditorDoc.isUntitled && this.pythonEditorDoc.getText() == "") {
                yield livecodeUtilities_1.default.insertDefaultImports(this.pythonEditor);
                // waiting for this to complete so i dont accidentily trigger
                // the edit doc handler when i insert imports
            }
            this.subscribeHandlersToDoc();
            // function resolveAfter2Seconds() {
            //     return new Promise(resolve => {
            //       setTimeout(() => {
            //         resolve('resolved');
            //       }, 2000);
            //     });
            //   }
            //   async function asyncCall() {
            //     const result = await resolveAfter2Seconds();
            // async function littleadd(){
            //     this.pythonEditor.edit((builder) => {
            //         builder.insert(new vscode.Position(0,0 ), "    ");
            //     });
            //     return;
            // }
            // littleadd();
            var lc = this.pythonEditorDoc.lineCount;
            var lastline_text = this.pythonEditorDoc.lineAt(lc - 1);
            var lastline_end = lastline_text.text.length;
            if (lc > 1 || lastline_end > 0) {
                this.pythonEditor.edit((builder) => {
                    builder.insert(new vscode.Position(lc - 1, lastline_end), "\n");
                });
                //             this.pythonEditor.edit((remover) => {
                //     // builder.delete(new vscode.Range(new vscode.Position(lc -1 ,lastline_end - 1 ), new vscode.Position(lc -1 ,lastline_end + 1 )));
                //     // builder.delete(new vscode.Range(new vscode.Position(78 ,0 ), new vscode.Position(79, 0 )));
                //     var nrange = new vscode.Range( 78,0,78,2)
                //     console.log(nrange)
                //     remover.delete(nrange);
                // });
            }
            // //   }
            // // asyncCall()
            // const secondFunction = async () => {
            //     await littleadd()
            //     // do something else here after firstFunction completes
            //     this.pythonEditor.edit((builder) => {
            //         builder.delete(new vscode.Range(new vscode.Position(0,0 ), new vscode.Position(0,1 )));
            //     });
            //   }
            // secondFunction();
            // this.pythonEditor.edit((builder) => {
            //     builder.delete(new vscode.Range(new vscode.Position(0,0 ), new vscode.Position(0,0 )));
            // });
            return panel;
        });
    }
    runlivecode() {
        this.onAnyDocChange(this.pythonEditorDoc);
    }
    /**
     * adds print() or print(dir()) if line ends in .
     * ex: x=1; print(x)
     * Then runs it
     */
    printDir() {
        if (this.pythonEditor != vscode.window.activeTextEditor)
            return;
        const selection = this.pythonEditor.selection;
        if (!selection.isSingleLine)
            return;
        let codeLines = this.pythonEditor.document.getText();
        let codeLinesArr = printDir_1.default(codeLines.split(vscodeUtilities_1.default.eol(this.pythonEditor.document)), selection.start.line);
        // todo: how to connect this with onAnyDocChange?
    }
    runlivecodeBlock() {
        const editor = vscode.window.activeTextEditor;
        const selection = editor.selection;
        let block = null;
        if (selection.isEmpty) { // just a cursor
            block = vscodeUtilities_1.default.getBlockOfText(editor, selection.start.line);
        }
        else {
            block = new vscode.Range(selection.start, selection.end);
        }
        let codeLines = editor.document.getText(block);
        // hack: we want accurate line # info
        // so we prepend lines to put codeLines in right spot
        codeLines = vscodeUtilities_1.default.eol(editor.document).repeat(block.start.line) + codeLines;
        const filePath = editor.document.isUntitled ? "" : editor.document.fileName;
        const settingsCached = settings_1.settings();
        const data = {
            evalCode: codeLines,
            filePath,
            savedCode: '',
            usePreviousVariables: true,
            showGlobalVars: settingsCached.get('showGlobalVars'),
            default_filter_vars: settingsCached.get('defaultFilterVars'),
            default_filter_types: settingsCached.get('defaultFilterTypes')
        };
        this.PythonEvaluator.execCode(data);
        this.runningStatus.show();
        if (editor) {
            editor.setDecorations(this.highlightDecorationType, [block]);
        }
        setTimeout(() => {
            // clear decorations
            editor.setDecorations(this.highlightDecorationType, []);
        }, 100);
    }
    dispose() {
        vscode.commands.executeCommand("setContext", "livecode", false);
        if (this.PythonEvaluator.pyshell != null && this.PythonEvaluator.pyshell.childProcess != null) {
            this.PythonEvaluator.stop();
        }
        this.disposable = vscode.Disposable.from(...this.subscriptions);
        this.disposable.dispose();
        this.runningStatus.dispose();
        this.reporter.sendFinishedEvent(settings_1.settings());
        this.reporter.dispose();
        if (vscode.window.activeTextEditor) {
            vscode.window.activeTextEditor.setDecorations(this.previewContainer.errorDecorationType, []);
        }
    }
    /**
     * show err message to user if outdated version of python
     */
    warnIfOutdatedPythonVersion(pythonPath) {
        python_shell_1.PythonShell.getVersion(`"${pythonPath}"`).then((out) => {
            var _a, _b;
            let version = out.stdout ? out.stdout : out.stderr;
            if (((_a = version) === null || _a === void 0 ? void 0 : _a.includes("Python 3.4")) || ((_b = version) === null || _b === void 0 ? void 0 : _b.includes("Python 2"))) {
                vscode.window.showErrorMessage(`livecode does not support ${version}.
                Please upgrade or set livecode.pythonPath to a diffent python.
                livecode needs python 3.5 or greater`);
            }
            if (version) {
                this.reporter.pythonVersion = version.trim();
            }
        }).catch((err) => {
            // if we get spawn error here thats already reported by telemetry
            // so we skip telemetry reporting for this error
            console.error(err);
            if (err.message.includes("Python was not found but can be installed from the Microsoft Store")) {
                vscode.window.showErrorMessage(err.message);
            }
        });
    }
    change_line_view() {
        var curline = vscode.window.activeTextEditor.visibleRanges[0].start.line;
        var curwebview = this.previewContainer.pythonPanelPreview.panel.webview;
        curwebview.postMessage({ line: curline });
    }
    /**
     * starts livecode python backend and binds print&result output to the handlers
     */
    startAndBindPython() {
        return __awaiter(this, void 0, void 0, function* () {
            const pythonPath = livecodeUtilities_1.default.getPythonPath();
            const pythonOptions = settings_1.settings().get("pythonOptions");
            this.warnIfOutdatedPythonVersion(pythonPath);
            // basically all this does is load a file.. why does it need to be async *sob*
            const env = yield this.loadAndWatchEnvVars();
            this.PythonEvaluator = new arepl_backend_1.PythonEvaluator({
                pythonOptions,
                pythonPath,
                env,
            });
            try {
                this.PythonEvaluator.start();
            }
            catch (err) {
                if (err instanceof Error) {
                    const error = `Error running python with command: ${pythonPath} ${pythonOptions.join(' ')}\n${err.stack}`;
                    this.previewContainer.displayProcessError(error);
                    // @ts-ignore 
                    this.reporter.sendError(err, error.errno, 'spawn');
                }
                else {
                    console.error(err);
                }
            }
            this.PythonEvaluator.pyshell.childProcess.on("error", (err) => {
                /* The 'error' event is emitted whenever:
                The process could not be spawned, or
                The process could not be killed, or
                Sending a message to the child process failed.
                */
                // @ts-ignore err is actually SystemError but node does not type it
                const error = `Error running python with command: ${err.path} ${err.spawnargs.join(' ')}\n${err.stack}`;
                this.previewContainer.displayProcessError(error);
                this.reporter.sendError(err, err.errno, 'spawn');
            });
            this.PythonEvaluator.pyshell.childProcess.on("exit", err => {
                if (!err)
                    return; // normal exit
                this.previewContainer.displayProcessError(`err code: ${err}`);
                this.reporter.sendError(new Error('exit'), err, 'spawn');
            });
            this.tolivecodeLogic = new toAREPLLogic_1.ToAREPLLogic(this.PythonEvaluator, this.previewContainer);
            // binding this to the class so it doesn't get overwritten by PythonEvaluator
            this.PythonEvaluator.onPrint = this.previewContainer.handlePrint.bind(this.previewContainer);
            // this is bad - stderr should be handled seperately so user is aware its different
            // but better than not showing stderr at all, so for now printing it out and ill fix later
            this.PythonEvaluator.onStderr = this.previewContainer.handlePrint.bind(this.previewContainer);
            this.PythonEvaluator.onResult = result => {
                this.runningStatus.hide();
                this.previewContainer.handleResult(result);
            };
        });
    }
    /**
     * binds various funcs to activate upon edit of document / switching of active doc / etc...
     */
    subscribeHandlersToDoc() {
        if (settings_1.settings().get("skipLandingPage")) {
            this.onAnyDocChange(this.pythonEditorDoc);
        }
        vscode.workspace.onDidSaveTextDocument((e) => {
            if (settings_1.settings().get("whenToExecute") == "onSave") {
                this.onAnyDocChange(e);
            }
        }, this, this.subscriptions);
        vscode.workspace.onDidChangeTextDocument((e) => {
            const cachedSettings = settings_1.settings();
            if (cachedSettings.get("whenToExecute") == "afterDelay") {
                let delay = cachedSettings.get("delay");
                const restartExtraDelay = cachedSettings.get("restartDelay");
                delay += this.tolivecodeLogic.restartMode ? restartExtraDelay : 0;
                this.PythonEvaluator.debounce(this.onAnyDocChange.bind(this, e.document), delay);
            }
        }, this, this.subscriptions);
        vscode.window.onDidChangeTextEditorVisibleRanges((event) => {
            this.change_line_view();
        }, this, this.subscriptions);
        vscode.workspace.onDidCloseTextDocument((e) => {
            if (e == this.pythonEditorDoc)
                this.dispose();
        }, this, this.subscriptions);
    }
    onAnyDocChange(event) {
        if (event == this.pythonEditorDoc) {
            this.reporter.numRuns += 1;
            if (this.PythonEvaluator.executing) {
                this.reporter.numInterruptedRuns += 1;
            }
            const text = event.getText();
            let filePath = "";
            if (this.pythonEditorDoc.isUntitled) {
                /* user would assume untitled file is in same dir as workspace root */
                filePath = path_1.join(vscodeUtilities_1.default.getCurrentWorkspaceFolder(false), this.pythonEditorDoc.fileName);
            }
            else {
                filePath = this.pythonEditorDoc.fileName;
            }
            try {
                var curline = this.pythonEditor.visibleRanges[0].start.line;
                this.previewContainer.pythonPanelPreview.startrange = curline;
                const codeRan = this.tolivecodeLogic.onUserInput(text, filePath, vscodeUtilities_1.default.eol(event), settings_1.settings().get('showGlobalVars'));
                if (codeRan) {
                    this.runningStatus.show();
                }
            }
            catch (error) {
                if (error instanceof Error) {
                    if (error.message == "unsafeKeyword") {
                        const unsafeKeywords = settings_1.settings().get('unsafeKeywords');
                        this.previewContainer.updateError(null, `unsafe keyword detected. 
Doing irreversible operations like deleting folders is very dangerous in a live editor. 
If you want to continue please clear livecode.unsafeKeywords setting. 
Currently livecode.unsafeKeywords is set to ["${unsafeKeywords.join('", "')}"]`, true);
                        return;
                    }
                    else {
                        console.error(error);
                        this.reporter.sendError(error);
                        this.previewContainer.updateError(null, `internal livecode error: ${error.name} stack: ${error.stack}`, true);
                    }
                }
                throw error;
            }
        }
    }
}
exports.default = PreviewManager;
//# sourceMappingURL=PreviewManager.js.map