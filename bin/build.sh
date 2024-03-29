#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null && pwd)"

cd "$SCRIPT_DIR/.."

# Get required bower packages
./node_modules/.bin/bower install

rm -f ./build/* && cat ./src/sjcl_preamble.txt ./lib/sjcl.min.js ./src/sjcl_postamble.txt > ./lib/custom.sjcl.min.js && ./node_modules/.bin/uglifyjs ./src/CatenisApiClientLibs.js ./lib/jquery.min.js ./lib/moment.min.js ./lib/custom.sjcl.min.js ./lib/heir.js ./lib/EventEmitter.min.js ./bower_components/pako/dist/pako_deflate.min.js ./src/CatenisApiClient.js --compress --mangle --beautify "preamble='// CatenisAPIClientJS ver.$npm_package_version - Copyright (c) 2017-2021, Blockchain of Things Inc.'" --source-map "filename='CatenisAPIClientJS.min.js',url='CatenisAPIClientJS.min.js.map'" --output ./build/CatenisAPIClientJS.min.js