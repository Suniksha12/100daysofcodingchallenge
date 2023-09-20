"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
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
const vscode_1 = require("vscode");
const cacheDuration = 60 * 60 * 1000;
class EnvironmentVariablesProvider {
    constructor(envVarsService, disposableRegistry, platformService, workspaceService, process) {
        this.envVarsService = envVarsService;
        this.platformService = platformService;
        this.workspaceService = workspaceService;
        this.process = process;
        this.trackedWorkspaceFolders = new Set();
        this.fileWatchers = new Map();
        disposableRegistry.push(this);
        this.changeEventEmitter = new vscode_1.EventEmitter();
    }
    get onDidEnvironmentVariablesChange() {
        return this.changeEventEmitter.event;
    }
    dispose() {
        this.changeEventEmitter.dispose();
        this.fileWatchers.forEach(watcher => {
            if (watcher) {
                watcher.dispose();
            }
        });
    }
    getEnvironmentVariables(envFilePath, workspaceFolderUri) {
        return __awaiter(this, void 0, void 0, function* () {
            this.trackedWorkspaceFolders.add(workspaceFolderUri ? workspaceFolderUri.fsPath : '');
            let mergedVars = yield this.envVarsService.parseFile(envFilePath, this.process.env);
            if (!mergedVars) {
                mergedVars = {};
            }
            this.envVarsService.mergeVariables(this.process.env, mergedVars);
            const pathVariable = this.platformService.pathVariableName;
            const pathValue = this.process.env[pathVariable];
            if (pathValue) {
                this.envVarsService.appendPath(mergedVars, pathValue);
            }
            if (this.process.env.PYTHONPATH) {
                this.envVarsService.appendPythonPath(mergedVars, this.process.env.PYTHONPATH);
            }
            return mergedVars;
        });
    }
}
exports.EnvironmentVariablesProvider = EnvironmentVariablesProvider;
//# sourceMappingURL=environmentVariablesProvider.js.map