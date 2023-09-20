// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
'use strict';
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
const os = require("os");
const semver_1 = require("semver");
const platform_1 = require("../utils/platform");
const version_1 = require("../utils/version");
const constants_1 = require("./constants");
class PlatformService {
    constructor() {
        this.osType = platform_1.getOSType();
    }
    get pathVariableName() {
        return this.isWindows ? constants_1.WINDOWS_PATH_VARIABLE_NAME : constants_1.NON_WINDOWS_PATH_VARIABLE_NAME;
    }
    get virtualEnvBinName() {
        return this.isWindows ? 'Scripts' : 'bin';
    }
    getVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.version) {
                return this.version;
            }
            switch (this.osType) {
                case platform_1.OSType.Windows:
                case platform_1.OSType.OSX:
                    // Release section of https://en.wikipedia.org/wiki/MacOS_Sierra.
                    // Version 10.12 maps to Darwin 16.0.0.
                    // Using os.relase() we get the darwin release #.
                    try {
                        const ver = semver_1.coerce(os.release());
                        if (ver) {
                            return this.version = ver;
                        }
                        throw new Error('Unable to parse version');
                    }
                    catch (ex) {
                        return version_1.parseVersion(os.release());
                    }
                default:
                    throw new Error('Not Supported');
            }
        });
    }
    get isWindows() {
        return this.osType === platform_1.OSType.Windows;
    }
    get isMac() {
        return this.osType === platform_1.OSType.OSX;
    }
    get isLinux() {
        return this.osType === platform_1.OSType.Linux;
    }
    get osRelease() {
        return os.release();
    }
    get is64bit() {
        // tslint:disable-next-line:no-require-imports
        const arch = require('arch');
        return arch() === 'x64';
    }
}
exports.PlatformService = PlatformService;
//# sourceMappingURL=platformService.js.map