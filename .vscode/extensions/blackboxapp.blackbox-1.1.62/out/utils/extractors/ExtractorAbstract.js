"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../../config");
const fetchPageContent_1 = require("../fetchPageContent");
class ExtractorAbstract {
    constructor() {
        this.extractURLFromKeyword = (keyword) => {
            return new Promise((resolve, reject) => {
                (0, fetchPageContent_1.fetchPageTextContent)((0, config_1.getSearchURL)(this.URL, keyword))
                    .then(rs => {
                    const regex = new RegExp(`(https://${this.URL}/[a-z0-9-/]+)`, "gi");
                    let urls = rs.textContent.match(regex);
                    urls && (urls = urls.filter((url, i, list) => list.indexOf(url) === i));
                    resolve(urls || []);
                })
                    .catch(reject);
            });
        };
    }
    isEnabled() {
        const config = (0, config_1.getConfig)();
        return this.URL in config.settings.sites && config.settings.sites[this.URL];
    }
}
exports.default = ExtractorAbstract;
