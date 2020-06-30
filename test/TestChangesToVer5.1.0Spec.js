describe('Test changes to Catenis API client ver. 5.1.0.', function  () {
    var device1 = {
        id: 'drc3XdxNtzoucpw9xiRp'
    };
    var accessKey1 = '4c1749c8e86f65e0a73e5fb19f2aa9e74a716bc22d7956bf3072b4bc3fbfe2a0d138ad0d4bcfee251e4e5f54d6e92b8fd4eb36958a7aeaeeb51e8d2fcc4552c3';
    var apiClient;
    var apiClient2;
    var randomNumber;
    var messages = [];

    beforeAll(function (done) {
        randomNumber = function () {
            return Math.floor(Math.random() * 1000000000);
        };

        // Instantiate a regular Catenis API client
        apiClient = new CatenisApiClient(
            device1.id,
            accessKey1, {
                host: 'localhost:3000',
                secure: false
            }
        );

        // Instantiate a Catenis API Client used to call only public methods
        apiClient2 = new CatenisApiClient({
            host: 'localhost:3000',
            secure: false
        });

        // Log some test messages
        let msgCount = 2;

        // Message #1: regular (non-off-chain) message
        messages[0] = {
            contents: 'Test message #' + randomNumber()
        };

        apiClient.logMessage(messages[0].contents, {
            offChain: false
        }, function (error, data) {
            if (error) {
                // Error. Throw exception
                throw new Error('Error logging test message #1: ' + error);
            }
            else {
                // Save message ID
                messages[0].id = data.messageId;

                if (--msgCount === 0) {
                    done();
                }
            }
        });

        // Message #2: off-chain message
        messages[1] = {
            contents: 'Test message #' + randomNumber()
        };

        apiClient.logMessage(messages[1].contents, function (error, data) {
            if (error) {
                // Error. Throw exception
                throw new Error('Error logging test message #2: ' + error);
            }
            else {
                // Save message ID
                messages[1].id = data.messageId;

                if (--msgCount === 0) {
                    done();
                }
            }
        });
    });

    it('should fail if calling a private method from a public only client instance', function (done) {
        const message = 'Test message #' + randomNumber();

        apiClient2.logMessage(message, {
            offChain: false
        }, function (error, data) {
            if (error) {
                expect(error).toBeInstanceOf(CatenisApiError);
                expect(error.message).toBe('Error returned from Catenis API endpoint: [401] You must be logged in to do this.');
                done();
            }
            else {
                done.fail('Should have failed calling a private method');
            }
        });
    });

    it('should be able to call a public method from a regular client instance', function (done) {
        apiClient.retrieveMessageOrigin(messages[0].id, function (error, data) {
            if (error) {
                done.fail('Error calling public method from regular client instance: ' + error);
            }
            else {
                expect(data).toBeDefined();
                done();
            }
        });
    });

    it('Should successfully retrieve origin of regular message (w/o proof)', function (done) {
        apiClient2.retrieveMessageOrigin(messages[0].id, function (error, data) {
            if (error) {
                done.fail('Error retrieving message origin: ' + error);
            }
            else {
                expect(typeof data === 'object' && data !== null
                    && typeof data.tx === 'object'
                    && typeof data.tx.originDevice === 'object'
                    && data.offChainMsgEnvelope === undefined
                    && data.proof === undefined
                ).toBeTrue()
                done();
            }
        });
    });

    it('Should successfully retrieve origin of regular message (with proof)', function (done) {
        apiClient2.retrieveMessageOrigin(messages[0].id, 'This is only a test', function (error, data) {
            if (error) {
                done.fail('Error retrieving message origin: ' + error);
            }
            else {
                expect(typeof data === 'object' && data !== null
                    && typeof data.tx === 'object'
                    && typeof data.tx.originDevice === 'object'
                    && data.offChainMsgEnvelope === undefined
                    && typeof data.proof === 'object'
                ).toBeTrue()
                done();
            }
        });
    });

    it('Should successfully retrieve origin of off-chain message (w/o proof)', function (done) {
        apiClient2.retrieveMessageOrigin(messages[1].id, function (error, data) {
            if (error) {
                done.fail('Error retrieving message origin: ' + error);
            }
            else {
                expect(typeof data === 'object' && data !== null
                    && (data.tx === undefined || (typeof data.tx === 'object' && data.tx.originDevice === undefined))
                    && typeof data.offChainMsgEnvelope === 'object'
                    && data.proof === undefined
                ).toBeTrue()
                done();
            }
        });
    });

    it('Should successfully retrieve origin of off-chain message (with proof)', function (done) {
        apiClient2.retrieveMessageOrigin(messages[1].id, 'This is only a test', function (error, data) {
            if (error) {
                done.fail('Error retrieving message origin: ' + error);
            }
            else {
                expect(typeof data === 'object' && data !== null
                    && (data.tx === undefined || (typeof data.tx === 'object' && data.tx.originDevice === undefined))
                    && typeof data.offChainMsgEnvelope === 'object'
                    && typeof data.proof === 'object'
                ).toBeTrue()
                done();
            }
        });
    });
});