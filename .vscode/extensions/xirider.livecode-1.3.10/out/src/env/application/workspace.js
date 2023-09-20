"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class WorkspaceService {
    get onDidChangeConfiguration() {
        return vscode_1.workspace.onDidChangeConfiguration;
    }
    get rootPath() {
        return Array.isArray(vscode_1.workspace.workspaceFolders) ? vscode_1.workspace.workspaceFolders[0].uri.fsPath : undefined;
    }
    get workspaceFolders() {
        return vscode_1.workspace.workspaceFolders;
    }
    get onDidChangeWorkspaceFolders() {
        return vscode_1.workspace.onDidChangeWorkspaceFolders;
    }
    get hasWorkspaceFolders() {
        return Array.isArray(vscode_1.workspace.workspaceFolders) && vscode_1.workspace.workspaceFolders.length > 0;
    }
    getConfiguration(section, resource) {
        return vscode_1.workspace.getConfiguration(section, resource || null);
    }
    getWorkspaceFolder(uri) {
        return uri ? vscode_1.workspace.getWorkspaceFolder(uri) : undefined;
    }
    asRelativePath(pathOrUri, includeWorkspaceFolder) {
        return vscode_1.workspace.asRelativePath(pathOrUri, includeWorkspaceFolder);
    }
    createFileSystemWatcher(globPattern, _ignoreCreateEvents, ignoreChangeEvents, ignoreDeleteEvents) {
        return vscode_1.workspace.createFileSystemWatcher(globPattern, ignoreChangeEvents, ignoreChangeEvents, ignoreDeleteEvents);
    }
    findFiles(include, exclude, maxResults, token) {
        return vscode_1.workspace.findFiles(include, exclude, maxResults, token);
    }
    getWorkspaceFolderIdentifier(resource, defaultValue = '') {
        const workspaceFolder = resource ? vscode_1.workspace.getWorkspaceFolder(resource) : undefined;
        return workspaceFolder ? workspaceFolder.uri.fsPath : defaultValue;
    }
}
exports.WorkspaceService = WorkspaceService;
//# sourceMappingURL=workspace.js.map