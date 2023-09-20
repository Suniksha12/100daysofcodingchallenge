"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const constants_1 = require("./constants");
const os_1 = require("os");
class PathUtils {
    constructor(isWindows) {
        this.isWindows = isWindows;
        // this.home = untildify('~');
        // ^ whoever wrote this should be burned at the stake
        // but seriously such a useless use of a library ಠ_ಠ
        // it's even two characters longer to write than homedir!
        this.home = os_1.homedir();
    }
    get delimiter() {
        return path.delimiter;
    }
    get separator() {
        return path.sep;
    }
    // TO DO: Deprecate in favor of IPlatformService
    getPathVariableName() {
        return this.isWindows ? constants_1.WINDOWS_PATH_VARIABLE_NAME : constants_1.NON_WINDOWS_PATH_VARIABLE_NAME;
    }
    basename(pathValue, ext) {
        return path.basename(pathValue, ext);
    }
    getDisplayName(pathValue, cwd) {
        if (cwd && pathValue.startsWith(cwd)) {
            return `.${path.sep}${path.relative(cwd, pathValue)}`;
        }
        else if (pathValue.startsWith(this.home)) {
            return `~${path.sep}${path.relative(this.home, pathValue)}`;
        }
        else {
            return pathValue;
        }
    }
}
exports.PathUtils = PathUtils;
//# sourceMappingURL=pathUtils.js.map