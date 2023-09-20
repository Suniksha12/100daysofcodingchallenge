"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const throttle_1 = require("./throttle");
const utilities_1 = require("./utilities");
const settings_1 = require("./settings");
/**
 * shows AREPL output (variables, errors, timing, and stdout/stderr)
 * https://code.visualstudio.com/docs/extensions/webview
 */
class PythonPanelPreview {
    constructor(context, htmlUpdateFrequency = 50) {
        this.context = context;
        this.lastTime = 999999999;
        this.landingPage = `<br>
    <p style="font-size:14px">Start typing or make a change and your code will be evaluated.</p>
    
    <p style="font-size:14px">⚠ <b style="color:red">WARNING:</b> code is evaluated WHILE YOU TYPE - don't try deleting files/folders! ⚠</p>
    <p>evaluation while you type can be turned off or adjusted in the settings</p>
    <br>
    
    <h3>Examples</h3>
    
<h4>Simple List</h4>
<code style="white-space:pre-wrap">
x = [1,2,3]
y = [num*2 for num in x]
print(y)
</code>

<h4>Web call</h4>
<code style="white-space:pre-wrap">
import requests
import datetime as dt

r = requests.get("https://api.github.com")

#$save
# #$save saves state so request is not re-executed when modifying below

now = dt.datetime.now()
if r.status_code == 200:
    print("API up at " + str(now))

</code>`;
        this.errorContainer = "";
        this.jsonRendererCode = `<script></script>`;
        this.emptyPrint = `<br><h3>Print Output:</h3><div id="print"></div>`;
        this.printContainer = this.emptyPrint;
        this.timeContainer = "";
        this.startrange = 0;
        this.customCSS = "";
        this._onDidChange = new vscode.EventEmitter();
        this.css = `<link rel="stylesheet" type="text/css" href="${this.getMediaPath("pythonPanelPreview.css")}">`;
        this.jsonRendererScript = `<script src="${this.getMediaPath("jsonRenderer.js")}"></script>`;
        if (htmlUpdateFrequency != 0) {
            // refreshing html too much can freeze vscode... lets avoid that
            const l = new throttle_1.Limit();
            this.throttledUpdate = l.throttledUpdate(this.updateContent, htmlUpdateFrequency);
        }
        else
            this.throttledUpdate = this.updateContent;
    }
    start(linkedFileName) {
        this.panel = vscode.window.createWebviewPanel("livecode", "LiveCode - " + linkedFileName, vscode.ViewColumn.Two, {
            enableScripts: true
        });
        // this.startContent();
        this.panel.webview.html = this.landingPage;
        return this.panel;
    }
    updateVars(vars) {
        let userVarsCode = `userVars = ${JSON.stringify(vars)};`;
        // escape end script tag or else the content will escape its container and WREAK HAVOC
        userVarsCode = userVarsCode.replace(/<\/script>/g, "<\\/script>");
        // this.jsonRendererCode = `<script>
        //     window.onload = function(){
        //         ${userVarsCode}
        //         let jsonRenderer = renderjson.set_icons('+', '-') // default icons look a bit wierd, overriding
        //             .set_show_to_level(${settings().get("show_to_level")}) 
        //             .set_max_string_length(${settings().get("max_string_length")});
        //         document.getElementById("results").appendChild(jsonRenderer(userVars));
        //         var cuthere_sdhakdjenamsjdalskxnlyndkja = 0; 
        //         var current_scroll_level = 0; 
        //         var cuthere_sdhakdjenamsjdalskxnlyndkja = 0; 
        //         this.scrollTo(0, current_scroll_level);
        //     }
        //     </script>`
        this.jsonRendererCode = `<script>
            window.onload = function(){
                this.scrollTo(0, 19 * ${this.startrange});
                ${userVarsCode}
                let jsonRenderer = renderjson.set_icons('+', '-') // default icons look a bit wierd, overriding
                    .set_show_to_level(${settings_1.settings().get("show_to_level")}) 
                    .set_max_string_length(${settings_1.settings().get("max_string_length")});
                document.getElementById("results").appendChild(jsonRenderer(userVars));
                
                var setscroll = ${this.startrange}
                // if (setscroll > 0) {
                //     setscroll -= 1
                // }
                this.scrollTo(0, 19 * setscroll);
                this.addEventListener("message", event => {

                    var scrolllevel = event.data.line
                    // if (scrolllevel > 0) {
                    //     scrolllevel -= 1
                    // }
                    this.scrollTo(0, 19 * scrolllevel);
                })


            }
            </script>`;
    }
    // this.scroll(1000, 1000);
    updateTime(time) {
        let color;
        time = Math.floor(time); // we dont care about anything smaller than ms
        if (time > this.lastTime)
            color = "red";
        else
            color = "green";
        this.lastTime = time;
        this.timeContainer = `<p style="position:fixed;left:93%;top:96%;color:${color};">${time} ms</p>`;
    }
    /**
     * @param refresh if true updates page immediately.  otherwise error will show up whenever updateContent is called
     */
    updateError(err, refresh = false) {
        // escape the <module>
        err = utilities_1.default.escapeHtml(err);
        err = this.makeErrorGoogleable(err);
        this.errorContainer = `<div id="error">${err}</div>`;
        if (refresh)
            this.throttledUpdate();
    }
    injectCustomCSS(css, refresh = false) {
        this.customCSS = css;
        if (refresh)
            this.throttledUpdate();
    }
    handlePrint(printResults) {
        // escape any accidental html
        printResults = utilities_1.default.escapeHtml(printResults);
        this.printContainer = `<br><h3>Print Output:</h3><div class="print">${printResults}</div>`;
        this.throttledUpdate();
    }
    clearPrint() {
        this.printContainer = this.emptyPrint;
    }
    displayProcessError(err) {
        let errMsg = `Error in the LiveCode extension!\n${err}`;
        if (err.includes("ENOENT") || err.includes("9009")) { // NO SUCH FILE OR DIRECTORY
            // user probably just doesn't have python installed
            errMsg = errMsg + `\n\nAre you sure you have installed python 3 and it is in your PATH?
            You can download python here: https://www.python.org/downloads/`;
        }
        this.updateError(errMsg, true);
    }
    makeErrorGoogleable(err) {
        if (err && err.trim().length > 0) {
            let errLines = err.split("\n");
            // exception usually on last line so start from bottom
            for (let i = errLines.length - 1; i >= 0; i--) {
                // most exceptions follow format ERROR: explanation
                // ex: json.decoder.JSONDecodeError: Expecting value: line 1 column 1 (char 0)
                // so we can identify them by a single word at start followed by colon
                const errRegex = /(^[\w\.]+): /;
                const lineRegex = /line (\d+)/;
                if (errLines[i].match(lineRegex)) {
                    errLines[i] = "";
                }
                if (errLines[i].match(errRegex)) {
                    const googleLink = "https://www.google.com/search?q=python ";
                    errLines[i] = errLines[i].link(googleLink + errLines[i]);
                }
            }
            return errLines.join("\n");
        }
        else
            return err;
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    getMediaPath(mediaFile) {
        const onDiskPath = vscode.Uri.file(path.join(this.context.extensionPath, "media", mediaFile));
        return onDiskPath.with({ scheme: "vscode-resource" });
    }
    updateContent() {
        const printPlacement = settings_1.settings().get("printResultPlacement");
        const showFooter = settings_1.settings().get("showFooter");
        const variables = '<div id="break"><br></div><div id="results"></div>';
        // removed <h3>Variables:</h3> from var above
        // todo: handle different themes.  check body class: https://code.visualstudio.com/updates/June_2016
        this.html = `<!doctype html>
        <html lang="en">
        <head>
            <title>LiveCode</title>
            ${this.css}
            <style>${this.customCSS}</style>
            ${this.jsonRendererScript}
            ${this.jsonRendererCode}
        </head>
        <body>
            ${printPlacement == "bottom" ?
            variables + this.errorContainer + this.printContainer :
            this.printContainer + this.errorContainer + variables}
            
            <br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>
            ${this.timeContainer}
            <div id="${Math.random()}" style="display:none"></div>
            <div id="739177969589762537283729281" style="display:none"></div></body></html>`;
        // the weird div with a random id above is necessary
        // if not there weird issues appear
        // ${showFooter ? this.footer : ""}
        try {
            this.panel.webview.html = this.html;
        }
        catch (error) {
            if (error instanceof Error && error.message.includes("disposed")) {
                // swallow - user probably just got rid of webview inbetween throttled update call
                console.warn(error);
            }
            else
                throw error;
        }
        this._onDidChange.fire(vscode.Uri.parse(PythonPanelPreview.PREVIEW_URI));
    }
}
exports.default = PythonPanelPreview;
PythonPanelPreview.scheme = "pythonPanelPreview";
PythonPanelPreview.PREVIEW_URI = PythonPanelPreview.scheme + "://authority/preview";
//# sourceMappingURL=pythonPanelPreview.js.map