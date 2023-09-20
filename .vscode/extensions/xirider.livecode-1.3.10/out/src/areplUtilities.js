"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const os_1 = require("os");
const settings_1 = require("./settings");
const python_shell_1 = require("python-shell");
const vscodeUtilities_1 = require("./vscodeUtilities");
/**
 * utilities specific to AREPL
 */
class areplUtils {
    static getEnvFilePath() {
        let envFilePath = vscodeUtilities_1.default.getSettingOrOtherExtSettingAsDefault("AREPL", "python", "envFile");
        if (!envFilePath)
            envFilePath = "${workspaceFolder}/.env";
        return vscodeUtilities_1.default.expandPathSetting(envFilePath);
    }
    static getPythonPath() {
        let pythonPath = vscodeUtilities_1.default.getSettingOrOtherExtSettingAsDefault("AREPL", "python", "pythonPath");
        if (!pythonPath)
            pythonPath = python_shell_1.PythonShell.defaultPythonPath;
        return vscodeUtilities_1.default.expandPathSetting(pythonPath);
    }
    static insertDefaultImports(editor) {
        return editor.edit((editBuilder) => {
            let imports = settings_1.settings().get("defaultImports");
            imports = imports.filter(i => i.trim() != "");
            if (imports.length == 0)
                return;
            imports = imports.map(i => {
                const words = i.split(" ");
                // python import syntax: "import library" or "from library import method"
                // so if user didnt specify import we will do that for them :)
                if (words[0] != "import" && words[0] != "from" && words[0].length > 0) {
                    i = "import " + i;
                }
                return i;
            });
            editBuilder.insert(new vscode.Position(0, 0), imports.join(os_1.EOL) + os_1.EOL);
        });
    }
}
exports.default = areplUtils;
//# sourceMappingURL=areplUtilities.js.map