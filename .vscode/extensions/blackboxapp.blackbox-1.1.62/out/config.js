"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = exports.getSearchURL = void 0;
const CSConfig = {
    SEARCH_PATTERN: /(\/\/|#|--|<!--)\s?\s?(.+)\s?(\?|-->)/
};
function getSearchURL(site, keyword) {
    return '';
}
exports.getSearchURL = getSearchURL;
function getConfig() {
    const sites = {};
    return {
        settings: {
            sites,
            maxResults: 1
        }
    };
}
exports.getConfig = getConfig;
exports.default = CSConfig;
