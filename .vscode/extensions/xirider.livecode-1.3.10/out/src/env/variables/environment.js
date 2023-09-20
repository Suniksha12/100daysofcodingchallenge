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
const path = require("path");
const fs = require("fs");
const util_1 = require("util");
const access = util_1.promisify(fs.access);
const readFile = util_1.promisify(fs.readFile);
/**
 * from fs-extra package
 * @param path
 */
function pathExists(path) {
    return access(path).then(() => true).catch(() => false);
}
class EnvironmentVariablesService {
    constructor(pathUtils) {
        this.pathVariable = pathUtils.getPathVariableName();
    }
    parseFile(filePath, baseVars) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!filePath || !(yield pathExists(filePath))) {
                return;
            }
            if (!fs.lstatSync(filePath).isFile()) {
                return;
            }
            return parseEnvFile(yield readFile(filePath, { encoding: null, flag: null }), baseVars);
        });
    }
    mergeVariables(source, target) {
        if (!target) {
            return;
        }
        const settingsNotToMerge = ['PYTHONPATH', this.pathVariable];
        Object.keys(source).forEach(setting => {
            if (settingsNotToMerge.indexOf(setting) >= 0) {
                return;
            }
            if (target[setting] === undefined) {
                target[setting] = source[setting];
            }
        });
    }
    appendPythonPath(vars, ...pythonPaths) {
        return this.appendPaths(vars, 'PYTHONPATH', ...pythonPaths);
    }
    appendPath(vars, ...paths) {
        return this.appendPaths(vars, this.pathVariable, ...paths);
    }
    appendPaths(vars, variableName, ...pathsToAppend) {
        const valueToAppend = pathsToAppend
            .filter(item => typeof item === 'string' && item.trim().length > 0)
            .map(item => item.trim())
            .join(path.delimiter);
        if (valueToAppend.length === 0) {
            return vars;
        }
        const variable = vars ? vars[variableName] : undefined;
        if (variable && typeof variable === 'string' && variable.length > 0) {
            vars[variableName] = variable + path.delimiter + valueToAppend;
        }
        else {
            vars[variableName] = valueToAppend;
        }
        return vars;
    }
}
exports.EnvironmentVariablesService = EnvironmentVariablesService;
function parseEnvFile(lines, baseVars) {
    const globalVars = baseVars ? baseVars : {};
    const vars = {};
    lines.toString().split('\n').forEach((line, _idx) => {
        const [name, value] = parseEnvLine(line);
        if (name === '') {
            return;
        }
        vars[name] = substituteEnvVars(value, vars, globalVars);
    });
    return vars;
}
exports.parseEnvFile = parseEnvFile;
function parseEnvLine(line) {
    // Most of the following is an adaptation of the dotenv code:
    //   https://github.com/motdotla/dotenv/blob/master/lib/main.js#L32
    // We don't use dotenv here because it loses ordering, which is
    // significant for substitution.
    const match = line.match(/^\s*([a-zA-Z]\w*)\s*=\s*(.*?)?\s*$/);
    if (!match) {
        return ['', ''];
    }
    const name = match[1];
    let value = match[2];
    if (value && value !== '') {
        if (value[0] === '\'' && value[value.length - 1] === '\'') {
            value = value.substring(1, value.length - 1);
            value = value.replace(/\\n/gm, '\n');
        }
        else if (value[0] === '"' && value[value.length - 1] === '"') {
            value = value.substring(1, value.length - 1);
            value = value.replace(/\\n/gm, '\n');
        }
    }
    else {
        value = '';
    }
    return [name, value];
}
const SUBST_REGEX = /\${([a-zA-Z]\w*)?([^}\w].*)?}/g;
function substituteEnvVars(value, localVars, globalVars, missing = '') {
    // Substitution here is inspired a little by dotenv-expand:
    //   https://github.com/motdotla/dotenv-expand/blob/master/lib/main.js
    let invalid = false;
    let replacement = value;
    replacement = replacement.replace(SUBST_REGEX, (match, substName, bogus, offset, orig) => {
        if (offset > 0 && orig[offset - 1] === '\\') {
            return match;
        }
        if ((bogus && bogus !== '') || !substName || substName === '') {
            invalid = true;
            return match;
        }
        return localVars[substName] || globalVars[substName] || missing;
    });
    if (!invalid && replacement !== value) {
        value = replacement;
    }
    return value.replace(/\\\$/g, '$');
}
//# sourceMappingURL=environment.js.map