// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var Architecture;
(function (Architecture) {
    Architecture[Architecture["Unknown"] = 1] = "Unknown";
    Architecture[Architecture["x86"] = 2] = "x86";
    Architecture[Architecture["x64"] = 3] = "x64";
})(Architecture = exports.Architecture || (exports.Architecture = {}));
var OSType;
(function (OSType) {
    OSType["Unknown"] = "Unknown";
    OSType["Windows"] = "Windows";
    OSType["OSX"] = "OSX";
    OSType["Linux"] = "Linux";
})(OSType = exports.OSType || (exports.OSType = {}));
// Return the OS type for the given platform string.
function getOSType(platform = process.platform) {
    if (/^win/.test(platform)) {
        return OSType.Windows;
    }
    else if (/^darwin/.test(platform)) {
        return OSType.OSX;
    }
    else if (/^linux/.test(platform)) {
        return OSType.Linux;
    }
    else {
        return OSType.Unknown;
    }
}
exports.getOSType = getOSType;
//# sourceMappingURL=platform.js.map