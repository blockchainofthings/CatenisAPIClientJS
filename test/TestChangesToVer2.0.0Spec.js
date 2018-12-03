// Instantiate Catenis API client
var apiClient = new CtnApiClient(
    'd8YpQ7jgPBJEkBrnvp58',
    '61281120a92dc6267af11170d161f64478b0a852f3cce4286b8a1b82afd2de7077472b6f7b93b6d554295d859815a37cb89f4f875b7aaeb0bd2babd9531c6883', {
        host: 'localhost:3000',
        secure: false
    }
);

describe('Test changes to Catenis API client ver. 2.0.0.', function  () {
    it('Call API method with empty URL parameter', function (done) {
        apiClient.retrieveMessageContainer('', function (error, result) {
            if (error) {
                expect(error.message).toBe('Error returned from Catenis API endpoint: [400] Invalid message ID');
                done();
            }
            else {
                done.fail('API method call should have failed');
            }
        })
    });

    it('Call List Messages API method with from devices filter with device ID', function (done) {
        apiClient.listMessages({
            action: 'send',
            direction: 'inbound',
            fromDevices: [{
                id: 'drc3XdxNtzoucpw9xiRP'
            }]
        }, function (error, result) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                done();
            }
        });
    });

    it('Call List Messages API method with from devices filter with product unique ID', function (done) {
        apiClient.listMessages({
            action: 'send',
            direction: 'outbound',
            fromDevices: [{
                id: 'drc3XdxNtzoucpw9xiRP',
                isProdUniqueId: true
            }]
        }, function (error, result) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                done();
            }
        });
    });

    it('Call List Messages API method with to devices filter with device ID', function (done) {
        apiClient.listMessages({
            action: 'send',
            direction: 'outbound',
            toDevices: [{
                id: 'drc3XdxNtzoucpw9xiRP'
            }]
        }, function (error, result) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                done();
            }
        });
    });

    it('Call List Messages API method with to devices filter with product unique ID', function (done) {
        apiClient.listMessages({
            action: 'send',
            direction: 'inbound',
            toDevices: [{
                id: 'drc3XdxNtzoucpw9xiRP',
                isProdUniqueId: true
            }]
        }, function (error, result) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                done();
            }
        });
    });

    it('Call List Messages API method with invalid start date', function (done) {
        apiClient.listMessages({startDate: 'jjjfjlkjla'}, function (error, result) {
            if (error) {
                expect(error.message).toBe('Error returned from Catenis API endpoint: [400] Invalid parameters');
                done();
            }
            else {
                done.fail('API method call should have failed');
            }
        });
    });

    it('Call List Messages API method with invalid start date', function (done) {
        apiClient.listMessages({endDate: 'fjdajfjlaj'}, function (error, result) {
            if (error) {
                expect(error.message).toBe('Error returned from Catenis API endpoint: [400] Invalid parameters');
                done();
            }
            else {
                done.fail('API method call should have failed');
            }
        });
    });

    it('Call List Messages API method with ISO8601 formatted dates', function (done) {
        apiClient.listMessages({startDate: '2018-11-29', endDate: '2018-11-29'}, function (error, result) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                done();
            }
        });
    });

    it('Call List Messages API method with Date objects', function (done) {
        apiClient.listMessages({startDate: new Date(), endDate: new Date()}, function (error, result) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                done();
            }
        });
    });

    it('Call Retrieve Asset Issuance History API method with invalid start date', function (done) {
        apiClient.retrieveAssetIssuanceHistory('aCzArpN97RBPktgx4qmD', 'jjjfjlkjla', null, function (error, result) {
            if (error) {
                expect(error.message).toBe('Error returned from Catenis API endpoint: [400] Invalid parameters');
                done();
            }
            else {
                done.fail('API method call should have failed');
            }
        });
    });

    it('Call Retrieve Asset Issuance History API method with invalid end date', function (done) {
        apiClient.retrieveAssetIssuanceHistory('aCzArpN97RBPktgx4qmD', null, 'fjdajfjlaj', function (error, result) {
            if (error) {
                expect(error.message).toBe('Error returned from Catenis API endpoint: [400] Invalid parameters');
                done();
            }
            else {
                done.fail('API method call should have failed');
            }
        });
    });

    it('Call Retrieve Asset Issuance History API method with ISO8601 formatted dates', function (done) {
        apiClient.retrieveAssetIssuanceHistory('aCzArpN97RBPktgx4qmD', '2018-11-29', '2018-11-29', function (error, result) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                done();
            }
        });
    });

    it('Call Retrieve Asset Issuance History API method with Date objects', function (done) {
        apiClient.retrieveAssetIssuanceHistory('aCzArpN97RBPktgx4qmD', new Date(), new Date(), function (error, result) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                done();
            }
        });
    });
});