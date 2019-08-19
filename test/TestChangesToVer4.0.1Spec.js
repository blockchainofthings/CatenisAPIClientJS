describe('Test changes to Catenis API client ver. 4.0.1.', function  () {
    var device1 = {
        id: 'drc3XdxNtzoucpw9xiRp'
    };
    var device2 = {
        id: 'd8YpQ7jgPBJEkBrnvp58'
    };
    var accessKey1 = '544bca61a4116e15fd7bb7c3acb2eef2a1466635446e1aa3077b6a4931be51c4c620b87f1f8fdc3c7291f9dc32eb52f3e008755d3ecdaa57052188702c3fee61';
    var accessKey2 = '61281120a92dc6267af11170d161f64478b0a852f3cce4286b8a1b82afd2de7077472b6f7b93b6d554295d859815a37cb89f4f875b7aaeb0bd2babd9531c6883';
    var apiClient;
    var apiClient2;
    var wsNotifyChannel;
    var randomNumber;
    var startDate = new Date();
    var assetId;

    beforeAll(function () {
        randomNumber = function () {
            return  Math.floor(Math.random() * 1000000000);
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

        // Create WebSocket notification channel to indicate when message is received
        wsNotifyChannel = apiClient2.createWsNotifyChannel('new-msg-received');
    });

    it('Log a message', function (done) {
        apiClient.logMessage('Test message #' + randomNumber(), function (error) {
            if (error) {
                done.fail('Error logging message: ' + error);
            }
            else {
                done();
            }
        });
    });

    it('Issue new asset', function (done) {
        apiClient.issueAsset({
            name: 'Test_asset_#' + randomNumber(),
            canReissue: true,
            decimalPlaces: 0
        }, 50, function (error, data) {
            if (error) {
                done.fail('Error issuing asset: ' + error);
            }
            else {
                assetId = data.assetId;
                done();
            }
        });
    });

    it('Reissue asset', function (done) {
        apiClient.reissueAsset(assetId, 50, function (error, data) {
            if (error) {
                done.fail('Error reissuing asset: ' + error);
            }
            else {
                done();
            }
        });
    });

    it('Can open WebSocket notification channel', function (done) {
        // Wire notification event
        wsNotifyChannel.addListener('error', function (error) {
            done.fail('Error with WebSocket notification channel. Returned error: ' + error);
        });

        wsNotifyChannel.addListener('close', function (code, reason) {
            done.fail('WebSocket notification channel closed unexpectedly. [' + code + '] - ' + reason);
        });

        wsNotifyChannel.addListener('notify', function(data) {
            expect(data).toEqual(jasmine.any(Object));
            done();
        });

        wsNotifyChannel.addListener('open', function() {
            // WebSocket notification channel is open.
            //  Send a message
            apiClient.sendMessage('Test message #' + randomNumber(), device2, function (error) {
                if (error) {
                    done.fail('Error sending message: ' + error);
                }
            })
        });

        // Open notification channel
        wsNotifyChannel.open(function (error) {
            if (error) {
                done.fail('Error opening WebSocket notification channel. Returned error: ' + error);
            }
            else {
                // WebSocket client successfully connected. Wait for open event
            }
        });
    });

    it('List all messages', function (done) {
        apiClient.listMessages({
            startDate: startDate
        }, function (error, data) {
            if (error) {
                done.fail('Error listing messages: ' + error);
            }
            else {
                expect(data.msgCount).toBeGreaterThanOrEqual(2);
                expect(data.hasMore).toBe(false);
                done();
            }
        });
    });

    it('List messages retrieving only the first one', function (done) {
        apiClient.listMessages({
            startDate: startDate
        }, 1, function (error, data) {
            if (error) {
                done.fail('Error listing messages: ' + error);
            }
            else {
                expect(data.msgCount).toBe(1);
                expect(data.hasMore).toBe(true);
                done();
            }
        });
    });

    it('Retrieve all asset issuance history events', function (done) {
        apiClient.retrieveAssetIssuanceHistory(assetId, function (error, data) {
            if (error) {
                done.fail('Error retrieving asset issuance history: ' + error);
            }
            else {
                expect(data.issuanceEvents.length).toBe(2);
                expect(data.hasMore).toBe(false);
                done();
            }
        });
    });

    it('Retrieve only the first asset issuance history event', function (done) {
        apiClient.retrieveAssetIssuanceHistory(assetId, null, null, 1, function (error, data) {
            if (error) {
                done.fail('Error retrieving asset issuance history: ' + error);
            }
            else {
                expect(data.issuanceEvents.length).toBe(1);
                expect(data.hasMore).toBe(true);
                done();
            }
        });
    });
});