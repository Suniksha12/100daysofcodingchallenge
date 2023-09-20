"use strict";
// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.
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
exports.leetCodeManager = void 0;
const cp = require("child_process");
const events_1 = require("events");
const vscode = require("vscode");
const leetCodeChannel_1 = require("./leetCodeChannel");
const leetCodeExecutor_1 = require("./leetCodeExecutor");
const shared_1 = require("./shared");
const cpUtils_1 = require("./utils/cpUtils");
const uiUtils_1 = require("./utils/uiUtils");
const wsl = require("./utils/wslUtils");
class LeetCodeManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.successRegex = /(?:.*)Successfully .*login as (.*)/i;
        this.failRegex = /.*\[ERROR\].*/i;
        this.currentUser = undefined;
        this.userStatus = shared_1.UserStatus.SignedOut;
    }
    getLoginStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield leetCodeExecutor_1.leetCodeExecutor.getUserInfo();
                this.currentUser = this.tryParseUserName(result);
                this.userStatus = shared_1.UserStatus.SignedIn;
            }
            catch (error) {
                this.currentUser = undefined;
                this.userStatus = shared_1.UserStatus.SignedOut;
            }
            finally {
                this.emit("statusChanged");
            }
        });
    }
    signIn() {
        return __awaiter(this, void 0, void 0, function* () {
            const picks = [];
            picks.push({
                label: "LeetCode Account",
                detail: "Use LeetCode account to login (US endpoint is not supported)",
                value: "LeetCode",
            }, {
                label: "Third-Party: GitHub",
                detail: "Use GitHub account to login",
                value: "GitHub",
            }, {
                label: "Third-Party: LinkedIn",
                detail: "Use LinkedIn account to login",
                value: "LinkedIn",
            }, {
                label: "LeetCode Cookie",
                detail: "Use LeetCode cookie copied from browser to login",
                value: "Cookie",
            });
            const choice = yield vscode.window.showQuickPick(picks);
            if (!choice) {
                return;
            }
            const loginMethod = choice.value;
            const commandArg = shared_1.loginArgsMapping.get(loginMethod);
            if (!commandArg) {
                throw new Error(`The login method "${loginMethod}" is not supported.`);
            }
            const isByCookie = loginMethod === "Cookie";
            const inMessage = isByCookie ? "sign in by cookie" : "sign in";
            try {
                const userName = yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b, _c, _d;
                    const leetCodeBinaryPath = yield leetCodeExecutor_1.leetCodeExecutor.getLeetCodeBinaryPath();
                    const childProc = wsl.useWsl()
                        ? cp.spawn("wsl", [leetCodeExecutor_1.leetCodeExecutor.node, leetCodeBinaryPath, "user", commandArg], { shell: true })
                        : cp.spawn(leetCodeExecutor_1.leetCodeExecutor.node, [leetCodeBinaryPath, "user", commandArg], {
                            shell: true,
                            env: cpUtils_1.createEnvOption(),
                        });
                    (_a = childProc.stdout) === null || _a === void 0 ? void 0 : _a.on("data", (data) => __awaiter(this, void 0, void 0, function* () {
                        var _e, _f, _g;
                        data = data.toString();
                        leetCodeChannel_1.leetCodeChannel.append(data);
                        if (data.includes("twoFactorCode")) {
                            const twoFactor = yield vscode.window.showInputBox({
                                prompt: "Enter two-factor code.",
                                ignoreFocusOut: true,
                                validateInput: (s) => s && s.trim() ? undefined : "The input must not be empty",
                            });
                            if (!twoFactor) {
                                childProc.kill();
                                return resolve(undefined);
                            }
                            (_e = childProc.stdin) === null || _e === void 0 ? void 0 : _e.write(`${twoFactor}\n`);
                        }
                        const successMatch = data.match(this.successRegex);
                        if (successMatch && successMatch[1]) {
                            (_f = childProc.stdin) === null || _f === void 0 ? void 0 : _f.end();
                            return resolve(successMatch[1]);
                        }
                        else if (data.match(this.failRegex)) {
                            (_g = childProc.stdin) === null || _g === void 0 ? void 0 : _g.end();
                            return reject(new Error("Faile to login"));
                        }
                    }));
                    (_b = childProc.stderr) === null || _b === void 0 ? void 0 : _b.on("data", (data) => leetCodeChannel_1.leetCodeChannel.append(data.toString()));
                    childProc.on("error", reject);
                    const name = yield vscode.window.showInputBox({
                        prompt: "Enter username or E-mail.",
                        ignoreFocusOut: true,
                        validateInput: (s) => s && s.trim() ? undefined : "The input must not be empty",
                    });
                    if (!name) {
                        childProc.kill();
                        return resolve(undefined);
                    }
                    (_c = childProc.stdin) === null || _c === void 0 ? void 0 : _c.write(`${name}\n`);
                    const pwd = yield vscode.window.showInputBox({
                        prompt: isByCookie ? "Enter cookie" : "Enter password.",
                        password: true,
                        ignoreFocusOut: true,
                        validateInput: (s) => s ? undefined : isByCookie ? "Cookie must not be empty" : "Password must not be empty",
                    });
                    if (!pwd) {
                        childProc.kill();
                        return resolve(undefined);
                    }
                    (_d = childProc.stdin) === null || _d === void 0 ? void 0 : _d.write(`${pwd}\n`);
                }));
                if (userName) {
                    vscode.window.showInformationMessage(`Successfully ${inMessage}.`);
                    this.currentUser = userName;
                    this.userStatus = shared_1.UserStatus.SignedIn;
                    this.emit("statusChanged");
                }
            }
            catch (error) {
                uiUtils_1.promptForOpenOutputChannel(`Failed to ${inMessage}. Please open the output channel for details`, uiUtils_1.DialogType.error);
            }
        });
    }
    signOut() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield leetCodeExecutor_1.leetCodeExecutor.signOut();
                vscode.window.showInformationMessage("Successfully signed out.");
                this.currentUser = undefined;
                this.userStatus = shared_1.UserStatus.SignedOut;
                this.emit("statusChanged");
            }
            catch (error) {
                // swallow the error when sign out.
            }
        });
    }
    getStatus() {
        return this.userStatus;
    }
    getUser() {
        return this.currentUser;
    }
    tryParseUserName(output) {
        const reg = /^\s*.\s*(.+?)\s*https:\/\/leetcode/m;
        const match = output.match(reg);
        if (match && match.length === 2) {
            return match[1].trim();
        }
        return "Unknown";
    }
}
exports.leetCodeManager = new LeetCodeManager();
//# sourceMappingURL=leetCodeManager.js.map