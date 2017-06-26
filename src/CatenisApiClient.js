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
    //      version: [String]           - (optional, default: 0.2) Version of Catenis API to target
    //    }
    function ApiClient(deviceId, apiAccessSecret, options) {
        var _host = 'catenis.io';
        var _subdomain = '';
        var _secure = true;
        var _version = '0.3';

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
            callback(undefined, data);
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

        var procFunc = ApiClient.processReturn.bind(undefined, callback);

        postRequest.call(this, 'messages/log', data, {
            success: procFunc,
            error: procFunc
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

        var procFunc = ApiClient.processReturn.bind(undefined, callback);

        postRequest.call(this, 'messages/send', data, {
            success: procFunc,
            error: procFunc
        });
    };

    // Read a message
    //
    //  Parameters:
    //    messageId: [String]   - ID of message to read
    //    encoding: [String]    - (optional, default: "utf8") One of the following values identifying the encoding that should be used for the returned message: utf8|base64|hex
    //    callback: [Function]  - Callback function
    ApiClient.prototype.readMessage = function (messageId, encoding, callback) {
        var params = {
            url: [
                messageId
            ]
        };

        if (encoding) {
            params.query = {
                encoding: encoding
            };
        }

        var procFunc = ApiClient.processReturn.bind(undefined, callback);

        getRequest.call(this, 'messages/:messageId', params, {
            success: procFunc,
            error: procFunc
        });
    };

    // Retrieve message container
    //
    //  Parameters:
    //    messageId: [String]   - ID of message to retrieve container info
    //    callback: [Function]  - Callback function
    ApiClient.prototype.retrieveMessageContainer = function (messageId, callback) {
        var params = {
            url: [
                messageId
            ]
        };

        var procFunc = ApiClient.processReturn.bind(undefined, callback);

        getRequest.call(this, 'messages/:messageId/container', params, {
            success: procFunc,
            error: procFunc
        });
    };

    // List messages
    //
    //  Parameters:
    //    options: [Object] (optional) {
    //      action: [String]                 - (optional, default: "any") - One of the following values specifying the action originally performed on
    //                                          the messages intended to be retrieved: "log"|"send"|"any"
    //      direction [String]               - (optional, default: "any") - One of the following values specifying the direction of the sent messages
    //                                          intended to be retrieve: "inbound"|"outbound"|"any". Note that this option only applies to
    //                                          sent messages (action = "send"). "inbound" indicates messages sent to the device that issued
    //                                          the request, while "outbound" indicates messages sent from the device that issued the request
    //      fromDeviceIds [String]           - (optional) - Comma separated list containing the Catenis device ID of the devices from which
    //                                          the messages intended to be retrieved had been sent. Note that this option only
    //                                          applies to messages sent to the device that issued the request (action = "send" and direction = "inbound")
    //      toDeviceIds [String]             - (optional) - Comma separated list containing the Catenis device ID of the devices to which
    //                                          the messages intended to be retrieved had been sent. Note that this option only
    //                                          applies to messages sent from the device that issued the request (action = "send" and direction = "outbound")
    //      fromDeviceProdUniqueIds [String] - (optional) - Comma separated list containing the unique product ID of the devices from which
    //                                          the messages intended to be retrieved had been sent. Note that this option only
    //                                          applies to messages sent to the device that issued the request (action = "send" and direction = "inbound")
    //      toDeviceProdUniqueIds [String]   - (optional) - Comma separated list containing the product unique ID of the devices to which
    //                                          the messages intended to be retrieved had been sent. Note that this option only
    //                                          applies to messages sent from the device that issued the request (action = "send" and direction = "outbound")
    //      readState [String]               - (optional, default: "any") - One of the following values indicating the current read state of the
    //                                          the messages intended to be retrieved: "unread"|"read"|"any".
    //      startDate [String]               - (optional) - ISO 8601 formatted date and time specifying the lower boundary of the time frame within
    //                                          which the messages intended to be retrieved has been: logged, in case of messages logged
    //                                          by the device that issued the request (action = "log"); sent, in case of messages sent from the current
    //                                          device (action = "send" direction = "outbound"); or received, in case of messages sent to
    //                                          the device that issued the request (action = "send" and direction = "inbound")
    //      endDate [String]                 - (optional) - ISO 8601 formatted date and time specifying the upper boundary of the time frame within
    //                                          which the messages intended to be retrieved has been: logged, in case of messages logged
    //                                          by the device that issued the request (action = "log"); sent, in case of messages sent from the current
    //                                          device (action = "send" direction = "outbound"); or received, in case of messages sent to
    //                                          he device that issued the request (action = "send" and direction = "inbound")
    //    }
    //    callback: [Function]  - Callback function
    ApiClient.prototype.listMessages = function (options, callback) {
        var params = {};

        if (options) {
            params.query = {};

            if (options.action) {
                params.query.action = options.action;
            }

            if (options.direction) {
                params.query.direction = options.direction;
            }

            if (options.fromDeviceIds) {
                params.query.fromDeviceIds = options.fromDeviceIds;
            }

            if (options.toDeviceIds) {
                params.query.toDeviceIds = options.toDeviceIds;
            }

            if (options.fromDeviceProdUniqueIds) {
                params.query.fromDeviceProdUniqueIds = options.fromDeviceProdUniqueIds;
            }

            if (options.toDeviceProdUniqueIds) {
                params.query.toDeviceProdUniqueIds = options.toDeviceProdUniqueIds;
            }

            if (options.readState) {
                params.query.readState = options.readState;
            }

            if (options.startDate) {
                params.query.startDate = options.startDate;
            }

            if (options.endDate) {
                params.query.endDate = options.endDate;
            }
        }

        var procFunc = ApiClient.processReturn.bind(undefined, callback);

        getRequest.call(this, 'messages', params, {
            success: procFunc,
            error: procFunc
        });
    };

    function postRequest(methodPath, data, result) {
        this.reqParams = {
            url: this.rootApiEndPoint + '/' + methodPath,
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
        if (typeof params === 'object' && params !== null) {
            if (typeof params.url === 'object' && Array.isArray(params.url)) {
                /*params.url.forEach(function (urlParam) {
                    url += '/' + encodeURI(urlParam);
                });*/
                params.url.forEach(function (urlParam) {
                    methodPath = methodPath.replace(/:\w+/, encodeURI(urlParam));
                });
            }

            if (typeof params.query === 'object' && params.query !== null) {
                var queryStr = '';
                for (var queryParam in params.query) {
                    if (queryStr.length > 0) {
                        queryStr += '&';
                    }
                    queryStr += encodeURI(queryParam) + '=' + encodeURI(params.query[queryParam]);
                }
                if (queryStr.length > 0) {
                    methodPath += '?' + queryStr;
                }
            }
        }

        this.reqParams = {
            url: this.rootApiEndPoint + '/' + methodPath,
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
            signDate = this.lastSignDate = now.utc().format('YYYYMMDD');
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
