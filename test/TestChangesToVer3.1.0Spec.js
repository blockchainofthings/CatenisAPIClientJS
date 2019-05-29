describe('Test changes to Catenis API client ver. 3.1.0.', function  () {
    var device1 = {
        id: 'drc3XdxNtzoucpw9xiRp'
    };
    var accessKey1 = '544bca61a4116e15fd7bb7c3acb2eef2a1466635446e1aa3077b6a4931be51c4c620b87f1f8fdc3c7291f9dc32eb52f3e008755d3ecdaa57052188702c3fee61';
    var apiClient;
    var wsNotifyChannel;

    beforeAll(function () {
        // Instantiate Catenis API clients
        apiClient = new CatenisApiClient(
            device1.id,
            accessKey1, {
                host: 'localhost:3000',
                secure: false
            }
        );

        // Create WebSocket notification channel to indicate when message is received
        wsNotifyChannel = apiClient.createWsNotifyChannel('new-msg-received');
    });

    it('WebSocket notification channel should emit open event', function (done) {
        // Wire notification event
        wsNotifyChannel.addListener('error', function (error) {
            done.fail('\'Error\' event received instead of \'open\' event. Returned error: ' + error);
        });

        wsNotifyChannel.addListener('close', function (code, reason) {
            done.fail('\'Close\' event received instead of \'open\' event. Returned close info: [' + code + '] - ' + reason);
        });

        wsNotifyChannel.addListener('notify', function(data) {
            done.fail('\'Notify\' event received instead of \'open\' event. Returned data: ' + JSON.stringify(data));
        });

        wsNotifyChannel.addListener('open', function() {
            done();
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
});