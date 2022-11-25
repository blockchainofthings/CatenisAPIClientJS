describe('Test changes to Catenis API client ver. 7.1.0.', function  () {
    const device1 = {
        id: 'drc3XdxNtzoucpw9xiRp'
    };
    const device2 = {
        id: 'd8YpQ7jgPBJEkBrnvp58'
    };
    const accessKey1 = '4c1749c8e86f65e0a73e5fb19f2aa9e74a716bc22d7956bf3072b4bc3fbfe2a0d138ad0d4bcfee251e4e5f54d6e92b8fd4eb36958a7aeaeeb51e8d2fcc4552c3';
    const accessKey2 = '267a687115b9752f2eec5be849b570b29133528f928868d811bad5e48e97a1d62d432bab44803586b2ac35002ec6f0eeaa98bec79b64f2f69b9cb0935b4df2c4';
    let apiClient;
    let apiClient2;
    let randomNumber;
    const sharedData = {
        nfAsset: undefined,
        nfTokenIds: undefined
    };

    beforeAll(function (done) {
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

        // Issue non-fungible asset and its non-fungible tokens for testing
        const assetNumber = randomNumber();

        apiClient.issueNonFungibleAsset({
            assetInfo: {
                name: 'TSTNFA#' + assetNumber,
                description: 'Test non-fungible asset #' + assetNumber,
                canReissue: true
            }
        }, [
            {
                metadata: {
                    name: 'TSTNFA#' + assetNumber + '_NFT#1',
                    description: 'Test non-fungible token #1 of test non-fungible asset #' + assetNumber
                },
                contents: {
                    data: 'Contents for token #1 of asset #' + assetNumber,
                    encoding: 'utf8'
                }
            },
            {
                metadata: {
                    name: 'TSTNFA#' + assetNumber + '_NFT#2',
                    description: 'Test non-fungible token #2 of test non-fungible asset #' + assetNumber
                },
                contents: {
                    data: 'Contents for token #2 of asset #' + assetNumber,
                    encoding: 'utf8'
                }
            },
            {
                metadata: {
                    name: 'TSTNFA#' + assetNumber + '_NFT#3',
                    description: 'Test non-fungible token #3 of test non-fungible asset #' + assetNumber
                },
                contents: {
                    data: 'Contents for token #3 of asset #' + assetNumber,
                    encoding: 'utf8'
                }
            },
            {
                metadata: {
                    name: 'TSTNFA#' + assetNumber + '_NFT#4',
                    description: 'Test non-fungible token #4 of test non-fungible asset #' + assetNumber
                },
                contents: {
                    data: 'Contents for token #4 of asset #' + assetNumber,
                    encoding: 'utf8'
                }
            }
        ], function (error, data) {
            if (error) {
                done.fail('Error issuing non-fungible asset: ' + error);
            }
            else {
                expect(typeof data === 'object' && data !== null
                    && typeof data.assetId === 'string'
                    && Array.isArray(data.nfTokenIds)
                ).toBeTrue();
                expect(data.nfTokenIds.length).toBe(4);

                // Save new asset and non-fungible token IDs
                sharedData.nfAsset = {
                    number: assetNumber,
                    id: data.assetId
                };
                sharedData.nfTokenIds = data.nfTokenIds;

                done();
            }
        });
    });

    it('List owned non-fungible tokens (all)', function (done) {
        apiClient.listOwnedNonFungibleTokens(sharedData.nfAsset.id, function (error, data) {
            if (error) {
                done.fail('Error listing owned non-fungible tokens: ' + error);
            }
            else {
                expect(typeof data === 'object' && data !== null
                    && Array.isArray(data.ownedNFTokens)
                    && typeof data.hasMore === 'boolean'
                ).toBeTrue();
                expect(data.ownedNFTokens.length).toBe(sharedData.nfTokenIds.length);
                expect(data.hasMore).toBeFalse();

                done();
            }
        });
    });

    it('List owned non-fungible tokens (limit)', function (done) {
        apiClient.listOwnedNonFungibleTokens(sharedData.nfAsset.id, 2, function (error, data) {
            if (error) {
                done.fail('Error listing owned non-fungible tokens: ' + error);
            }
            else {
                expect(typeof data === 'object' && data !== null
                    && Array.isArray(data.ownedNFTokens)
                    && typeof data.hasMore === 'boolean'
                ).toBeTrue();
                expect(data.ownedNFTokens.length).toBe(2);
                expect(data.hasMore).toBeTrue();

                done();
            }
        });
    });

    it('List owned non-fungible tokens (limit and skip)', function (done) {
        apiClient.listOwnedNonFungibleTokens(sharedData.nfAsset.id, 3, 1, function (error, data) {
            if (error) {
                done.fail('Error listing owned non-fungible tokens: ' + error);
            }
            else {
                expect(typeof data === 'object' && data !== null
                    && Array.isArray(data.ownedNFTokens)
                    && typeof data.hasMore === 'boolean'
                ).toBeTrue();
                expect(data.ownedNFTokens.length).toBe(3);
                expect(data.hasMore).toBeFalse();

                done();
            }
        });
    });

    it('get non-fungible token owner', function (done) {
        apiClient.getNonFungibleTokenOwner(sharedData.nfTokenIds[0], function (error, data) {
            if (error) {
                done.fail('Error getting non-fungible token owner: ' + error);
            }
            else {
                expect(typeof data === 'object' && data !== null
                    && typeof data.owner === 'object' && data.owner !== null
                    && typeof data.isConfirmed === 'boolean'
                ).toBeTrue();
                expect(data.owner.deviceId).toEqual(device1.id);
                expect(data.isConfirmed).toBeFalse();

                done();
            }
        });
    });

    it('check non-fungible token ownership (multiple tokens)', function (done) {
        apiClient.checkNonFungibleTokenOwnership(device1, {
            id: sharedData.nfAsset.id,
            isAssetId: true
        }, function (error, data) {
            if (error) {
                done.fail('Error getting non-fungible token owner: ' + error);
            }
            else {
                expect(typeof data === 'object' && data !== null
                    && typeof data.tokensOwned === 'number'
                    && typeof data.tokensUnconfirmed === 'number'
                ).toBeTrue();
                expect(data.tokensOwned).toEqual(sharedData.nfTokenIds.length);
                expect(data.tokensUnconfirmed).toEqual(sharedData.nfTokenIds.length);

                done();
            }
        });
    });

    it('check non-fungible token ownership (single token)', function (done) {
        apiClient.checkNonFungibleTokenOwnership(device1, {
            id: sharedData.nfTokenIds[0],
            isAssetId: false
        }, function (error, data) {
            if (error) {
                done.fail('Error getting non-fungible token owner: ' + error);
            }
            else {
                expect(typeof data === 'object' && data !== null
                    && typeof data.tokensOwned === 'number'
                    && typeof data.tokensUnconfirmed === 'number'
                ).toBeTrue();
                expect(data.tokensOwned).toEqual(1);
                expect(data.tokensUnconfirmed).toEqual(1);

                done();
            }
        });
    });
});
