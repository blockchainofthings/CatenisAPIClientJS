describe('Test changes to Catenis API client ver. 5.0.0.', function  () {
    var device1 = {
        id: 'drc3XdxNtzoucpw9xiRp'
    };
    var device2 = {
        id: 'd8YpQ7jgPBJEkBrnvp58'
    };
    var accessKey1 = '4c1749c8e86f65e0a73e5fb19f2aa9e74a716bc22d7956bf3072b4bc3fbfe2a0d138ad0d4bcfee251e4e5f54d6e92b8fd4eb36958a7aeaeeb51e8d2fcc4552c3';
    var accessKey2 = '267a687115b9752f2eec5be849b570b29133528f928868d811bad5e48e97a1d62d432bab44803586b2ac35002ec6f0eeaa98bec79b64f2f69b9cb0935b4df2c4';
    var apiClient;
    var apiClient2;
    var randomNumber;
    var message;
    var messageId;

    beforeAll(function () {
        randomNumber = function () {
            return Math.floor(Math.random() * 1000000000);
        };

        // Instantiate Catenis API clients
        apiClient = new CatenisApiClient(
            device1.id,
            accessKey1, {
                host: 'localhost:3000',
                secure: false
            }
        );
        apiClient2 = new CatenisApiClient(
            device2.id,
            accessKey2, {
                host: 'localhost:3000',
                secure: false
            }
        );
    });

    it('Log a regular (non-off-chain) message', function (done) {
        message = 'Test message #' + randomNumber();

        apiClient.logMessage(message, {
            offChain: false
        }, function (error, data) {
            if (error) {
                done.fail('Error logging regular (non-off-chain) message: ' + error);
            }
            else {
                expect(data.messageId).toMatch(/^m\w{19}$/);
                messageId = data.messageId;
                done();
            }
        });
    });

    it('Retrieve container info of logged regular (non-off-chain) message', function (done) {
        apiClient.retrieveMessageContainer(messageId, function (error, data) {
            if (error) {
                done.fail('Error retrieving container info of logged regular (non-off-chain) message: ' + error);
            }
            else {
                expect(data.offChain).not.toBeDefined();
                done();
            }
        });
    });

    it('Read logged regular (non-off-chain) message', function (done) {
        apiClient.readMessage(messageId, function (error, data) {
            if (error) {
                done.fail('Error reading logged regular (non-off-chain) message: ' + error);
            }
            else {
                expect(data.msgData).toEqual(message);
                done();
            }
        });
    });

    it('Send regular (non-off-chain) message and wait for it to be received', function (done) {
        // Create WebSocket notification channel to be notified when a new message is received
        var wsNotifyChannel = apiClient2.createWsNotifyChannel('new-msg-received');
        var ntfyChannelClosed = false;

        // Wire notification event
        wsNotifyChannel.addListener('error', function (error) {
            done.fail('Error with WebSocket notification channel: ' + error);
        });

        wsNotifyChannel.addListener('close', function (code, reason) {
            if (!ntfyChannelClosed) {
                done.fail('WebSocket notification channel closed unexpectedly. [' + code + '] - ' + reason);
            }
        });

        wsNotifyChannel.addListener('notify', function(data) {
            // Notification received
            if (messageId) {
                // ID of sent message already returned. Check if this notification is for the correct message
                if (data.messageId === messageId) {
                    // If so, close notification channel, and end test case
                    ntfyChannelClosed = true;
                    wsNotifyChannel.close();
                    done();
                }
            }
            else {
                // ID of sent message not yet returned. Just save notification data
                ntfyData = data;
            }
        });

        wsNotifyChannel.addListener('open', function() {
            // WebSocket notification channel is open.
            //  Send off-chain message
            message = 'Test message #' + randomNumber();

            apiClient.sendMessage(message, device2, {
                offChain: false
            }, function (error, data) {
                if (error) {
                    done.fail('Error sending regular (non-off-chain) message: ' + error);
                }
                else {
                    // Message successfully sent. Check data consistency, and save message ID
                    expect(data.messageId).toMatch(/^m\w{19}$/);
                    messageId = data.messageId;

                    if (ntfyData) {
                        // Notification already received. Check if it was for this message
                        if (ntfyData.messageId === messageId) {
                            // If so, close notification channel, and end test case
                            ntfyChannelClosed = true;
                            wsNotifyChannel.close();
                            done();
                        }
                    }
                }
            });
        });

        messageId = undefined;
        ntfyData = undefined;

        // Open notification channel
        wsNotifyChannel.open(function (error) {
            if (error) {
                done.fail('Error opening WebSocket notification channel: ' + error);
            }
            else {
                // WebSocket client successfully connected. Wait for open event
            }
        });
    });

    it('Retrieve container info of sent regular (non-off-chain) message', function (done) {
        apiClient.retrieveMessageContainer(messageId, function (error, data) {
            if (error) {
                done.fail('Error retrieving container info of sent regular (non-off-chain) message: ' + error);
            }
            else {
                expect(data.offChain).not.toBeDefined();
                done();
            }
        });
    });

    it('Read sent regular (non-off-chain) message', function (done) {
        apiClient2.readMessage(messageId, function (error, data) {
            if (error) {
                done.fail('Error reading sent regular (non-off-chain) message: ' + error);
            }
            else {
                expect(data.msgData).toEqual(message);
                done();
            }
        });
    });

    it('Log an off-chain message', function (done) {
        ocMessage = 'Test message #' + randomNumber();

        apiClient.logMessage(ocMessage, function (error, data) {
            if (error) {
                done.fail('Error logging off-chain message: ' + error);
            }
            else {
                expect(data.messageId).toMatch(/^o\w{19}$/);
                ocMessageId = data.messageId;
                done();
            }
        });
    });

    it('Retrieve container info of logged off-chain message', function (done) {
        apiClient.retrieveMessageContainer(ocMessageId, function (error, data) {
            if (error) {
                done.fail('Error retrieving container info of logged off-chain message: ' + error);
            }
            else {
                expect(data.offChain).toBeDefined();
                expect(data.offChain.cid).toMatch(/^Qm\w{44}$/);
                done();
            }
        });
    });

    it('Read logged off-chain message', function (done) {
        apiClient.readMessage(ocMessageId, function (error, data) {
            if (error) {
                done.fail('Error reading logged off-chain message: ' + error);
            }
            else {
                expect(data.msgData).toEqual(ocMessage);
                done();
            }
        });
    });

    it('Send off-chain message and wait for it to be received', function (done) {
        // Create WebSocket notification channel to be notified when a new message is received
        var wsNotifyChannel = apiClient2.createWsNotifyChannel('new-msg-received');
        var ntfyChannelClosed = false;

        // Wire notification event
        wsNotifyChannel.addListener('error', function (error) {
            done.fail('Error with WebSocket notification channel: ' + error);
        });

        wsNotifyChannel.addListener('close', function (code, reason) {
            if (!ntfyChannelClosed) {
                done.fail('WebSocket notification channel closed unexpectedly. [' + code + '] - ' + reason);
            }
        });

        wsNotifyChannel.addListener('notify', function(data) {
            // Notification received
            if (ocMessageId) {
                // ID of sent message already returned. Check if this notification is for the correct message
                if (data.messageId === ocMessageId) {
                    // If so, close notification channel, and end test case
                    ntfyChannelClosed = true;
                    wsNotifyChannel.close();
                    done();
                }
            }
            else {
                // ID of sent message not yet returned. Just save notification data
                ntfyData = data;
            }
        });

        wsNotifyChannel.addListener('open', function() {
            // WebSocket notification channel is open.
            //  Send off-chain message
            ocMessage = 'Test message #' + randomNumber();

            apiClient.sendMessage(ocMessage, device2, {
                offChain: true
            }, function (error, data) {
                if (error) {
                    done.fail('Error sending off-chain message: ' + error);
                }
                else {
                    // Message successfully sent. Check data consistency, and save message ID
                    expect(data.messageId).toMatch(/^o\w{19}$/);
                    ocMessageId = data.messageId;

                    if (ntfyData) {
                        // Notification already received. Check if it was for this message
                        if (ntfyData.messageId === ocMessageId) {
                            // If so, close notification channel, and end test case
                            ntfyChannelClosed = true;
                            wsNotifyChannel.close();
                            done();
                        }
                    }
                }
            });
        });

        ocMessageId = undefined;
        ntfyData = undefined;

        // Open notification channel
        wsNotifyChannel.open(function (error) {
            if (error) {
                done.fail('Error opening WebSocket notification channel: ' + error);
            }
            else {
                // WebSocket client successfully connected. Wait for open event
            }
        });
    });

    it('Retrieve container info of sent off-chain message', function (done) {
        apiClient.retrieveMessageContainer(ocMessageId, function (error, data) {
            if (error) {
                done.fail('Error retrieving container info of sent off-chain message: ' + error);
            }
            else {
                expect(data.offChain).toBeDefined();
                expect(data.offChain.cid).toMatch(/^Qm\w{44}$/);
                done();
            }
        });
    });

    it('Read sent off-chain message', function (done) {
        apiClient2.readMessage(ocMessageId, function (error, data) {
            if (error) {
                done.fail('Error reading sent off-chain message: ' + error);
            }
            else {
                expect(data.msgData).toEqual(ocMessage);
                done();
            }
        });
    });
});