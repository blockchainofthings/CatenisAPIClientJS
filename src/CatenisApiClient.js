/**
 * Created by claudio on 28/03/17.
 */
(function (context) {
    // Save local reference to required third-party libraries
    var _jQuery = jQuery.noConflict(true),
        _moment = window.moment,
        _sjcl = window.SJCL;

    // Restore third-party libraries that might have been loaded before this library was loaded
    //  NOTE: no need to do the same with the jQuery library because its noConflict() method
    //      (used above) already takes care of restoring any previous version that might had been
    //      loaded beforehand
    window.moment = context._ctnApiClientLibs.moment;
    window.SJCL = context._ctnApiClientLibs.sjcl;

    var apiPath = '/api/',
        signVersionId = 'CTN1',
        signMethodId = 'CTN1-HMAC-SHA256',
        scopeRequest = 'ctn1_request',
        timestampHdr = 'X-BCoT-Timestamp',
        signValidDays = 7;

    // Constructor
    //
    //  Parameters:
    //    deviceId: [String]            - Catenis device ID
    //    apiAccessSecret: [String]     - Catenis device's API access secret
    //    options [Object] (optional) {
    //      host: [String],             - (optional, default: catenis.io) Host name (with optional port) of target Catenis API server
    //      environment: [String],      - (optional, default: 'prod') Environment of target Catenis API server. Valid values: 'prod', 'beta'
    //      secure: [Boolean],          - (optional, default: true) Indicates whether a secure connection (HTTPS) should be used
    //      version: [String]           - (optional, default: 0.1) Version of Catenis API to target
    //    }
    function ApiClient(deviceId, apiAccessSecret, options) {
        var _host = 'catenis.io';
        var _subdomain = '';
        var _secure = true;
        var _version = '0.1';

        if (typeof options === 'object' && options !== null) {
            _host = typeof options.host === 'string' && options.host.length > 0 ? options.host : _host;
            _subdomain = options.environment === 'beta' ? 'beta.' : _subdomain;
            _secure = typeof options.secure === 'boolean' ? options.secure : _secure;
            _version = typeof options.version === 'string' && options.version.length > 0 ? options.version : _version;
        }

        this.host = _subdomain + _host;
        this.uriPrefix = (_secure ? 'https://' : 'http://') + this.host;
        this.rootApiEndPoint = this.uriPrefix + apiPath + _version;
        this.deviceId = deviceId;
        this.apiAccessSecret = apiAccessSecret;
        this.lastSignDate = undefined;
        this.lastSignKey = undefined;

        this.reqParams = {};
    }

    ApiClient.processReturn = function (callback, data, returnType) {
        if (returnType === 'error') {
            callback(data);
        }
        else if (returnType === 'success') {
            if (typeof data === 'object' && data !== null) {
                var objKeys = Object.keys(data);
                if (objKeys.length > 0 && objKeys[0] === 'error') {
                    callback(data);
                }
                else {
                    callback(undefined, data);
                }
            }
        }
    };

    // Log a message
    //
    //  Parameters:
    //    message: [String]       - The message to store
    //    options: [Object] (optional) {
    //      encoding: [String],   - (optional, default: "utf8") One of the following values identifying the encoding of the message: "utf8"|"base64"|"hex"
    //      encrypt:  [Boolean],  - (optional, default: true) Indicates whether message should be encrypted before storing
    //      storage: [String]     - (optional, default: "auto") One of the following values identifying where the message should be stored: "auto"|"embedded"|"external"
    //    }
    //    callback: [Function]    - Callback function
    ApiClient.prototype.logMessage = function (message, options, callback) {
        var data = {
            message: message
        };

        if (options) {
            data.options = options;
        }

        var successFunc = ApiClient.processReturn.bind(undefined, callback),
            errorFunc = successFunc;

        postRequest.call(this, 'message/log', data, {
            success: successFunc,
            error: errorFunc
        })
    };

    // Send a message
    //
    //  Parameters:
    //    targetDevice: [Object] {
    //      id: [String],               - ID of target device. Should be Catenis device ID unless isProdUniqueId is true
    //      isProdUniqueId: [Boolean]   - (optional, default: false) Indicate whether supply ID is a product unique ID (otherwise, if should be a Catenis device Id)
    //    },
    //    message: [String],            - The message to send
    //    options: [Object] (optional) {
    //      encoding: [String],         - (optional, default: "utf8") One of the following values identifying the encoding of the message: "utf8"|"base64"|"hex"
    //      encrypt:  [Boolean],        - (optional, default: true) Indicates whether message should be encrypted before storing
    //      storage: [String]           - (optional, default: "auto") One of the following values identifying where the message should be stored: "auto"|"embedded"|"external"
    //    }
    //    callback: [Function]          - Callback function
    ApiClient.prototype.sendMessage = function (targetDevice, message, options, callback) {
        var data = {
            message: message,
            targetDevice: targetDevice
        };

        if (options) {
            data.options = options;
        }

        var successFunc = ApiClient.processReturn.bind(undefined, callback),
            errorFunc = successFunc;

        postRequest.call(this, 'message/send', data, {
            success: successFunc,
            error: errorFunc
        });
    };

    // Read a message
    //
    //  Parameters:
    //    txid: [String]        - ID of blockchain transaction where message is written
    //    encoding: [String]    - (optional, default: "utf8") One of the following values identifying the encoding that should be used for the returned message: utf8|base64|hex
    //    callback: [Function]  - Callback function
    ApiClient.prototype.readMessage = function (txid, encoding, callback) {
        var params = {
            url: [
                txid
            ]
        };

        if (encoding) {
            params.query = {
                encoding: encoding
            };
        }

        var successFunc = ApiClient.processReturn.bind(undefined, callback),
            errorFunc = successFunc;

        getRequest.call(this, 'message/read', params, {
            success: successFunc,
            error: errorFunc
        });
    };

    function postRequest(methodPath, data, result) {
        var url = this.rootApiEndPoint + '/' + methodPath;

        this.reqParams = {
            url: url,
            contentType: "application/json",
            processData: false,
            data: JSON.stringify(data),
            type: "POST",
            success: result.success,
            error: result.error
        };

        signRequest.call(this);

        _jQuery.ajax(this.reqParams);
    }

    function getRequest(methodPath, params, result) {
        var url = this.rootApiEndPoint + '/' + methodPath;

        if (typeof params === 'object' && params !== null) {
            if (typeof params.url === 'object' && Array.isArray(params.url)) {
                params.url.forEach(function (urlParam) {
                    url += '/' + encodeURI(urlParam);
                });
            }

            if (typeof params.query === 'object' && params.query !== null) {
                var queryStr = '';
                for (var queryParam in params.query) {
                    queryStr += encodeURI(queryParam) + '=' + encodeURI(params.query[queryParam]);
                }
                if (queryStr.length > 0) {
                    url += '?' + queryStr;
                }
            }
        }

        this.reqParams = {
            url: url,
            type: "GET",
            success: result.success,
            error: result.error
        };

        signRequest.call(this);

        _jQuery.ajax(this.reqParams);
    }

    function signRequest() {
        // Add timestamp header
        var now = _moment();
        var timestamp = _moment.utc(now).format('YYYYMMDDTHHmmss[Z]');
        var signDate,
            useSameSignKey;

        if (this.lastSignDate && now.diff(this.lastSignDate) < signValidDays) {
            signDate = this.lastSignDate;
            useSameSignKey = !!this.lastSignKey;
        }
        else {
            signDate = this.lastSignDate = now.format('YYYYMMDD');
            useSameSignKey = false;
        }

        this.reqParams.headers = this.reqParams.headers || {};
        this.reqParams.headers[timestampHdr] = timestamp;

        // First step: compute conformed request
        var confReq = this.reqParams.type + '\n';
        confReq += this.reqParams.url.substr(this.uriPrefix.length) + '\n';

        var essentialHeaders = 'host:' + this.host + '\n';
        essentialHeaders += timestampHdr.toLowerCase() + ':' + this.reqParams.headers[timestampHdr] + '\n';

        confReq += essentialHeaders + '\n';
        confReq += hashData(this.reqParams.data || '') + '\n';

        // Second step: assemble string to find
        var strToSign = signMethodId + '\n';
        strToSign += timestamp + '\n';

        var scope = signDate + '/' + scopeRequest;

        strToSign += scope + '\n';
        strToSign += hashData(confReq) + '\n';

        // Third step: generate the signature
        var signKey;

        if (useSameSignKey) {
            signKey = this.lastSignKey;
        }
        else {
            var dateKey = signData(signDate, signVersionId + this.apiAccessSecret);
            signKey = this.lastSignKey = signData(scopeRequest, dateKey);
        }

        var signature = signData(strToSign, signKey, true);

        // Step four: add authorization header
        this.reqParams.headers.Authorization = signMethodId + ' Credential=' + this.deviceId + '/' + scope + ', Signature=' + signature;
    }

    function hashData(data) {
        return _sjcl.codec.hex.fromBits(_sjcl.hash.sha256.hash(data));
    }

    function signData(data, secret, hexEncode) {
        var key = typeof secret === 'string' ? _sjcl.codec.utf8String.toBits(secret) : secret;
        var result = (new _sjcl.misc.hmac(key)).encrypt(data);

        return hexEncode ? _sjcl.codec.hex.fromBits(result) : result;
    }

    // Export function class
    context.CtnApiClient = ApiClient;
})(this);
