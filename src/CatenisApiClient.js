/**
 * Created by claudio on 28/03/17.
 */
(function (context) {
    // Save local reference to required third-party libraries
    var _jQuery = jQuery.noConflict(true),
        _moment = window.moment,
        _sjcl = window.sjcl,
        _heir = window.heir,
        _EventEmitter = EventEmitter.noConflict(),
        _pako = window.pako;

    // Restore third-party libraries that might have been loaded before this library was loaded
    //  NOTE: no need to do the same with the jQuery library because its noConflict() method
    //      (used above) already takes care of restoring any previous version that might had been
    //      loaded beforehand
    window.moment = context._ctnApiClientLibs.moment;
    window.sjcl = context._ctnApiClientLibs.sjcl;
    window.heir = context._ctnApiClientLibs.heir;
    window.pako = context._ctnApiClientLibs.pako;

    // Setting required for AJAX calls to work on Internet Explorer
    _jQuery.support.cors = true;

    var apiPath = '/api/',
        signVersionId = 'CTN1',
        signMethodId = 'CTN1-HMAC-SHA256',
        scopeRequest = 'ctn1_request',
        timestampHdr = 'X-BCoT-Timestamp',
        signValidDays = 7,
        notifyRootPath = 'notify',
        wsNtfyRootPath =  'ws',
        notifyWsSubprotocol = 'notify.catenis.io',
        notifyChannelOpenMsg = 'NOTIFICATION_CHANNEL_OPEN';

    // Api Client function class constructor
    //
    //  Parameters:
    //    deviceId: [String]            - (optional) Catenis device ID
    //    apiAccessSecret: [String]     - (optional) Catenis device's API access secret
    //    options [Object] (optional) {
    //      host: [String],              - (optional, default: 'catenis.io') Host name (with optional port) of target Catenis API server
    //      environment: [String],       - (optional, default: 'prod') Environment of target Catenis API server. Valid values: 'prod', 'sandbox' (or 'beta')
    //      secure: [Boolean],           - (optional, default: true) Indicates whether a secure connection (HTTPS) should be used
    //      version: [String],           - (optional, default: '0.10') Version of Catenis API to target
    //      useCompression: [Boolean],   - (optional, default: true) Indicates whether request body should be compressed. Note: modern
    //                                                               web browsers will always accept compressed request responses
    //      compressThreshold: [Number], - (optional, default: 1024) Minimum size, in bytes, of request body for it to be compressed
    //    }
    function ApiClient(deviceId, apiAccessSecret, options) {
        if (typeof deviceId === 'object' && deviceId !== null) {
            // No device ID, only options
            options = deviceId;
            deviceId = undefined;
            apiAccessSecret = undefined;
        }

        var _host = 'catenis.io';
        var _subdomain = '';
        var _secure = true;
        var _version = '0.10';

        this.useCompression = true;
        this.compressThreshold = 1024;

        if (typeof options === 'object' && options !== null) {
            _host = typeof options.host === 'string' && options.host.length > 0 ? options.host : _host;
            _subdomain = options.environment === 'sandbox' || options.environment === 'beta' ? 'sandbox.' : _subdomain;
            _secure = typeof options.secure === 'boolean' ? options.secure : _secure;
            _version = typeof options.version === 'string' && options.version.length > 0 ? options.version : _version;

            if (typeof options.useCompression === 'boolean' && !options.useCompression) {
                this.useCompression = false;
            }

            if (typeof options.compressThreshold == 'number' && options.compressThreshold >= 0) {
                this.compressThreshold = Math.floor(options.compressThreshold);
            }
        }

        this.host = _subdomain + _host;
        var uriPrefix = (_secure ? 'https://' : 'http://') + this.host;
        var apiBaseUriPath = apiPath + _version + '/';
        this.rootApiEndPoint = uriPrefix + apiBaseUriPath;
        this.deviceId = deviceId;
        this.apiAccessSecret = apiAccessSecret;
        this.lastSignDate = undefined;
        this.lastSignKey = undefined;
        var wsUriScheme = _secure ? 'wss://' : 'ws://';
        var wsUriPrefix = wsUriScheme + this.host;
        var wsNtfyBaseUriPath = apiBaseUriPath + notifyRootPath + (wsNtfyRootPath.length > 0 ? '/' : '') + wsNtfyRootPath;
        this.rootWsNtfyEndPoint = wsUriPrefix + wsNtfyBaseUriPath;
    }

    ApiClient.processReturn = function (callback, data, textStatus, errorThrown) {
        if (textStatus === 'success') {
            callback(undefined, typeof data === 'object' && data.data ? data.data : data);
        }
        else {
            // Check if this is a client or API error
            var jqXHR = data;
            var error;

            if (jqXHR.status >= 100) {
                error = new CatenisApiError(jqXHR.statusText, jqXHR.status, typeof jqXHR.responseJSON === 'object' && jqXHR.responseJSON !== null && jqXHR.responseJSON.message ? jqXHR.responseJSON.message : undefined);
            }
            else {
                if (errorThrown instanceof Error) {
                    error = errorThrown;
                }
                else {
                    error = new Error('Ajax error' + (textStatus ? ' (' + textStatus + ')' : '') + (typeof errorThrown === 'string' && errorThrown.length > 0 ? ': ' + errorThrown : ''));
                    error.jqXHR = jqXHR;
                }
            }

            callback(error);
        }
    };

    // Log a message
    //
    //  Parameters:
    //    message: [String|Object] {  - The message to store. If a string is passed, it is assumed to be the whole message's contents. Otherwise,
    //                                   it is expected that the message be passed in chunks using the following object to control it
    //      data: [String],              - (optional) The current message data chunk. The actual message's contents should be comprised of one or
    //                                      more data chunks. NOTE that, when sending a final message data chunk (isFinal = true and continuationToken
    //                                      specified), this parameter may either be omitted or have an empty string value
    //      isFinal: [Boolean],          - (optional, default: "true") Indicates whether this is the final (or the single) message data chunk
    //      continuationToken: [String]  - (optional) - Indicates that this is a continuation message data chunk. This should be filled with the value
    //                                      returned in the 'continuationToken' field of the response from the previously sent message data chunk
    //    options: [Object] (optional) {
    //      encoding: [String],   - (optional, default: "utf8") One of the following values identifying the encoding of the message: "utf8"|"base64"|"hex"
    //      encrypt:  [Boolean],  - (optional, default: true) Indicates whether message should be encrypted before storing. NOTE that, when message
    //                               is passed in chunks, this option is only taken into consideration (and thus only needs to be passed) for the
    //                               final message data chunk, and it shall be applied to the message's contents as a whole
    //      offChain: [Boolean],  - (optional, default: true) Indicates whether message should be processed as a Catenis off-chain message. Catenis off-chain messages
    //                               are stored on the external storage repository and only later its reference is settled to the blockchain along with references of
    //                               other off-chain messages. NOTE that, when message is passed in chunks, this option is only taken into consideration (and thus
    //                               only needs to be passed) for the final message data chunk, and it shall be applied to the message's contents as a whole
    //      storage: [String]     - (optional, default: "auto") One of the following values identifying where the message should be stored: "auto"|
    //                               "embedded"|"external". NOTE that, when message is passed in chunks, this option is only taken into consideration
    //                               (and thus only needs be passed) for the final message data chunk, and it shall be applied to the message's
    //                               contents as a whole. ALSO note that, when the offChain option is set to true, this option's value is disregarded
    //                               and the processing is done as if the value "external" was passed
    //      async: [Boolean]      - (optional, default: false) - Indicates whether processing (storage of message to the blockchain) should be
    //                               done asynchronously. If set to true, a provisional message ID is returned, which should be used to retrieve
    //                               the processing outcome by calling the MessageProgress API method. NOTE that, when message is passed in chunks,
    //                               this option is only taken into consideration (and thus only needs to be passed) for the final message data chunk,
    //                               and it shall be applied to the message's contents as a whole
    //    }
    //    callback: [Function]    - Callback function
    ApiClient.prototype.logMessage = function (message, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = undefined;
        }

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
    //    message: [String|Object] {  - The message to send. If a string is passed, it is assumed to be the whole message's contents. Otherwise, it is
    //                                   expected that the message be passed in chunks using the following object to control it
    //      data: [String],              - (optional) The current message data chunk. The actual message's contents should be comprised of one or more
    //                                      data chunks. NOTE that, when sending a final message data chunk (isFinal = true and continuationToken
    //                                      specified), this parameter may either be omitted or have an empty string value
    //      isFinal: [Boolean],          - (optional, default: "true") Indicates whether this is the final (or the single) message data chunk
    //      continuationToken: [String]  - (optional) - Indicates that this is a continuation message data chunk. This should be filled with the value
    //                                      returned in the 'continuationToken' field of the response from the previously sent message data chunk
    //    targetDevice: [Object] (optional) { - The target device. Note that, when message is passed in chunks, this parameter is only taken into
    //                                          consideration (and thus only needs to be passed) for the final message data chunk; for all previous
    //                                          message data chunks, it can be omitted. Otherwise, this is a required parameter
    //      id: [String],               - ID of target device. Should be Catenis device ID unless isProdUniqueId is true
    //      isProdUniqueId: [Boolean]   - (optional, default: false) Indicate whether supplied ID is a product unique ID (otherwise, it should be a
    //                                     Catenis device Id)
    //    },
    //    options: [Object] (optional) {
    //      encoding: [String],          - (optional, default: "utf8") One of the following values identifying the encoding of the message: "utf8"|"base64"|"hex"
    //      encrypt:  [Boolean],         - (optional, default: true) Indicates whether message should be encrypted before storing. NOTE that, when message
    //                                      is passed in chunks, this option is only taken into consideration (and thus only needs to be passed) for the
    //                                      final message data chunk, and it shall be applied to the message's contents as a whole
    //      offChain: [Boolean],         - (optional, default: true) Indicates whether message should be processed as a Catenis off-chain message. Catenis off-chain messages
    //                                      are stored on the external storage repository and only later its reference is settled to the blockchain along with references of
    //                                      other off-chain messages. NOTE that, when message is passed in chunks, this option is only taken into consideration (and thus
    //                                      only needs to be passed) for the final message data chunk, and it shall be applied to the message's contents as a whole
    //      storage: [String]            - (optional, default: "auto") One of the following values identifying where the message should be stored: "auto"|
    //                                      "embedded"|"external". NOTE that, when message is passed in chunks, this option is only taken into consideration
    //                                      (and thus only needs be passed) for the final message data chunk, and it shall be applied to the message's
    //                                      contents as a whole. ALSO note that, when the offChain option is set to true, this option's value is disregarded
    //                                      and the processing is done as if the value "external" was passed
    //      readConfirmation: [Boolean], - (optional, default: false) Indicates whether message should be sent with read confirmation enabled.
    //                                      NOTE that, when message is passed in chunks, this option is only taken into consideration (and thus only needs
    //                                      be passed) for the final message data chunk, and it shall be applied to the message's contents as a whole
    //      async: [Boolean]             - (optional, default: false) - Indicates whether processing (storage of message to the blockchain) should be done
    //                                      asynchronously. If set to true, a provisional message ID is returned, which should be used to retrieve the
    //                                      processing outcome by calling the MessageProgress API method. NOTE that, when message is passed in chunks,
    //                                      this option is only taken into consideration (and thus only needs to be passed) for the final message data
    //                                      chunk, and it shall be applied to the message's contents as a whole
    //    }
    //    callback: [Function]          - Callback function
    ApiClient.prototype.sendMessage = function (message, targetDevice, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = undefined;
        }

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
    //    options: [String|Object] (optional) { - If a string is passed, it is assumed to be the value for the (single) 'encoding' option
    //      encoding: [String]          - (optional, default: "utf8") One of the following values identifying the encoding that should be used for the
    //                                     returned message: utf8|base64|hex
    //      continuationToken [String]  - (optional) Indicates that this is a continuation call and that the following message data chunk should be returned
    //      dataChunkSize [Number]      - (optional) Size, in bytes, of the largest message data chunk that should be returned. This is effectively used
    //                                     to signal that the message should be retrieved/read in chunks. NOTE that this option is only taken into
    //                                     consideration (and thus only needs to be passed) for the initial call to this API method with a given message
    //                                     ID (no continuation token), and it shall be applied to the message's contents as a whole
    //      async [Boolean]             - (default: false) Indicates whether processing (retrieval of message from the blockchain) should be done
    //                                     asynchronously. If set to true, a cached message ID is returned, which should be used to retrieve the processing
    //                                     outcome by calling the Retrieve Message Progress API method. NOTE that this option is only taken into
    //                                     consideration (and thus only needs to be passed) for the initial call to this API method with a given message
    //                                     ID (no continuation token), and it shall be applied to the message's contents as a whole
    //    }
    //    callback: [Function]  - Callback function
    ApiClient.prototype.readMessage = function (messageId, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = undefined;
        }

        var params = {
            url: [
                messageId
            ]
        };

        if (options) {
            if (typeof options === 'string') {
                params.query = {
                    encoding: options
                };
            }
            else if (typeof options === 'object') {
                params.query = filterDefinedProperties(options);
            }
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

    // Retrieve message origin
    //
    //  Parameters:
    //    messageId: [String]   - ID of message to retrieve container info
    //    msgToSign: [string]   - (optional) A message (any text) to be signed using the Catenis message's origin device's private key.
    //                             The resulting signature can then later be independently verified to prove the Catenis message origin
    //    callback: [Function]  - Callback function
    ApiClient.prototype.retrieveMessageOrigin = function (messageId, msgToSign, callback) {
        if (typeof msgToSign === 'function') {
            callback = msgToSign;
            msgToSign = undefined;
        }

        var params = {
            url: [
                messageId
            ]
        };

        if (msgToSign) {
            params.query = {
                msgToSign: msgToSign
            };
        }

        var procFunc = ApiClient.processReturn.bind(undefined, callback);

        getRequest.call(this, 'messages/:messageId/origin', params, {
            success: procFunc,
            error: procFunc
        }, true);
    };

    // Retrieve asynchronous message processing progress
    //
    //  Parameters:
    //    messageId: [String]   - ID of ephemeral message (either a provisional or a cached message) for which to return processing progress
    //    callback: [Function]  - Callback function
    ApiClient.prototype.retrieveMessageProgress = function (messageId, callback) {
        var params = {
            url: [
                messageId
            ]
        };

        var procFunc = ApiClient.processReturn.bind(undefined, callback);

        getRequest.call(this, 'messages/:messageId/progress', params, {
            success: procFunc,
            error: procFunc
        });
    };

    // List messages
    //
    //  Parameters:
    //    selector: [Object] (optional) {
    //      action: [String],                 - (optional, default: "any") - One of the following values specifying the action originally performed on
    //                                           the messages intended to be retrieved: "log"|"send"|"any"
    //      direction: [String],              - (optional, default: "any") - One of the following values specifying the direction of the sent messages
    //                                           intended to be retrieve: "inbound"|"outbound"|"any". Note that this option only applies to
    //                                           sent messages (action = "send"). "inbound" indicates messages sent to the device that issued
    //                                           the request, while "outbound" indicates messages sent from the device that issued the request
    //      fromDevices: [Array(Object)] [{   - (optional) - List of devices from which the messages intended to be retrieved had been sent. Note that this
    //                                           option only applies to messages sent to the device that issued the request (action = "send" and direction = "inbound")
    //          id: [String],                    - ID of the device. Can optionally be replaced with value "self" to refer to the ID of the device itself
    //          isProdUniqueId [Boolean]         - (optional, default: false) Indicate whether supplied ID is a product unique ID (otherwise, if should be a Catenis device Id)
    //      }],
    //      toDevices: [Array(Object)] [{     - (optional) - List of devices to which the messages intended to be retrieved had been sent. Note that this
    //                                           option only applies to messages sent to the device that issued the request (action = "send" and direction = "inbound")
    //          id: [String],                    - ID of the device. Can optionally be replaced with value "self" to refer to the ID of the device itself
    //          isProdUniqueId [Boolean]         - (optional, default: false) Indicate whether supplied ID is a product unique ID (otherwise, if should be a Catenis device Id)
    //      }],
    //      readState: [String],              - (optional, default: "any") - One of the following values indicating the current read state of the
    //                                           the messages intended to be retrieved: "unread"|"read"|"any".
    //      startDate: [String|Object(Date)], - (optional) - Date and time specifying the lower boundary of the time frame within
    //                                           which the messages intended to be retrieved has been: logged, in case of messages logged
    //                                           by the device that issued the request (action = "log"); sent, in case of messages sent from the current
    //                                           device (action = "send" direction = "outbound"); or received, in case of messages sent to
    //                                           the device that issued the request (action = "send" and direction = "inbound")
    //                                           Note: if a string is passed, it should be an ISO8601 formatter date/time
    //      endDate: [String|Object(Date)]    - (optional) - Date and time specifying the upper boundary of the time frame within
    //                                           which the messages intended to be retrieved has been: logged, in case of messages logged
    //                                           by the device that issued the request (action = "log"); sent, in case of messages sent from the current
    //                                           device (action = "send" direction = "outbound"); or received, in case of messages sent to
    //                                           the device that issued the request (action = "send" and direction = "inbound")
    //                                           Note: if a string is passed, it should be an ISO8601 formatter date/time
    //    }
    //    limit: [Number]  - (default: 500) Maximum number of messages that should be returned
    //    skip: [Number]   - (default: 0) Number of messages that should be skipped (from beginning of list of matching messages) and not returned
    //    callback: [Function]  - Callback function
    ApiClient.prototype.listMessages = function (selector, limit, skip, callback) {
        if (typeof selector === 'function') {
            callback = selector;
            selector = undefined;
            limit = undefined;
            skip = undefined;
        }
        else if (typeof limit === 'function') {
            callback = limit;
            limit = undefined;
            skip = undefined;
        }
        else if (typeof skip === 'function') {
            callback = skip;
            skip = undefined;
        }

        var params = undefined;

        if (selector) {
            params = {
                query: {}
            };

            if (selector.action) {
                params.query.action = selector.action;
            }

            if (selector.direction) {
                params.query.direction = selector.direction;
            }

            if (Array.isArray(selector.fromDevices)) {
                var fromDeviceIds = [];
                var fromDeviceProdUniqueIds = [];

                selector.fromDevices.forEach(function (device) {
                    if (typeof device === 'object' && device !== null && typeof device.id === 'string' && device.id.length > 0) {
                        if (device.isProdUniqueId && !!device.isProdUniqueId) {
                            // This is actually a product unique ID. So add it to the proper list
                            fromDeviceProdUniqueIds.push(device.id);
                        }
                        else {
                            fromDeviceIds.push(device.id);
                        }
                    }
                });

                if (fromDeviceIds.length > 0) {
                    // Add list of from device IDs
                    params.query.fromDeviceIds = fromDeviceIds.join(',');
                }

                if (fromDeviceProdUniqueIds.length > 0) {
                    params.query.fromDeviceProdUniqueIds = fromDeviceProdUniqueIds.join(',');
                }
            }

            if (Array.isArray(selector.toDevices)) {
                var toDeviceIds = [];
                var toDeviceProdUniqueIds = [];

                selector.toDevices.forEach(function (device) {
                    if (typeof device === 'object' && device !== null && typeof device.id === 'string' && device.id.length > 0) {
                        if (device.isProdUniqueId && !!device.isProdUniqueId) {
                            // This is actually a product unique ID. So add it to the proper list
                            toDeviceProdUniqueIds.push(device.id);
                        }
                        else {
                            toDeviceIds.push(device.id);
                        }
                    }
                });

                if (toDeviceIds.length > 0) {
                    // Add list of to device IDs
                    params.query.toDeviceIds = toDeviceIds.join(',');
                }

                if (toDeviceProdUniqueIds.length > 0) {
                    params.query.toDeviceProdUniqueIds = toDeviceProdUniqueIds.join(',');
                }
            }

            if (selector.readState) {
                params.query.readState = selector.readState;
            }

            if (selector.startDate) {
                if (typeof selector.startDate === 'string' && selector.startDate.length > 0) {
                    params.query.startDate = selector.startDate;
                }
                else if (selector.startDate instanceof Date) {
                    params.query.startDate = selector.startDate.toISOString();
                }
            }

            if (selector.endDate) {
                if (typeof selector.endDate === 'string' && selector.endDate.length > 0) {
                    params.query.endDate = selector.endDate;
                }
                else if (selector.endDate instanceof Date) {
                    params.query.endDate = selector.endDate.toISOString();
                }
            }
        }

        if (limit) {
            if (!params) {
                params = {
                    query: {}
                };
            }

            params.query.limit = limit;
        }

        if (skip) {
            if (!params) {
                params = {
                    query: {}
                };
            }

            params.query.skip = skip;
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
    //        deny: [Array(String)|String],   - (optional) List of IDs (or a single ID) of clients to give deny right
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
    //    isProdUniqueId: [Boolean] - (optional, default: false) Indicates whether the deviceId parameter should be interpreted as a product unique ID (otherwise, it is interpreted as a Catenis device Id)
    //    callback: [Function]      - Callback function
    ApiClient.prototype.checkEffectivePermissionRight = function (eventName, deviceId, isProdUniqueId, callback) {
        if (typeof isProdUniqueId === 'function') {
            callback = isProdUniqueId;
            isProdUniqueId = undefined;
        }

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
    //    isProdUniqueId: [Boolean] - (optional, default: false) Indicates whether the deviceId parameter should be interpreted as a product unique ID (otherwise, it is interpreted as a Catenis device Id)
    //    callback: [Function]      - Callback function
    ApiClient.prototype.retrieveDeviceIdentificationInfo = function (deviceId, isProdUniqueId, callback) {
        if (typeof isProdUniqueId === 'function') {
            callback = isProdUniqueId;
            isProdUniqueId = undefined;
        }

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

    // Issue an amount of a new asset
    //
    //  Parameters:
    //    assetInfo: {         - Information for creating new asset
    //      name: [String],           - The name of the asset
    //      description: [String],    - (optional) The description of the asset
    //      canReissue: [Boolean],    - Indicates whether more units of this asset can be issued at another time (an unlocked asset)
    //      decimalPlaces: [Number]   - The number of decimal places that can be used to specify a fractional amount of this asset
    //    }
    //    amount: [Number]     - Amount of asset to be issued (expressed as a fractional amount)
    //    holdingDevice: {     - (optional, default: device that issues the request) Device for which the asset is issued and that shall hold the total issued amount
    //      id: [String],             - ID of holding device. Should be a Catenis device ID unless isProdUniqueId is true
    //      isProdUniqueId: [Boolean] - (optional, default: false) Indicate whether supplied ID is a product unique ID (otherwise,
    //                                   it should be a Catenis device Id)
    //    }
    //    callback: [Function] - Callback function
    ApiClient.prototype.issueAsset = function (assetInfo, amount, holdingDevice, callback) {
        if (typeof holdingDevice === 'function') {
            callback = holdingDevice;
            holdingDevice = undefined;
        }

        var data = {
            assetInfo: assetInfo,
            amount: amount
        };

        if (holdingDevice) {
            data.holdingDevice = holdingDevice;
        }

        var procFunc = ApiClient.processReturn.bind(undefined, callback);

        postRequest.call(this, 'assets/issue', undefined, data, {
            success: procFunc,
            error: procFunc
        })
    };

    // Issue an additional amount of an existing asset
    //
    //  Parameters:
    //    assetId [String]     - ID of asset to issue more units of it
    //    amount: [Number]     - Amount of asset to be issued (expressed as a fractional amount)
    //    holdingDevice: {     - (optional, default: device that issues the request) Device for which the asset is issued and that shall hold the total issued amount
    //      id: [String],              - ID of holding device. Should be a Catenis device ID unless isProdUniqueId is true
    //      isProdUniqueId: [Boolean]  - (optional, default: false) Indicate whether supplied ID is a product unique ID (otherwise,
    //                                    it should be a Catenis device Id)
    //    }
    //    callback: [Function] - Callback function
    ApiClient.prototype.reissueAsset = function (assetId, amount, holdingDevice, callback) {
        if (typeof holdingDevice === 'function') {
            callback = holdingDevice;
            holdingDevice = undefined;
        }

        var params = {
            url: [
                assetId
            ]
        };

        var data = {
            amount: amount
        };

        if (holdingDevice) {
            data.holdingDevice = holdingDevice;
        }

        var procFunc = ApiClient.processReturn.bind(undefined, callback);

        postRequest.call(this, 'assets/:assetId/issue', params, data, {
            success: procFunc,
            error: procFunc
        })
    };

    // Transfer an amount of an asset to a device
    //
    //  Parameters:
    //    assetId [String]     - ID of asset to transfer
    //    amount: [Number]     - Amount of asset to be transferred (expressed as a fractional amount)
    //    receivingDevice: {   - Device to which the asset is to be transferred
    //      id: [String],              - ID of receiving device. Should be a Catenis device ID unless isProdUniqueId is true
    //      isProdUniqueId: [Boolean]  - (optional, default: false) Indicate whether supplied ID is a product unique ID (otherwise,
    //                                     it should be a Catenis device Id)
    //    },
    //    callback: [Function] - Callback function
    ApiClient.prototype.transferAsset = function (assetId, amount, receivingDevice, callback) {
        var params = {
            url: [
                assetId
            ]
        };

        var data = {
            amount: amount,
            receivingDevice: receivingDevice
        };

        var procFunc = ApiClient.processReturn.bind(undefined, callback);

        postRequest.call(this, 'assets/:assetId/transfer', params, data, {
            success: procFunc,
            error: procFunc
        })
    };

    // Retrieve information about a given asset
    //
    //  Parameters:
    //    assetId [String]     - ID of asset to retrieve information
    //    callback: [Function] - Callback function
    ApiClient.prototype.retrieveAssetInfo = function (assetId, callback) {
        var params = {
            url: [
                assetId
            ]
        };

        var procFunc = ApiClient.processReturn.bind(undefined, callback);

        getRequest.call(this, 'assets/:assetId', params, {
            success: procFunc,
            error: procFunc
        });
    };

    // Get the current balance of a given asset held by the device
    //
    //  Parameters:
    //    assetId [String]     - ID of asset to get balance
    //    callback: [Function] - Callback function
    ApiClient.prototype.getAssetBalance = function (assetId, callback) {
        var params = {
            url: [
                assetId
            ]
        };

        var procFunc = ApiClient.processReturn.bind(undefined, callback);

        getRequest.call(this, 'assets/:assetId/balance', params, {
            success: procFunc,
            error: procFunc
        });
    };

    // List assets owned by the device
    //
    //  Parameters:
    //    limit: [Number]      - (optional, default: 500) Maximum number of list items that should be returned
    //    skip: [Number]       - (optional, default: 0) Number of list items that should be skipped (from beginning of list) and not returned
    //    callback: [Function] - Callback function
    ApiClient.prototype.listOwnedAssets = function (limit, skip, callback) {
        if (typeof limit === 'function') {
            callback = limit;
            limit = undefined;
            skip = undefined;
        }
        else if (typeof skip === 'function') {
            callback = skip;
            skip = undefined;
        }

        var params = undefined;

        if (limit) {
            params = {
                query: {
                    limit: limit
                }
            };
        }

        if (skip) {
            if (!params) {
                params = {
                    query: {}
                };
            }

            params.query.skip = skip;
        }

        var procFunc = ApiClient.processReturn.bind(undefined, callback);

        getRequest.call(this, 'assets/owned', params, {
            success: procFunc,
            error: procFunc
        });
    };

    // List assets issued by the device
    //
    //  Parameters:
    //    limit: [Number]      - (optional, default: 500) Maximum number of list items that should be returned
    //    skip: [Number]       - (optional, default: 0) Number of list items that should be skipped (from beginning of list) and not returned
    //    callback: [Function] - Callback function
    ApiClient.prototype.listIssuedAssets = function (limit, skip, callback) {
        if (typeof limit === 'function') {
            callback = limit;
            limit = undefined;
            skip = undefined;
        }
        else if (typeof skip === 'function') {
            callback = skip;
            skip = undefined;
        }

        var params = undefined;

        if (limit) {
            params = {
                query: {
                    limit: limit
                }
            };
        }

        if (skip) {
            if (!params) {
                params = {
                    query: {}
                };
            }

            params.query.skip = skip;
        }

        var procFunc = ApiClient.processReturn.bind(undefined, callback);

        getRequest.call(this, 'assets/issued', params, {
            success: procFunc,
            error: procFunc
        });
    };

    // Retrieve issuance history for a given asset
    //
    //  Parameters:
    //    assetId [String] - ID of asset to retrieve issuance history
    //    startDate [String|Object(Date)] - (optional) Date and time specifying the lower boundary of the time frame within
    //                                       which the issuance events intended to be retrieved have occurred. The returned
    //                                       issuance events must have occurred not before that date/time
    //                                       Note: if a string is passed, it should be an ISO8601 formatter date/time
    //    endDate [String|Object(Date)]   - (optional) Date and time specifying the upper boundary of the time frame within
    //                                       which the issuance events intended to be retrieved have occurred. The returned
    //                                       issuance events must have occurred not after that date/time
    //                                       Note: if a string is passed, it should be an ISO8601 formatter date/time
    //    limit: [Number] - (default: 500) Maximum number of asset issuance events that should be returned
    //    skip: [Number]  - (default: 0) Number of asset issuance events that should be skipped (from beginning of list of matching events) and not returned
    //    callback: [Function]      - Callback function
    ApiClient.prototype.retrieveAssetIssuanceHistory = function (assetId, startDate, endDate, limit, skip, callback) {
        if (typeof startDate === 'function') {
            callback = startDate;
            startDate = undefined;
            endDate = undefined;
            limit = undefined;
            skip = undefined;
        }
        else if (typeof endDate === 'function') {
            callback = endDate;
            endDate = undefined;
            limit = undefined;
            skip = undefined;
        }
        else if (typeof limit === 'function') {
            callback = limit;
            limit = undefined;
            skip = undefined;
        }
        else if (typeof skip === 'function') {
            callback = skip;
            skip = undefined;
        }

        var params = {
            url: [
                assetId
            ]
        };

        if (startDate) {
            if (typeof startDate === 'string' && startDate.length > 0) {
                params.query = {
                    startDate: startDate
                };
            }
            else if (startDate instanceof Date) {
                params.query = {
                    startDate: startDate.toISOString()
                }
            }
        }

        if (endDate) {
            if (typeof endDate === 'string' && endDate.length > 0) {
                if (!params.query) {
                    params.query = {};
                }

                params.query.endDate = endDate;
            }
            else if (endDate instanceof Date) {
                if (!params.query) {
                    params.query = {};
                }

                params.query.endDate = endDate.toISOString();
            }
        }

        if (limit) {
            if (!params.query) {
                params.query = {};
            }

            params.query.limit = limit;
        }

        if (skip) {
            if (!params.query) {
                params.query = {};
            }

            params.query.skip = skip;
        }

        var procFunc = ApiClient.processReturn.bind(undefined, callback);

        getRequest.call(this, 'assets/:assetId/issuance', params, {
            success: procFunc,
            error: procFunc
        });
    };

    // List devices that currently hold any amount of a given asset
    //
    //  Parameters:
    //    assetId [String]     - ID of asset to get holders
    //    limit: [Number]      - (optional, default: 500) Maximum number of list items that should be returned
    //    skip: [Number]       - (optional, default: 0) Number of list items that should be skipped (from beginning of list) and not returned
    //    callback: [Function] - Callback function
    ApiClient.prototype.listAssetHolders = function (assetId, limit, skip, callback) {
        if (typeof limit === 'function') {
            callback = limit;
            limit = undefined;
            skip = undefined;
        }
        else if (typeof skip === 'function') {
            callback = skip;
            skip = undefined;
        }

        var params = {
            url: [
                assetId
            ]
        };

        if (limit) {
            params.query = {
                limit: limit
            };
        }

        if (skip) {
            if (!params.query) {
                params.query = {};
            }

            params.query.skip = skip;
        }

        var procFunc = ApiClient.processReturn.bind(undefined, callback);

        getRequest.call(this, 'assets/:assetId/holders', params, {
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

    function assembleMethodEndPointUrl(methodPath, params) {
        // Make sure that duplicate slashes that might occur in the URL (due to empty URL parameters)
        //  are reduced to a single slash so the URL used for signing is not different from the
        //  actual URL of the sent request
        return this.rootApiEndPoint + formatMethodPath(methodPath, params).replace(/\/{2,}/g,'/');
    }

    function postRequest(methodPath, params, data, result, doNotSign) {
        var reqParams = {
            url: assembleMethodEndPointUrl.call(this, methodPath, params),
            contentType: "application/json",
            processData: false,
            data: JSON.stringify(data),
            type: "POST",
            success: result.success,
            error: result.error
        };

        // NOTE: modern web browsers will always set the 'Accept-Encoding' header of AJAX requests
        //        to accept compressed request responses and will not allow it to be overwritten
        if (this.useCompression && utf8ByteLength(reqParams.data) >= this.compressThreshold) {
            reqParams.headers = {};
            reqParams.headers['Content-Encoding'] = 'deflate';

            reqParams.data = _pako.deflate(reqParams.data);
        }

        if (!doNotSign) {
            signRequest.call(this, reqParams);
        }

        _jQuery.ajax(reqParams);
    }

    function getRequest(methodPath, params, result, doNotSign) {
        var reqParams = {
            url: assembleMethodEndPointUrl.call(this, methodPath, params),
            type: "GET",
            success: result.success,
            error: result.error
        };

        // NOTE: modern web browsers will always set the 'Accept-Encoding' header of AJAX requests
        //        to accept compressed request responses and will not allow it to be overwritten

        if (!doNotSign) {
            signRequest.call(this, reqParams);
        }

        _jQuery.ajax(reqParams);
    }

    function utf8ByteLength(str) {
        return unescape(encodeURIComponent(str)).length;
    }

    function signRequest(reqParams) {
        // Add timestamp header
        var now = _moment();
        var timestamp = now.utc().format('YYYYMMDDTHHmmss[Z]');
        var useSameSignKey;

        if (this.lastSignDate && now.diff(this.lastSignDate, 'days') < signValidDays) {
            useSameSignKey = !!this.lastSignKey;
        }
        else {
            this.lastSignDate = now;
            useSameSignKey = false;
        }

        var signDate = this.lastSignDate.utc().format('YYYYMMDD');

        reqParams.headers = reqParams.headers || {};
        reqParams.headers[timestampHdr] = timestamp;

        // First step: compute conformed request
        var confReq = reqParams.type + '\n';
        confReq += reqParams.url.substr(reqParams.url.search(apiPath)) + '\n';

        var essentialHeaders = 'host:' + this.host + '\n';
        essentialHeaders += timestampHdr.toLowerCase() + ':' + reqParams.headers[timestampHdr] + '\n';

        confReq += essentialHeaders + '\n';
        confReq += hashData(reqParams.data || '') + '\n';

        // Second step: assemble string to sign
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
        if (data instanceof Uint8Array) {
            data = _sjcl.codec.arrayBuffer.toBits(data.buffer);
        }

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

    function filterDefinedProperties(obj) {
        if (typeof obj === 'object' && obj !== null) {
            var filteredObj = {};

            Object.keys(obj).forEach(function (key) {
                if (obj[key] !== undefined) {
                    filteredObj[key] = obj[key];
                }
            });

            obj = filteredObj;
        }

        return obj;
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
                if (message.data === notifyChannelOpenMsg) {
                    // Special notification channel open message. Emit open event indicating that
                    //  notification channel is successfully open and ready to send notifications
                    self.emitEvent('open');
                }
                else {
                    // Emit message event passing the received data (as a JSON string)
                    // NOTE: this event is DEPRECATED (in favour of the new 'notify' event) and should be
                    //        removed in future versions of the library
                    self.emitEvent('message', [message.data]);
                    // Emit notify event passing the received data (as a deserialized JSON object)
                    self.emitEvent('notify', [JSON.parse(message.data)]);
                }
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

    // CatenisAPIError class
    //
    function CatenisApiError(httpStatusMessage, httpStatusCode, ctnErrorMessage) {
        var instance = new Error('Error returned from Catenis API endpoint: [' + httpStatusCode + '] ' + (ctnErrorMessage ? ctnErrorMessage : httpStatusMessage));

        instance.name = 'CatenisApiError';
        instance.httpStatusMessage = httpStatusMessage;
        instance.httpStatusCode = httpStatusCode;
        instance.ctnErrorMessage = ctnErrorMessage;

        Object.setPrototypeOf(instance, Object.getPrototypeOf(this));
        if (Error.captureStackTrace) {
            Error.captureStackTrace(instance, CatenisApiError);
        }

        return instance;
    }

    CatenisApiError.prototype = Object.create(Error.prototype, {
        constructor: {
            value: Error,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });

    if (Object.setPrototypeOf){
        Object.setPrototypeOf(CatenisApiError, Error);
    } else {
        CatenisApiError.__proto__ = Error;
    }

    // Export function classes
    context.CatenisApiClient = ApiClient;
    context.CatenisApiError = CatenisApiError;
})(this || {});
