/**
 * Created by claudio on 2022-08-23
 */
const jasmineBrowser = require('jasmine-browser-runner');

const config = require(require('path').resolve('./test/config/jasmine-browser.json'));

config.projectBaseDir = process.cwd();

if (process.argv[2]) {
    let testSpecs = process.argv[2];

    if (process.env.npm_package_version) {
        testSpecs = testSpecs.replace('{!npm_package_version}', process.env.npm_package_version);
    }

    config.specFiles = [testSpecs];
}

jasmineBrowser.runSpecs(config);
