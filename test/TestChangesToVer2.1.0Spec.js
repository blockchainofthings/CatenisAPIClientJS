xdescribe('Test changes to Catenis API client ver. 2.1.0.', function  () {
    var device1 = {
        id: 'd8YpQ7jgPBJEkBrnvp58'
    };
    var device2 = {
        id: 'drc3XdxNtzoucpw9xiRp'
    };
    var accessKey1 = '61281120a92dc6267af11170d161f64478b0a852f3cce4286b8a1b82afd2de7077472b6f7b93b6d554295d859815a37cb89f4f875b7aaeb0bd2babd9531c6883';
    var accessKey2 = '544bca61a4116e15fd7bb7c3acb2eef2a1466635446e1aa3077b6a4931be51c4c620b87f1f8fdc3c7291f9dc32eb52f3e008755d3ecdaa57052188702c3fee61';
    var apiClient;
    var apiClient2;
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
        apiClient2 = new CatenisApiClient(
            device2.id,
            accessKey2, {
                host: 'localhost:3000',
                secure: false
            }
        );

        // Create WebSocket notification channel to indicate when message is received
        wsNotifyChannel = apiClient.createWsNotifyChannel('new-msg-received');
    });

    it('Handle notify event of WebSocket notification channel', function (done) {
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

        // Open notification channel
        wsNotifyChannel.open(function (error) {
            if (error) {
                done.fail('Error opening WebSocket notification channel. Returned error: ' + error);
            }
            else {
                // WebSocket notification channel is open.
                //  Send message
                apiClient2.sendMessage(device1, 'Only a test', null, function (error) {
                    if (error) {
                        done.fail('Failed to send message. Returned error: ' + error);
                    }
                })
            }
        });
    });
});