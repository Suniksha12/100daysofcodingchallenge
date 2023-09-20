"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
/**
 * simple alias for workspace.getConfiguration("livecode")
 */
function settings() {
    return vscode_1.workspace.getConfiguration("livecode");
}
exports.settings = settings;
//# sourceMappingURL=settings.js.map