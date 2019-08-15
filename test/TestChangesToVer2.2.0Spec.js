describe('Test changes to Catenis API client ver. 2.2.0.', function  () {
    var device1 = {
        id: 'd8YpQ7jgPBJEkBrnvp58'
    };
    var device2 = {
        id: 'drc3XdxNtzoucpw9xiRp'
    };
    var accessKey1 = '61281120a92dc6267af11170d161f64478b0a852f3cce4286b8a1b82afd2de7077472b6f7b93b6d554295d859815a37cb89f4f875b7aaeb0bd2babd9531c6883';
    var apiClient;
    var messageId;
    var assetId;

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

    it('Call logMessage() method suppressing all optional parameters', function (done) {
        apiClient.logMessage('Test message', function (error, data) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                messageId = data.messageId;
                done();
            }
        });
    });

    it('Call sendMessage() method suppressing all optional parameters', function (done) {
        apiClient.sendMessage(device2, 'Test message', function (error, data) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                done();
            }
        });
    });

    it('Call readMessage() method suppressing all optional parameters', function (done) {
        apiClient.readMessage(messageId, function (error, data) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                done();
            }
        });
    });

    it('Call listMessages() method suppressing all optional parameters', function (done) {
        apiClient.listMessages(function (error, data) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                done();
            }
        });
    });

    it('Call checkEffectivePermissionRight() method suppressing all optional parameters', function (done) {
        apiClient.checkEffectivePermissionRight('receive-notify-new-msg', device2.id, function (error, data) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                done();
            }
        });
    });

    it('Call retrieveDeviceIdentificationInfo() method suppressing all optional parameters', function (done) {
        apiClient.retrieveDeviceIdentificationInfo(device1.id, function (error, data) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                done();
            }
        });
    });

    it('Call issueAsset() method suppressing all optional parameters', function (done) {
        apiClient.issueAsset({
            name: 'TestAsset',
            description: 'Asset created for unit test',
            canReissue: true,
            decimalPlaces: 2
        }, 1, function (error, data) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                assetId = data.assetId;
                done();
            }
        });
    });

    it('Call reissueAsset() method suppressing all optional parameters', function (done) {
        apiClient.reissueAsset(assetId, 1, function (error, data) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                done();
            }
        });
    });

    it('Call listOwnedAssets() method suppressing all optional parameters', function (done) {
        apiClient.listOwnedAssets(function (error, data) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                done();
            }
        });
    });

    it('Call listIssuedAssets() method suppressing all optional parameters', function (done) {
        apiClient.listIssuedAssets(function (error, data) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                done();
            }
        });
    });

    it('Call retrieveAssetIssuanceHistory() method suppressing all optional parameters', function (done) {
        apiClient.retrieveAssetIssuanceHistory(assetId, function (error, data) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                done();
            }
        });
    });

    it('Call listAssetHolders() method suppressing all optional parameters', function (done) {
        apiClient.listAssetHolders(assetId, function (error, data) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                done();
            }
        });
    });
});
