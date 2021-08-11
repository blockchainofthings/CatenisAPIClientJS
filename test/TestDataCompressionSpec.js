describe('Test data compression.', function  () {
    var device1 = {
        id: 'drc3XdxNtzoucpw9xiRp'
    };
    var accessKey1 = '4c1749c8e86f65e0a73e5fb19f2aa9e74a716bc22d7956bf3072b4bc3fbfe2a0d138ad0d4bcfee251e4e5f54d6e92b8fd4eb36958a7aeaeeb51e8d2fcc4552c3';
    var apiClient1;
    var apiClientCompr1;
    var message0, message1, message2;
    var message0Id = '', message1Id = '', message2Id = '';
    var randomNumber;

    beforeAll(function () {
        randomNumber = function () {
            return  Math.floor(Math.random() * 1000000000);
        };

        // Instantiate Catenis API clients with NO compression
        apiClient1 = new CatenisApiClient(
            device1.id,
            accessKey1, {
                host: 'localhost:3000',
                secure: false,
                useCompression: false
            }
        );

        // Instantiate Catenis API clients (with compression)
        apiClientCompr1 = new CatenisApiClient(
            device1.id,
            accessKey1, {
                host: 'localhost:3000',
                secure: false,
                useCompression: true
            }
        );
    });

    it('Log a message to the blockchain with no compression', function (done) {
        message0 = 'Test message #' + randomNumber();

        apiClient1.logMessage(message0, function (error, data) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                message0Id = data.messageId;
                done();
            }
        });
    });

    it('Read the message that had been logged with no compression', function (done) {
        apiClient1.readMessage(message0Id, function (error, data) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                expect(data.msgData).toBe(message0);
                done();
            }
        });
    });

    it('Log a short message (below compression threshold) to the blockchain with compression', function (done) {
        message1 = 'Short test message #' + randomNumber();

        apiClientCompr1.logMessage(message1, function (error, data) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                message1Id = data.messageId;
                done();
            }
        });
    });

    it('Read the short message that had been logged with compression', function (done) {
        apiClientCompr1.readMessage(message1Id, function (error, data) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                expect(data.msgData).toBe(message1);
                done();
            }
        });
    });

    it('Log a longer message (above compression threshold) to the blockchain with compression', function (done) {
        message2 = 'Longer test message (#' + randomNumber() + '): Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris tincidunt leo vitae posuere blandit. Duis pellentesque sem ac tempus volutpat. Proin pellentesque, mauris a mollis iaculis, velit nisl efficitur augue, a vestibulum leo est nec lectus. Duis aliquam dignissim lorem non tincidunt. In hac habitasse platea dictumst. Integer eget leo lorem. Sed mattis fringilla condimentum. In hac habitasse platea dictumst. In vitae hendrerit tellus. Ut cursus libero in mauris gravida elementum. Praesent finibus urna sapien, quis ornare lacus tincidunt vel. In hac habitasse platea dictumst. Integer aliquet ligula vitae sem rhoncus pellentesque. Donec non tempor lacus. Morbi bibendum bibendum risus, eget consectetur eros bibendum quis. Vestibulum lacinia ultrices libero et molestie. Quisque sit amet tristique justo, nec maximus odio. Nunc id dui vel orci cursus luctus quis eu enim. Fusce tortor nibh, dignissim sit amet pretium tincidunt, accumsan a turpis. Nam imperdiet congue dictum cras amet.';

        apiClientCompr1.logMessage(message2, function (error, data) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                message2Id = data.messageId;
                done();
            }
        });
    });

    it('Read the longer message that had been logged with compression', function (done) {
        apiClientCompr1.readMessage(message2Id, function (error, data) {
            if (error) {
                done.fail('API method call should not have failed. Returned error: ' + error);
            }
            else {
                expect(data.msgData).toBe(message2);
                done();
            }
        });
    });
});