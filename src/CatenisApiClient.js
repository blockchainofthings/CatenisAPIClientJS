/**
 * Created by claudio on 28/03/17.
 */
(function (context) {
    // Save local reference to required third-party libraries
    var _jQuery = jQuery.noConflict(true),
        _moment = window.moment,
        _sjcl = window.SJCL,
        _heir = window.heir,
        _EventEmitter = EventEmitter.noConflict();

    // Restore third-party libraries that might have been loaded before this library was loaded
    //  NOTE: no need to do the same with the jQuery library because its noConflict() method
    //      (used above) already takes care of restoring any previous version that might had been
    //      loaded beforehand
    window.moment = context._ctnApiClientLibs.moment;
    window.SJCL = context._ctnApiClientLibs.sjcl;
    window.heir = context._ctnApiClientLibs.heir;

    var apiPath = '/api/',
        signVersionId = 'CTN1',
        signMethodId = 'CTN1-HMAC-SHA256',
        scopeRequest = 'ctn1_request',
        timestampHdr = 'X-BCoT-Timestamp',
        signValidDays = 7,
        notifyRootPath = 'notify',
        wsNtfyRootPath =  'ws',
        notifyWsSubprotocol = 'notify.catenis.io';

    // Api Client function class constructor
    //
    //  Parameters:
    //    deviceId: [String]            - Catenis device ID
    //    apiAccessSecret: [String]     - Catenis device's API access secret
    //    options [Object] (optional) {
    //      host: [String],             - (optional, default: catenis.io) Host name (with optional port) of target Catenis API server
    //      environment: [String],      - (optional, default: 'prod') Environment of target Catenis API server. Valid values: 'prod', 'beta'
    //      secure: [Boolean],          - (optional, default: true) Indicates whether a secure connection (HTTPS) should be used
    //      version: [String]           - (optional, default: 0.5) Version of Catenis API to target
    //    }
    function ApiClient(deviceId, apiAccessSecret, options) {
        var _host = 'catenis.io';
        var _subdomain = '';
        var _secure = true;
        var _version = '0.5';

        if (typeof options === 'object' && options !== null) {
            _host = typeof options.host === 'string' && options.host.length > 0 ? options.host : _host;
            _subdomain = options.environment === 'beta' ? 'beta.' : _subdomain;
            _secure = typeof options.secure === 'boolean' ? options.secure : _secure;
            _version = typeof options.version === 'string' && options.version.length > 0 ? options.version : _version;
        }

        this.host = _subdomain + _host;
        this.uriPrefix = (_secure ? 'https://' : 'http://') + this.host;
        this.apiBaseUriPath = apiPath + _version;
        this.rootApiEndPoint = this.uriPrefix + this.apiBaseUriPath;
        this.deviceId = deviceId;
        this.apiAccessSecret = apiAccessSecret;
        this.lastSignDate = undefined;
        this.lastSignKey = undefined;
        this.wsUriScheme = _secure ? 'wss://' : 'ws://';
        this.wsUriPrefix = this.wsUriScheme + this.host;
        this.qualifiedNotifyRooPath = apiPath + notifyRootPath;
        this.wsNtfyBaseUriPath = this.qualifiedNotifyRooPath + (wsNtfyRootPath.length > 0 ? '/' : '') + wsNtfyRootPath;
        this.rootWsNtfyEndPoint = this.wsUriPrefix + this.wsNtfyBaseUriPath;

        this.reqParams = {};
    }

    ApiClient.processReturn = function (callback, data, textStatus, errorThrown) {
        if (textStatus === 'success') {
            callback(undefined, data);
        }
        else {
            // Check if this is a client of API error
            var jqXHR = data;
            var error = {};

            if (jqXHR.status >= 100) {
                error.apiError = {
                    httpStatusCode: jqXHR.status,
                    message: typeof jqXHR.responseJSON === 'object' && jqXHR.responseJSON.message ? jqXHR.responseJSON.message : jqXHR.statusText
                };
            }
            else {
                error.clientError = {
                    ajaxClient: jqXHR,
                    message: 'Ajax client error' + (textStatus ? ' (' + textStatus + ')' : '') + (errorThrown ? ': ' + errorThrown : '')
                }
            }

            callback(error);
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

        postRequest.call(this, 'messages/log', undefined, data, {
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
    //      readConfirmation: [Boolean], - (optional, default: false) Indicates whether message should be sent with read confirmation enabled
    //      encoding: [String],          - (optional, default: "utf8") One of the following values identifying the encoding of the message: "utf8"|"base64"|"hex"
    //      encrypt:  [Boolean],         - (optional, default: true) Indicates whether message should be encrypted before storing
    //      storage: [String]            - (optional, default: "auto") One of the following values identifying where the message should be stored: "auto"|"embedded"|"external"
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

        postRequest.call(this, 'messages/send', undefined, data, {
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

    // List permission events
    //
    //  Parameters:
    //    callback: [Function]  - Callback function
    ApiClient.prototype.listPermissionEvents = function (callback) {
        var procFunc = ApiClient.processReturn.bind(undefined, callback);

        getRequest.call(this, 'permission/events', undefined, {
            success: procFunc,
            error: procFunc
        });
    };

    // Retrieve permission rights
    //
    //  Parameters:
    //    eventName: [String]   - Name of permission event
    //    callback: [Function]  - Callback function
    ApiClient.prototype.retrievePermissionRights = function (eventName, callback) {
        var params = {
            url: [
                eventName
            ]
        };

        var procFunc = ApiClient.processReturn.bind(undefined, callback);

        getRequest.call(this, 'permission/events/:eventName/rights', params, {
            success: procFunc,
            error: procFunc
        });
    };

    // Set permission rights
    //
    //  Parameters:
    //    eventName: [String] - Name of permission event
    //    rights: [Object] {
    //      system: [String] - (optional) Permission right to be attributed at system level for the specified event. Must be one of the following values: "allow", "deny"
    //      catenisNode: {   - (optional) Permission rights to be attributed at the Catenis node level for the specified event
    //        allow: [Array(String)|String],  - (optional) List of indices (or a single index) of Catenis nodes to give allow right
    //                                        -  Can optionally include the value "self" to refer to the index of the Catenis node to which the device belongs
    //        deny: [Array(String)|String],   - (optional) List of indices (or a single index) of Catenis nodes to give deny right
    //                                        -  Can optionally include the value "self" to refer to the index of the Catenis node to which the device belongs
    //        none: [Array(String)|String]    - (optional) List of indices (or a single index) of Catenis nodes the rights of which should be removed.
    //                                        -  Can optionally include the value "self" to refer to the index of the Catenis node to which the device belongs.
    //                                        -  The wildcard character ("*") can also be used to indicate that the rights for all Catenis nodes should be remove
    //      },
    //      client: {   - (optional) Permission rights to be attributed at the client level for the specified event
    //        allow: [Array(String)|String],  - (optional) List of IDs (or a single ID) of clients to give allow right
    //                                        -  Can optionally include the value "self" to refer to the ID of the client to which the device belongs
    //        deny: [Array(String)|String]    - (optional) List of IDs (or a single ID) of clients to give deny right
    //                                        -  Can optionally include the value "self" to refer to the ID of the client to which the device belongs
    //        none: [Array(String)|String]    - (optional) List of IDs (or a single ID) of clients the rights of which should be removed.
    //                                        -  Can optionally include the value "self" to refer to the ID of the client to which the device belongs
    //                                        -  The wildcard character ("*") can also be used to indicate that the rights for all clients should be remove
    //      },
    //      device: {   - (optional) Permission rights to be attributed at the device level for the specified event
    //        allow: [{          - (optional) List of IDs (or a single ID) of devices to give allow right
    //          id: [String],             - ID of the device. Can optionally be replaced with value "self" to refer to the ID of the device itself
    //          isProdUniqueId [Boolean]  - (optional, default: false) Indicate whether supplied ID is a product unique ID (otherwise, if should be a Catenis device Id)
    //        }],
    //        deny: [{           - (optional) List of IDs (or a single ID) of devices to give deny right
    //          id: [String],             - ID of the device. Can optionally be replaced with value "self" to refer to the ID of the device itself
    //          isProdUniqueId [Boolean]  - (optional, default: false) Indicate whether supplied ID is a product unique ID (otherwise, if should be a Catenis device Id)
    //        }],
    //        none: [{           - (optional) List of IDs (or a single ID) of devices the rights of which should be removed.
    //          id: [String],             - ID of the device. Can optionally be replaced with value "self" to refer to the ID of the device itself
    //                                    -  The wildcard character ("*") can also be used to indicate that the rights for all devices should be remove
    //          isProdUniqueId [Boolean]  - (optional, default: false) Indicate whether supplied ID is a product unique ID (otherwise, if should be a Catenis device Id)
    //        }]
    //      }
    //    }
    //    callback: [Function]    - Callback function
    ApiClient.prototype.setPermissionRights = function (eventName, rights, callback) {
        var params = {
            url: [
                eventName
            ]
        };

        var data = rights;

        var procFunc = ApiClient.processReturn.bind(undefined, callback);

        postRequest.call(this, 'permission/events/:eventName/rights', params, data, {
            success: procFunc,
            error: procFunc
        });
    };

    // Check effective permission right
    //
    //  Parameters:
    //    eventName [String]        - Name of the permission event
    //    deviceId [String]         - ID of the device to check the permission right applied to it. Can optionally be replaced with value "self" to refer to the ID of the device that issued the request
    //    isProdUniqueId: [Boolean] - (default: false) Indicates whether the deviceId parameter should be interpreted as a product unique ID (otherwise, it is interpreted as a Catenis device Id)
    //    callback: [Function]      - Callback function
    ApiClient.prototype.checkEffectivePermissionRight = function (eventName, deviceId, isProdUniqueId, callback) {
        var params = {
            url: [
                eventName,
                deviceId
            ]
        };

        if (isProdUniqueId) {
            params.query = {
                isProdUniqueId: isProdUniqueId
            };
        }

        var procFunc = ApiClient.processReturn.bind(undefined, callback);

        getRequest.call(this, 'permission/events/:eventName/rights/:deviceId', params, {
            success: procFunc,
            error: procFunc
        });
    };

    // List notification events
    //
    //  Parameters:
    //    callback: [Function]  - Callback function
    ApiClient.prototype.listNotificationEvents = function (callback) {
        var procFunc = ApiClient.processReturn.bind(undefined, callback);

        getRequest.call(this, 'notification/events', undefined, {
            success: procFunc,
            error: procFunc
        });
    };

    // Retrieve device identification information
    //
    //  Parameters:
    //    deviceId [String]         - ID of the device the identification information of which is to be retrieved. Can optionally be replaced with value "self" to refer to the ID of the device that issued the request
    //    isProdUniqueId: [Boolean] - (default: false) Indicates whether the deviceId parameter should be interpreted as a product unique ID (otherwise, it is interpreted as a Catenis device Id)
    //    callback: [Function]      - Callback function
    ApiClient.prototype.retrieveDeviceIdentificationInfo = function (deviceId, isProdUniqueId, callback) {
        var params = {
            url: [
                deviceId
            ]
        };

        if (isProdUniqueId) {
            params.query = {
                isProdUniqueId: isProdUniqueId
            };
        }

        var procFunc = ApiClient.processReturn.bind(undefined, callback);

        getRequest.call(this, 'devices/:deviceId', params, {
            success: procFunc,
            error: procFunc
        });
    };

    // Create WebSocket Notification Channel
    //
    //  Parameters:
    //    eventName: [String] - Name of Catenis notification event
    ApiClient.prototype.createWsNotifyChannel = function (eventName) {
        return new WsNotifyChannel(this, eventName);
    };

    function postRequest(methodPath, params, data, result) {
        var reqParams = {
            url: this.rootApiEndPoint + '/' + formatMethodPath(methodPath, params),
            contentType: "application/json",
            processData: false,
            data: JSON.stringify(data),
            type: "POST",
            success: result.success,
            error: result.error
        };

        signRequest.call(this, reqParams);

        _jQuery.ajax(reqParams);
    }

    function getRequest(methodPath, params, result) {
        var reqParams = {
            url: this.rootApiEndPoint + '/' + formatMethodPath(methodPath, params),
            type: "GET",
            success: result.success,
            error: result.error
        };

        signRequest.call(this, reqParams);

        _jQuery.ajax(reqParams);
    }

    function signRequest(reqParams) {
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

        reqParams.headers = reqParams.headers || {};
        reqParams.headers[timestampHdr] = timestamp;

        // First step: compute conformed request
        var confReq = reqParams.type + '\n';
        confReq += reqParams.url.substr(reqParams.url.search(apiPath)) + '\n';

        var essentialHeaders = 'host:' + this.host + '\n';
        essentialHeaders += timestampHdr.toLowerCase() + ':' + reqParams.headers[timestampHdr] + '\n';

        confReq += essentialHeaders + '\n';
        confReq += hashData(reqParams.data || '') + '\n';

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

        var result = {
            credential: this.deviceId + '/' + scope,
            signature: signData(strToSign, signKey, true)
        };

        // Step four: add authorization header
        reqParams.headers.Authorization = signMethodId + ' Credential=' + result.credential  + ', Signature=' + result.signature;

        return result;
    }

    function hashData(data) {
        return _sjcl.codec.hex.fromBits(_sjcl.hash.sha256.hash(data));
    }

    function signData(data, secret, hexEncode) {
        var key = typeof secret === 'string' ? _sjcl.codec.utf8String.toBits(secret) : secret;
        var result = (new _sjcl.misc.hmac(key)).encrypt(data);

        return hexEncode ? _sjcl.codec.hex.fromBits(result) : result;
    }

    function formatMethodPath(methodPath, params) {
        var formattedMethodPath = methodPath;

        if (typeof params === 'object' && params !== null) {
            if (typeof params.url === 'object' && Array.isArray(params.url)) {
                params.url.forEach(function (urlParam) {
                    formattedMethodPath = formattedMethodPath.replace(/:\w+/, encodeURI(urlParam));
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
                    formattedMethodPath += '?' + queryStr;
                }
            }
        }

        return formattedMethodPath;
    }

    // WebSocket Notification Channel function class constructor
    //
    //  Parameters:
    //    apiClient: [Object] - Instance of API Client function class
    //    eventName: [String] - Name of Catenis notification event
    //
    //  Events:
    //    'error'   - WebSocket error. Handler parameters: error
    //    'close'   - WebSocket connection closed. Handler parameters: code [Number], reason [String]
    //    'message' - Data received. Handler parameters: data [????]
    function WsNotifyChannel(apiClient, eventName) {
        this.apiClient = apiClient;
        this.eventName = eventName;
    }

    // Make NotifyChannel to inherit from EventEmitter
    _heir.inherit(WsNotifyChannel, _EventEmitter, true);

    WsNotifyChannel.prototype.open = function (cb) {
        // Make sure that WebSocket has not been instantiated yet
        if (this.ws === undefined) {
            // NOTE: this request is only used to retrieve that data used for authentication,
            //        which is done by sending ta message right after the connection is open.
            //        The actual request used to establish the WebSocket connection is (which
            //        has no authentication info) is created and sent by the WebSocket object
            var wsReq = getSignedWsConnectRequest.call(this);

            this.ws = new WebSocket(wsReq.url, notifyWsSubprotocol);

            var self = this;

            this.ws.addEventListener('open', function (open) {
                // Send authentication message
                var authMsgData = {};

                authMsgData[timestampHdr.toLocaleLowerCase()] = wsReq.headers[timestampHdr];
                authMsgData.authorization = wsReq.headers.Authorization;

                this.send(JSON.stringify(authMsgData));

                if (typeof cb === 'function') {
                    // Call callback to indicate that WebSocket connection is open
                    cb.call(self);
                }
            });

            this.ws.addEventListener('error', function (error) {
                if (this.readyState === WebSocket.CONNECTING) {
                    // Error while trying to open WebSocket connection
                    if (typeof cb === 'function') {
                        // Call callback passing the error
                        cb.call(self, error);

                        // Close the connection
                        this.close(1011);
                    }
                }
                else {
                    // Emit error event
                    self.emitEvent('error', [error]);

                    if (this.readyState !== WebSocket.CLOSING && this.readyState !== WebSocket.CLOSED) {
                        // Close the connection
                        this.close(1011);
                    }
                }
            });

            this.ws.addEventListener('close', function (close) {
                // Emit close event
                self.emitEvent('close', [close.code, close.reason]);

                // Terminate instantiated WebSocket
                self.ws = undefined;
            });

            this.ws.addEventListener('message', function (message) {
                // Emit message event passing the received data
                self.emitEvent('message', [message.data]);
            });
        }
    };

    WsNotifyChannel.prototype.close = function () {
        // Make sure that WebSocket is instantiated and open
        if (this.ws !== undefined && this.ws.readyState === WebSocket.OPEN) {
            // Close the WebSocket connection
            this.ws.close(1000);
        }
    };

    function getSignedWsConnectRequest() {
        var reqParams = {
            url: this.apiClient.rootWsNtfyEndPoint + '/' + this.eventName,
            type: "GET"
        };

        signRequest.call(this.apiClient, reqParams);

        return reqParams;
    }

    // Export function class
    context.CtnApiClient = ApiClient;
})(this || {});
