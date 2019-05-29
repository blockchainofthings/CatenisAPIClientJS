xdescribe('Test changes to Catenis API client ver. 3.0.0.', function  () {
    var device1 = {
        id: 'd8YpQ7jgPBJEkBrnvp58'
    };
    var device2 = {
        id: 'drc3XdxNtzoucpw9xiRp'
    };
    var accessKey1 = '61281120a92dc6267af11170d161f64478b0a852f3cce4286b8a1b82afd2de7077472b6f7b93b6d554295d859815a37cb89f4f875b7aaeb0bd2babd9531c6883';
    var apiClient;
    var messageId;
    var provisionalMessageId;

    beforeAll(function () {
        // Instantiate Catenis API clients
        apiClient = new CatenisApiClient(
            device1.id,
            accessKey1, {
                host: 'localhost:3000',
                secure: false
            }
        );
    });

    it('Call logMessage() method passing message as string', function (done) {
        apiClient.logMessage('Test message #1', function (error, data) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                messageId = data.messageId;
                done();
            }
        });
    });

    it('Call logMessage() method passing message as object', function (done) {
        apiClient.logMessage({
            data: 'Test message #2'
        }, function (error, data) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                done();
            }
        });
    });

    it('Call sendMessage() method passing message as string', function (done) {
        apiClient.sendMessage('Test message #3', device2, function (error, data) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                done();
            }
        });
    });

    it('Call sendMessage() method passing message as object', function (done) {
        apiClient.sendMessage({
            data: 'Test message #4'
        }, device2, function (error, data) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                done();
            }
        });
    });

    it('Call readMessage() method passing encoding as a parameter', function (done) {
        apiClient.readMessage(messageId, 'hex', function (error, data) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                expect(data.msgData).toBe('54657374206d657373616765202331');
                done();
            }
        });
    });

    it('Call readMessage() method passing encoding as a property of options parameter', function (done) {
        apiClient.readMessage(messageId, {
            encoding: 'hex'
        }, function (error, data) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                expect(data.msgData).toBe('54657374206d657373616765202331');
                done();
            }
        });
    });

    it('Call retrieveMessageProgress() method', function (done) {
        //  Log message asynchronously
        apiClient.logMessage('Test message #5', {
            async: true
        }, function (error, data) {
            if (error) {
                done.fail('Failed to log message asynchronously. Returned error: ' + error);
            }
            else {
                // Retrieve message progress
                apiClient.retrieveMessageProgress(data.provisionalMessageId, function (error) {
                    if (error) {
                        done.fail('API method call should not have failed. Returned error: ' + error);
                    }
                    else {
                        done();
                    }
                });
            }
        });
    });

    it('Receive notification for final-msg-progress notify event', function (done) {
        // Create WebSocket notification channel to be notified when asynchronous message
        //  processing progress has come to an end
        var wsNotifyChannel = apiClient.createWsNotifyChannel('final-msg-progress');

        // Wire notification event
        wsNotifyChannel.addListener('error', function (error) {
            done.fail('Error with WebSocket notification channel. Returned error: ' + error);
        });

        wsNotifyChannel.addListener('close', function (code, reason) {
            done.fail('WebSocket notification channel closed unexpectedly. [' + code + '] - ' + reason);
        });

        wsNotifyChannel.addListener('notify', function(data) {
            if (data.action === 'send') {
                expect(data.ephemeralMessageId).toBe(provisionalMessageId);
                done();
            }
        });

        // Open notification channel
        wsNotifyChannel.open(function (error) {
            if (error) {
                done.fail('Error opening WebSocket notification channel. Returned error: ' + error);
            }
            else {
                // WebSocket notification channel is open.
                //  SEnd message asynchronously
                apiClient.sendMessage('Test message #6', device2, {
                    async: true
                }, function (error, data) {
                    if (error) {
                        done.fail('Failed to log message asynchronously. Returned error: ' + error);
                    }
                    else {
                        // Save provisional message Id
                        provisionalMessageId = data.provisionalMessageId;
                    }
                });
            }
        });
    });
});