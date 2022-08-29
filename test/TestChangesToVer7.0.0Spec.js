describe('Test changes to Catenis API client ver. 7.0.0.', function  () {
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
        nfTokenIds: undefined,
        assetIssuanceId: undefined,
        tokenRetrievalId: undefined,
        tokenTransferId: undefined
    };

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

    describe('Non-fungible asset issuance.', function () {
        it('Issue non-fungible asset (single call, no isFinal argument)', function (done) {
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
                        && !('continuationToken' in data)
                        && !('assetIssuanceId' in data)
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

        it('Issue non-fungible asset (single call, with isFinal argument)', function (done) {
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
                }
            ], true, function (error, data) {
                if (error) {
                    done.fail('Error issuing non-fungible asset: ' + error);
                }
                else {
                    expect(typeof data === 'object' && data !== null
                        && !('continuationToken' in data)
                        && !('assetIssuanceId' in data)
                        && typeof data.assetId === 'string'
                        && Array.isArray(data.nfTokenIds)
                    ).toBeTrue();
                    expect(data.nfTokenIds.length).toBe(1);

                    done();
                }
            });
        });

        it('Issue non-fungible asset (multiple calls)', function (done) {
            const assetNumber = randomNumber();

            // Initial call to issue non-fungible token
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
                }
            ], false, function (error, data) {
                if (error) {
                    done.fail('Error issuing non-fungible asset (initial call): ' + error);
                }
                else {
                    expect(typeof data === 'object' && data !== null
                        && typeof data.continuationToken === 'string'
                        && !('assetIssuanceId' in data)
                        && !('assetId' in data)
                        && !('nfTokenIds' in data)
                    ).toBeTrue();

                    // Continuation call to issue non-fungible token
                    apiClient.issueNonFungibleAsset(data.continuationToken, [
                        {
                            contents: {
                                data: '. Continuation of contents for token #1 of asset #' + assetNumber,
                                encoding: 'utf8'
                            }
                        }
                    ], function (error, data) {
                        if (error) {
                            done.fail('Error issuing non-fungible asset (continuation call): ' + error);
                        }
                        else {
                            expect(typeof data === 'object' && data !== null
                                && !('continuationToken' in data)
                                && !('assetIssuanceId' in data)
                                && typeof data.assetId === 'string'
                                && Array.isArray(data.nfTokenIds)
                            ).toBeTrue();
                            expect(data.nfTokenIds.length).toBe(1);

                            done();
                        }
                    });
                }
            });
        });

        it('Issue non-fungible asset (multiple calls with separate final call)', function (done) {
            const assetNumber = randomNumber();

            // Initial call to issue non-fungible token
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
                }
            ], false, function (error, data) {
                if (error) {
                    done.fail('Error issuing non-fungible asset (initial call): ' + error);
                }
                else {
                    expect(typeof data === 'object' && data !== null
                        && typeof data.continuationToken === 'string'
                        && !('assetIssuanceId' in data)
                        && !('assetId' in data)
                        && !('nfTokenIds' in data)
                    ).toBeTrue();

                    // Continuation call to issue non-fungible token
                    apiClient.issueNonFungibleAsset(data.continuationToken, [
                        {
                            contents: {
                                data: '. Continuation of contents for token #1 of asset #' + assetNumber,
                                encoding: 'utf8'
                            }
                        }
                    ], false, function (error, data) {
                        if (error) {
                            done.fail('Error issuing non-fungible asset (continuation call): ' + error);
                        }
                        else {
                            expect(typeof data === 'object' && data !== null
                                && typeof data.continuationToken === 'string'
                                && !('assetIssuanceId' in data)
                                && !('assetId' in data)
                                && !('nfTokenIds' in data)
                            ).toBeTrue();

                            // Final call to issue non-fungible token
                            apiClient.issueNonFungibleAsset(data.continuationToken, function (error, data) {
                                if (error) {
                                    done.fail('Error issuing non-fungible asset (final call): ' + error);
                                }
                                else {
                                    expect(typeof data === 'object' && data !== null
                                        && !('continuationToken' in data)
                                        && !('assetIssuanceId' in data)
                                        && typeof data.assetId === 'string'
                                        && Array.isArray(data.nfTokenIds)
                                    ).toBeTrue();
                                    expect(data.nfTokenIds.length).toBe(1);

                                    done();
                                }
                            });
                        }
                    });
                }
            });
        });

        it('Receive notification for nf-token-received notify event (when issuing non-fungible asset)', function (done) {
            let testEnded = false;

            function endTest(error) {
                if (!testEnded) {
                    if (wsNotifyChannel) {
                        // Remove event listeners
                        wsNotifyChannel.removeAllListeners();

                        // Close notification channel
                        wsNotifyChannel.close();
                    }

                    testEnded = true;

                    if (error) {
                        done.fail(error);
                    }
                    else {
                        done();
                    }
                }
            }

            const assetNumber = randomNumber();
            let issuedNFTokenIds;
            let notifyData;

            // Create WebSocket notification channel to be notified when non-fungible token is received
            const wsNotifyChannel = apiClient2.createWsNotifyChannel('nf-token-received');

            // Wire notification event
            wsNotifyChannel.addListener('error', function (error) {
                endTest('Error with WebSocket notification channel. Returned error: ' + error);
            });

            wsNotifyChannel.addListener('close', function (code, reason) {
                endTest('WebSocket notification channel closed unexpectedly. [' + code + '] - ' + reason);
            });

            wsNotifyChannel.addListener('notify', function (data) {
                if (issuedNFTokenIds) {
                    // Non-fungible asset issuance call already returned.
                    //  Validate notification data
                    expect(typeof data === 'object' && data !== null
                        && Array.isArray(data.nfTokenIds)
                        && typeof data.issuer === 'object'
                        && typeof data.from === 'object'
                    ).toBeTrue();
                    expect(data.nfTokenIds.length).toEqual(issuedNFTokenIds.length);
                    data.nfTokenIds.forEach((nfTokenId, idx) => expect(nfTokenId).toEqual(issuedNFTokenIds[idx]));
                    expect(data.issuer.deviceId).toEqual(device1.id);
                    expect(data.from.deviceId).toEqual(device1.id);

                    endTest();
                }
                else {
                    // Save notification data to be validated later (when issuance call returns)
                    notifyData = data;
                }
            });

            // Open notification channel
            wsNotifyChannel.open(function (error) {
                if (error) {
                    endTest('Error opening WebSocket notification channel. Returned error: ' + error);
                }
                else {
                    // WebSocket notification channel is open.
                    //  Issue non-fungible asset
                    apiClient.issueNonFungibleAsset({
                        assetInfo: {
                            name: 'TSTNFA#' + assetNumber,
                            description: 'Test non-fungible asset #' + assetNumber,
                            canReissue: true
                        },
                        holdingDevices: device2
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
                        }
                    ], function (error, data) {
                        if (error) {
                            endTest('Error issuing non-fungible asset: ' + error);
                        }
                        else {
                            // Save issued non-fungible token IDs
                            issuedNFTokenIds = data.nfTokenIds;
                            
                            if (notifyData) {
                                // Notification data not yet validated. Validate it now
                                expect(typeof notifyData === 'object' && notifyData !== null
                                    && Array.isArray(notifyData.nfTokenIds)
                                    && typeof notifyData.issuer === 'object'
                                    && typeof notifyData.from === 'object'
                                ).toBeTrue();
                                expect(notifyData.nfTokenIds.length).toEqual(issuedNFTokenIds.length);
                                notifyData.nfTokenIds.forEach((nfTokenId, idx) => expect(nfTokenId).toEqual(issuedNFTokenIds[idx]));
                                expect(notifyData.issuer.deviceId).toEqual(device1.id);
                                expect(notifyData.from.deviceId).toEqual(device1.id);

                                endTest();
                            }
                        }
                    });
                }
            });
        });

        it('Issue non-fungible asset asynchronously and receive nf-asset-issuance-outcome notification', function (done) {
            let testEnded = false;

            function endTest(error) {
                if (!testEnded) {
                    if (wsNotifyChannel) {
                        // Remove event listeners
                        wsNotifyChannel.removeAllListeners();

                        // Close notification channel
                        wsNotifyChannel.close();
                    }

                    testEnded = true;

                    if (error) {
                        done.fail(error);
                    }
                    else {
                        done();
                    }
                }
            }

            const assetNumber = randomNumber();
            let assetIssuanceId;

            // Create WebSocket notification channel to be notified when asynchronous non-fungible
            //  asset issuance is finalized
            const wsNotifyChannel = apiClient.createWsNotifyChannel('nf-asset-issuance-outcome');

            // Wire notification event
            wsNotifyChannel.addListener('error', function (error) {
                endTest('Error with WebSocket notification channel. Returned error: ' + error);
            });

            wsNotifyChannel.addListener('close', function (code, reason) {
                endTest('WebSocket notification channel closed unexpectedly. [' + code + '] - ' + reason);
            });

            wsNotifyChannel.addListener('notify', function (data) {
                expect(typeof data === 'object' && data !== null
                    && typeof data.assetIssuanceId === 'string'
                    && typeof data.progress === 'object'
                    && typeof data.result === 'object'
                ).toBeTrue();
                expect(data.assetIssuanceId).toEqual(assetIssuanceId);
                expect(data.result.assetId).toBeInstanceOf(String);
                expect(Array.isArray(data.result.nfTokenIds)).toBeTrue();

                endTest();
            });

            // Open notification channel
            wsNotifyChannel.open(function (error) {
                if (error) {
                    endTest('Error opening WebSocket notification channel. Returned error: ' + error);
                }
                else {
                    // WebSocket notification channel is open.
                    //  Issue non-fungible asset
                    apiClient.issueNonFungibleAsset({
                        assetInfo: {
                            name: 'TSTNFA#' + assetNumber,
                            description: 'Test non-fungible asset #' + assetNumber,
                            canReissue: true
                        },
                        async: true
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
                        }
                    ], function (error, data) {
                        if (error) {
                            endTest('Error asynchronously issuing non-fungible asset: ' + error);
                        }
                        else {
                            expect(typeof data === 'object' && data !== null
                                && typeof data.assetIssuanceId === 'string'
                            ).toBeTrue();

                            // Save asset issuance ID
                            sharedData.assetIssuanceId = assetIssuanceId = data.assetIssuanceId;
                        }
                    });
                }
            });
        });
    });

    describe('Non-fungible asset reissuance.', function () {
        let assetNumber;
        let assetId;

        beforeAll(function (done) {
            // Check if a new non-fungible asset needs to be issued
            if (!sharedData.nfAsset) {
                // Issue new non-fungible asset
                assetNumber = randomNumber();

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
                        // Save new asset and non-fungible token IDs
                        sharedData.nfAsset = {
                            number: assetNumber,
                            id: data.assetId
                        };
                        sharedData.nfTokenIds = data.nfTokenIds;

                        // Save asset ID
                        assetId = data.assetId;

                        done();
                    }
                });
            }
            else {
                // Use existing non-fungible asset
                assetNumber = sharedData.nfAsset.number;
                assetId = sharedData.nfAsset.id;

                done();
            }
        });

        it('Reissue non-fungible asset (single call, no issuance info, no isFinal argument)', function (done) {
            apiClient.reissueNonFungibleAsset(assetId, [
                {
                    metadata: {
                        name: 'TSTNFA#' + assetNumber + '_NFT#5',
                        description: 'Test non-fungible token #5 of test non-fungible asset #' + assetNumber
                    },
                    contents: {
                        data: 'Contents for token #5 of asset #' + assetNumber,
                        encoding: 'utf8'
                    }
                }
            ], function (error, data) {
                if (error) {
                    done.fail('Error reissuing non-fungible asset: ' + error);
                }
                else {
                    expect(typeof data === 'object' && data !== null
                        && !('continuationToken' in data)
                        && !('assetIssuanceId' in data)
                        && Array.isArray(data.nfTokenIds)
                    ).toBeTrue();
                    expect(data.nfTokenIds.length).toBe(1);

                    done();
                }
            });
        });

        it('Reissue non-fungible asset (single call, with issuance info, no isFinal argument)', function (done) {
            apiClient.reissueNonFungibleAsset(assetId, {}, [
                {
                    metadata: {
                        name: 'TSTNFA#' + assetNumber + '_NFT#6',
                        description: 'Test non-fungible token #6 of test non-fungible asset #' + assetNumber
                    },
                    contents: {
                        data: 'Contents for token #6 of asset #' + assetNumber,
                        encoding: 'utf8'
                    }
                }
            ], function (error, data) {
                if (error) {
                    done.fail('Error reissuing non-fungible asset: ' + error);
                }
                else {
                    expect(typeof data === 'object' && data !== null
                        && !('continuationToken' in data)
                        && !('assetIssuanceId' in data)
                        && Array.isArray(data.nfTokenIds)
                    ).toBeTrue();
                    expect(data.nfTokenIds.length).toBe(1);

                    done();
                }
            });
        });

        it('Reissue non-fungible asset (single call, with isFinal argument)', function (done) {
            apiClient.reissueNonFungibleAsset(assetId, [
                {
                    metadata: {
                        name: 'TSTNFA#' + assetNumber + '_NFT#7',
                        description: 'Test non-fungible token #7 of test non-fungible asset #' + assetNumber
                    },
                    contents: {
                        data: 'Contents for token #7 of asset #' + assetNumber,
                        encoding: 'utf8'
                    }
                }
            ], true, function (error, data) {
                if (error) {
                    done.fail('Error reissuing non-fungible asset: ' + error);
                }
                else {
                    expect(typeof data === 'object' && data !== null
                        && !('continuationToken' in data)
                        && !('assetIssuanceId' in data)
                        && Array.isArray(data.nfTokenIds)
                    ).toBeTrue();
                    expect(data.nfTokenIds.length).toBe(1);

                    done();
                }
            });
        });

        it('Reissue non-fungible asset (multiple calls)', function (done) {
            // Initial call to issue non-fungible token
            apiClient.reissueNonFungibleAsset(assetId, [
                {
                    metadata: {
                        name: 'TSTNFA#' + assetNumber + '_NFT#8',
                        description: 'Test non-fungible token #8 of test non-fungible asset #' + assetNumber
                    },
                    contents: {
                        data: 'Contents for token #8 of asset #' + assetNumber,
                        encoding: 'utf8'
                    }
                }
            ], false, function (error, data) {
                if (error) {
                    done.fail('Error reissuing non-fungible asset (initial call): ' + error);
                }
                else {
                    expect(typeof data === 'object' && data !== null
                        && typeof data.continuationToken === 'string'
                        && !('assetIssuanceId' in data)
                        && !('nfTokenIds' in data)
                    ).toBeTrue();

                    // Continuation call to issue non-fungible token
                    apiClient.reissueNonFungibleAsset(assetId, data.continuationToken, [
                        {
                            contents: {
                                data: '. Continuation of contents for token #8 of asset #' + assetNumber,
                                encoding: 'utf8'
                            }
                        }
                    ], function (error, data) {
                        if (error) {
                            done.fail('Error reissuing non-fungible asset (continuation call): ' + error);
                        }
                        else {
                            expect(typeof data === 'object' && data !== null
                                && !('continuationToken' in data)
                                && !('assetIssuanceId' in data)
                                && Array.isArray(data.nfTokenIds)
                            ).toBeTrue();
                            expect(data.nfTokenIds.length).toBe(1);

                            done();
                        }
                    });
                }
            });
        });

        it('Reissue non-fungible asset (multiple calls with separate final call)', function (done) {
            // Initial call to issue non-fungible token
            apiClient.reissueNonFungibleAsset(assetId, [
                {
                    metadata: {
                        name: 'TSTNFA#' + assetNumber + '_NFT#9',
                        description: 'Test non-fungible token #9 of test non-fungible asset #' + assetNumber
                    },
                    contents: {
                        data: 'Contents for token #9 of asset #' + assetNumber,
                        encoding: 'utf8'
                    }
                }
            ], false, function (error, data) {
                if (error) {
                    done.fail('Error reissuing non-fungible asset (initial call): ' + error);
                }
                else {
                    expect(typeof data === 'object' && data !== null
                        && typeof data.continuationToken === 'string'
                        && !('assetIssuanceId' in data)
                        && !('nfTokenIds' in data)
                    ).toBeTrue();

                    // Continuation call to issue non-fungible token
                    apiClient.reissueNonFungibleAsset(assetId, data.continuationToken, [
                        {
                            contents: {
                                data: '. Continuation of contents for token #9 of asset #' + assetNumber,
                                encoding: 'utf8'
                            }
                        }
                    ], false, function (error, data) {
                        if (error) {
                            done.fail('Error reissuing non-fungible asset (continuation call): ' + error);
                        }
                        else {
                            expect(typeof data === 'object' && data !== null
                                && typeof data.continuationToken === 'string'
                                && !('assetIssuanceId' in data)
                                && !('nfTokenIds' in data)
                            ).toBeTrue();

                            // Final call to issue non-fungible token
                            apiClient.reissueNonFungibleAsset(assetId, data.continuationToken, function (error, data) {
                                if (error) {
                                    done.fail('Error reissuing non-fungible asset (final call): ' + error);
                                }
                                else {
                                    expect(typeof data === 'object' && data !== null
                                        && !('continuationToken' in data)
                                        && !('assetIssuanceId' in data)
                                        && Array.isArray(data.nfTokenIds)
                                    ).toBeTrue();
                                    expect(data.nfTokenIds.length).toBe(1);

                                    done();
                                }
                            });
                        }
                    });
                }
            });
        });

        it('Receive notification for nf-token-received notify event (when reissuing non-fungible asset)', function (done) {
            let testEnded = false;

            function endTest(error) {
                if (!testEnded) {
                    if (wsNotifyChannel) {
                        // Remove event listeners
                        wsNotifyChannel.removeAllListeners();

                        // Close notification channel
                        wsNotifyChannel.close();
                    }

                    testEnded = true;

                    if (error) {
                        done.fail(error);
                    }
                    else {
                        done();
                    }
                }
            }

            let issuedNFTokenIds;
            let notifyData;

            // Create WebSocket notification channel to be notified when non-fungible token is received
            const wsNotifyChannel = apiClient2.createWsNotifyChannel('nf-token-received');

            // Wire notification event
            wsNotifyChannel.addListener('error', function (error) {
                endTest('Error with WebSocket notification channel. Returned error: ' + error);
            });

            wsNotifyChannel.addListener('close', function (code, reason) {
                endTest('WebSocket notification channel closed unexpectedly. [' + code + '] - ' + reason);
            });

            wsNotifyChannel.addListener('notify', function (data) {
                if (issuedNFTokenIds) {
                    // Non-fungible asset issuance call already returned.
                    //  Validate notification data
                    expect(typeof data === 'object' && data !== null
                        && Array.isArray(data.nfTokenIds)
                        && typeof data.issuer === 'object'
                        && typeof data.from === 'object'
                    ).toBeTrue();
                    expect(data.nfTokenIds.length).toEqual(issuedNFTokenIds.length);
                    data.nfTokenIds.forEach((nfTokenId, idx) => expect(nfTokenId).toEqual(issuedNFTokenIds[idx]));
                    expect(data.issuer.deviceId).toEqual(device1.id);
                    expect(data.from.deviceId).toEqual(device1.id);

                    endTest();
                }
                else {
                    // Save notification data to be validated later (when issuance call returns)
                    notifyData = data;
                }
            });

            // Open notification channel
            wsNotifyChannel.open(function (error) {
                if (error) {
                    endTest('Error opening WebSocket notification channel. Returned error: ' + error);
                }
                else {
                    // WebSocket notification channel is open.
                    //  Reissue non-fungible asset
                    apiClient.reissueNonFungibleAsset(assetId, {
                        holdingDevices: device2
                    }, [
                        {
                            metadata: {
                                name: 'TSTNFA#' + assetNumber + '_NFT#7',
                                description: 'Test non-fungible token #7 of test non-fungible asset #' + assetNumber
                            },
                            contents: {
                                data: 'Contents for token #7 of asset #' + assetNumber,
                                encoding: 'utf8'
                            }
                        }
                    ], function (error, data) {
                        if (error) {
                            endTest('Error reissuing non-fungible asset: ' + error);
                        }
                        else {
                            // Save issued non-fungible token IDs
                            issuedNFTokenIds = data.nfTokenIds;

                            if (notifyData) {
                                // Notification data not yet validated. Validate it now
                                expect(typeof notifyData === 'object' && notifyData !== null
                                    && Array.isArray(notifyData.nfTokenIds)
                                    && typeof notifyData.issuer === 'object'
                                    && typeof notifyData.from === 'object'
                                ).toBeTrue();
                                expect(notifyData.nfTokenIds.length).toEqual(issuedNFTokenIds.length);
                                notifyData.nfTokenIds.forEach((nfTokenId, idx) => expect(nfTokenId).toEqual(issuedNFTokenIds[idx]));
                                expect(notifyData.issuer.deviceId).toEqual(device1.id);
                                expect(notifyData.from.deviceId).toEqual(device1.id);

                                endTest();
                            }
                        }
                    });
                }
            });
        });

        it('Reissue non-fungible asset asynchronously and receive nf-asset-issuance-outcome notification', function (done) {
            let testEnded = false;

            function endTest(error) {
                if (!testEnded) {
                    if (wsNotifyChannel) {
                        // Remove event listeners
                        wsNotifyChannel.removeAllListeners();

                        // Close notification channel
                        wsNotifyChannel.close();
                    }

                    testEnded = true;

                    if (error) {
                        done.fail(error);
                    }
                    else {
                        done();
                    }
                }
            }

            let assetIssuanceId;

            // Create WebSocket notification channel to be notified when asynchronous non-fungible
            //  asset issuance is finalized
            const wsNotifyChannel = apiClient.createWsNotifyChannel('nf-asset-issuance-outcome');

            // Wire notification event
            wsNotifyChannel.addListener('error', function (error) {
                endTest('Error with WebSocket notification channel. Returned error: ' + error);
            });

            wsNotifyChannel.addListener('close', function (code, reason) {
                endTest('WebSocket notification channel closed unexpectedly. [' + code + '] - ' + reason);
            });

            wsNotifyChannel.addListener('notify', function (data) {
                expect(typeof data === 'object' && data !== null
                    && typeof data.assetIssuanceId === 'string'
                    && typeof data.assetId === 'string'
                    && typeof data.progress === 'object'
                    && typeof data.result === 'object'
                ).toBeTrue();
                expect(data.assetIssuanceId).toEqual(assetIssuanceId);
                expect(data.assetId).toEqual(assetId);
                expect(Array.isArray(data.result.nfTokenIds)).toBeTrue();

                endTest();
            });

            // Open notification channel
            wsNotifyChannel.open(function (error) {
                if (error) {
                    endTest('Error opening WebSocket notification channel. Returned error: ' + error);
                }
                else {
                    // WebSocket notification channel is open.
                    //  Reissue non-fungible asset
                    apiClient.reissueNonFungibleAsset(assetId, {
                        async: true
                    }, [
                        {
                            metadata: {
                                name: 'TSTNFA#' + assetNumber + '_NFT#8',
                                description: 'Test non-fungible token #8 of test non-fungible asset #' + assetNumber
                            },
                            contents: {
                                data: 'Contents for token #8 of asset #' + assetNumber,
                                encoding: 'utf8'
                            }
                        }
                    ], function (error, data) {
                        if (error) {
                            endTest('Error asynchronously reissuing non-fungible asset: ' + error);
                        }
                        else {
                            expect(typeof data === 'object' && data !== null
                                && typeof data.assetIssuanceId === 'string'
                            ).toBeTrue();

                            // Save asset issuance ID
                            assetIssuanceId = data.assetIssuanceId;

                            if (!sharedData.assetIssuanceId) {
                                sharedData.assetIssuanceId = assetIssuanceId;
                            }
                        }
                    });
                }
            });
        });
    });

    describe('Non-fungible asset issuance progress.', function () {
        let assetIssuanceId;

        beforeAll(function (done) {
            // Check if a new non-fungible asset needs to be issued
            if (!sharedData.assetIssuanceId) {
                // Issue new non-fungible asset asynchronously
                const assetNumber = randomNumber();

                apiClient.issueNonFungibleAsset({
                    assetInfo: {
                        name: 'TSTNFA#' + assetNumber,
                        description: 'Test non-fungible asset #' + assetNumber,
                        canReissue: true
                    },
                    async: true
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
                    }
                ], function (error, data) {
                    if (error) {
                        done.fail('Error issuing non-fungible asset: ' + error);
                    }
                    else {
                        // Save asset issuance ID
                        assetIssuanceId = data.assetIssuanceId;

                        done();
                    }
                });
            }
            else {
                // Use existing asset issuance ID
                assetIssuanceId = sharedData.assetIssuanceId;

                done();
            }
        });

        it('Retrieve non-fungible asset issuance progress', function (done) {
            apiClient.retrieveNonFungibleAssetIssuanceProgress(assetIssuanceId, function (error, data) {
                if (error) {
                    done.fail('Error retrieving non-fungible asset issuance progress: ' + error);
                }
                else {
                    expect(typeof data === 'object' && data !== null
                        && (!('assetId' in data) || typeof data.assetId === 'string')
                        && typeof data.progress === 'object'
                        && (!('result' in data) || typeof data.result === 'object')
                    ).toBeTrue();

                    done();
                }
            });
        });
    });

    describe('Non-fungible token retrieval.', function () {
        let nfTokenId;

        beforeAll(function (done) {
            // Check if a new non-fungible asset needs to be issued
            if (!sharedData.nfTokenIds) {
                // Issue new non-fungible asset
                assetNumber = randomNumber();

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
                        // Save non-fungible token IDs
                        sharedData.nfTokenIds = data.nfTokenIds;
                        
                        nfTokenId = data.nfTokenIds[0];

                        done();
                    }
                });
            }
            else {
                // Use existing non-fungible token
                nfTokenId = sharedData.nfTokenIds[0];

                done();
            }
        });

        it('Retrieve non-fungible token (no options)', function (done) {
            apiClient.retrieveNonFungibleToken(nfTokenId, function (error, data) {
                if (error) {
                    done.fail('Error retrieving non-fungible token: ' + error);
                }
                else {
                    expect(typeof data === 'object' && data !== null
                        && !('continuationToken' in data)
                        && !('tokenRetrievalId' in data)
                        && typeof data.nonFungibleToken === 'object'
                    ).toBeTrue();

                    done();
                }
            });
        });

        it('Retrieve non-fungible token (with options)', function (done) {
            apiClient.retrieveNonFungibleToken(nfTokenId, {
                retrieveContents: false
            }, function (error, data) {
                if (error) {
                    done.fail('Error retrieving non-fungible token: ' + error);
                }
                else {
                    expect(typeof data === 'object' && data !== null
                        && !('continuationToken' in data)
                        && !('tokenRetrievalId' in data)
                        && typeof data.nonFungibleToken === 'object'
                    ).toBeTrue();

                    done();
                }
            });
        });

        it('Retrieve non-fungible token asynchronously and receive nf-token-retrieval-outcome notification', function (done) {
            let testEnded = false;

            function endTest(error) {
                if (!testEnded) {
                    if (wsNotifyChannel) {
                        // Remove event listeners
                        wsNotifyChannel.removeAllListeners();

                        // Close notification channel
                        wsNotifyChannel.close();
                    }

                    testEnded = true;

                    if (error) {
                        done.fail(error);
                    }
                    else {
                        done();
                    }
                }
            }

            let tokenRetrievalId;

            // Create WebSocket notification channel to be notified when asynchronous non-fungible
            //  token retrieval is finalized
            const wsNotifyChannel = apiClient.createWsNotifyChannel('nf-token-retrieval-outcome');

            // Wire notification event
            wsNotifyChannel.addListener('error', function (error) {
                endTest('Error with WebSocket notification channel. Returned error: ' + error);
            });

            wsNotifyChannel.addListener('close', function (code, reason) {
                endTest('WebSocket notification channel closed unexpectedly. [' + code + '] - ' + reason);
            });

            wsNotifyChannel.addListener('notify', function (data) {
                expect(typeof data === 'object' && data !== null
                    && typeof data.nfTokenId === 'string'
                    && typeof data.tokenRetrievalId === 'string'
                    && typeof data.progress === 'object'
                    && (!('continuationToken' in data) || typeof data.continuationToken === 'string')
                ).toBeTrue();
                expect(data.nfTokenId).toEqual(nfTokenId);
                expect(data.tokenRetrievalId).toEqual(tokenRetrievalId);

                endTest();
            });

            // Open notification channel
            wsNotifyChannel.open(function (error) {
                if (error) {
                    endTest('Error opening WebSocket notification channel. Returned error: ' + error);
                }
                else {
                    // WebSocket notification channel is open.
                    //  Retrieve non-fungible token asynchronously
                    apiClient.retrieveNonFungibleToken(nfTokenId, {
                        async: true
                    }, function (error, data) {
                        if (error) {
                            endTest('Error retrieving non-fungible token: ' + error);
                        }
                        else {
                            expect(typeof data === 'object' && data !== null
                                && typeof data.tokenRetrievalId === 'string'
                            ).toBeTrue();

                            // Save token retrieval ID
                            sharedData.tokenRetrievalId = tokenRetrievalId = data.tokenRetrievalId;
                        }
                    });
                }
            });
        });
    });

    describe('Non-fungible token retrieval progress.', function () {
        let tokenId;
        let tokenRetrievalId;

        beforeAll(function (done) {
            // Check if a new non-fungible asset needs to be issued
            if (!sharedData.tokenRetrievalId) {
                // Issue new non-fungible asset
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
                        // Save non-fungible token IDs
                        sharedData.nfTokenIds = data.nfTokenIds;
                        
                        tokenId = data.nfTokenIds[0];

                        // Retrieve non-fungible token asynchronously
                        apiClient.retrieveNonFungibleToken(tokenId, {
                            async: true
                        }, function (error, data) {
                            if (error) {
                                done.fail('Error retrieving non-fungible token: ' + error);
                            }
                            else {
                                // Save token retrieval ID
                                tokenRetrievalId = data.tokenRetrievalId;

                                done();
                            }
                        });
                    }
                });
            }
            else {
                // Use existing token retrieval ID
                tokenId = sharedData.nfTokenIds[0];
                tokenRetrievalId = sharedData.tokenRetrievalId;

                done();
            }
        });

        it('Retrieve non-fungible token retrieval progress', function (done) {
            apiClient.retrieveNonFungibleTokenRetrievalProgress(tokenId, tokenRetrievalId, function (error, data) {
                if (error) {
                    done.fail('Error retrieving non-fungible token retrieval progress: ' + error);
                }
                else {
                    expect(typeof data === 'object' && data !== null
                        && typeof data.progress === 'object'
                        && (!('continuationToken' in data) || typeof data.continuationToken === 'string')
                    ).toBeTrue();

                    done();
                }
            });
        });
    });

    describe('Non-fungible token transfer.', function () {
        let nfTokenIds;

        beforeAll(function (done) {
            // Check if a new non-fungible asset needs to be issued
            if (!sharedData.nfTokenIds) {
                // Issue new non-fungible asset
                assetNumber = randomNumber();

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
                        // Save non-fungible token Ids
                        sharedData.nfTokenIds = data.nfTokenIds;
                        
                        nfTokenIds = data.nfTokenIds;

                        done();
                    }
                });
            }
            else {
                // Use existing non-fungible token
                nfTokenIds = sharedData.nfTokenIds;

                done();
            }
        });

        it('Transfer non-fungible token (no asyncProc arg)', function (done) {
            apiClient.transferNonFungibleToken(nfTokenIds[0], device2, function (error, data) {
                if (error) {
                    done.fail('Error transferring non-fungible token: ' + error);
                }
                else {
                    expect(typeof data === 'object' && data !== null
                        && !('tokenTransferId' in data)
                        && data.success === true
                    ).toBeTrue();

                    done();
                }
            });
        }, 10000);

        it('Transfer non-fungible token (with asyncProc arg)', function (done) {
            apiClient.transferNonFungibleToken(nfTokenIds[1], device2, false, function (error, data) {
                if (error) {
                    done.fail('Error transferring non-fungible token: ' + error);
                }
                else {
                    expect(typeof data === 'object' && data !== null
                        && !('tokenTransferId' in data)
                        && data.success === true
                    ).toBeTrue();

                    done();
                }
            });
        }, 10000);

        it('Receive notification for nf-token-received notify event (when transferring non-fungible token)', function (done) {
            let testEnded = false;

            function endTest(error) {
                if (!testEnded) {
                    if (wsNotifyChannel) {
                        // Remove event listeners
                        wsNotifyChannel.removeAllListeners();

                        // Close notification channel
                        wsNotifyChannel.close();
                    }

                    testEnded = true;

                    if (error) {
                        done.fail(error);
                    }
                    else {
                        done();
                    }
                }
            }

            let transferredNFTokenId;
            let notifyData;

            // Create WebSocket notification channel to be notified when non-fungible token is received
            const wsNotifyChannel = apiClient2.createWsNotifyChannel('nf-token-received');

            // Wire notification event
            wsNotifyChannel.addListener('error', function (error) {
                endTest('Error with WebSocket notification channel. Returned error: ' + error);
            });

            wsNotifyChannel.addListener('close', function (code, reason) {
                endTest('WebSocket notification channel closed unexpectedly. [' + code + '] - ' + reason);
            });

            wsNotifyChannel.addListener('notify', function (data) {
                expect(typeof data === 'object' && data !== null
                    && Array.isArray(data.nfTokenIds)
                    && typeof data.issuer === 'object'
                    && typeof data.from === 'object'
                ).toBeTrue();
                expect(data.nfTokenIds.length).toEqual(1);
                expect(data.issuer.deviceId).toEqual(device1.id);
                expect(data.from.deviceId).toEqual(device1.id);

                // Check if notification corresponds to the expected non-fungible token
                if (data.nfTokenIds[0] === nfTokenIds[2]) {
                    endTest();
                }
            });

            // Open notification channel
            wsNotifyChannel.open(function (error) {
                if (error) {
                    endTest('Error opening WebSocket notification channel. Returned error: ' + error);
                }
                else {
                    // WebSocket notification channel is open.
                    //  Transfer non-fungible token
                    apiClient.transferNonFungibleToken(nfTokenIds[2], device2, false, function (error, data) {
                        if (error) {
                            endTest('Error transferring non-fungible token: ' + error);
                        }
                    });
                }
            });
        }, 10000);

        it('Transfer non-fungible token asynchronously and receive nf-token-transfer-outcome notification', function (done) {
            let testEnded = false;

            function endTest(error) {
                if (!testEnded) {
                    if (wsNotifyChannel) {
                        // Remove event listeners
                        wsNotifyChannel.removeAllListeners();

                        // Close notification channel
                        wsNotifyChannel.close();
                    }

                    testEnded = true;

                    if (error) {
                        done.fail(error);
                    }
                    else {
                        done();
                    }
                }
            }

            let tokenTransferId;

            // Create WebSocket notification channel to be notified when asynchronous non-fungible
            //  token transfer is finalized
            const wsNotifyChannel = apiClient.createWsNotifyChannel('nf-token-transfer-outcome');

            // Wire notification event
            wsNotifyChannel.addListener('error', function (error) {
                endTest('Error with WebSocket notification channel. Returned error: ' + error);
            });

            wsNotifyChannel.addListener('close', function (code, reason) {
                endTest('WebSocket notification channel closed unexpectedly. [' + code + '] - ' + reason);
            });

            wsNotifyChannel.addListener('notify', function (data) {
                expect(typeof data === 'object' && data !== null
                    && typeof data.nfTokenId === 'string'
                    && typeof data.tokenTransferId === 'string'
                    && typeof data.progress === 'object'
                ).toBeTrue();
                expect(data.nfTokenId).toEqual(nfTokenIds[3]);
                expect(data.tokenTransferId).toEqual(tokenTransferId);

                endTest();
            });

            // Open notification channel
            wsNotifyChannel.open(function (error) {
                if (error) {
                    endTest('Error opening WebSocket notification channel. Returned error: ' + error);
                }
                else {
                    // WebSocket notification channel is open.
                    //  Transfer non-fungible token asynchronously
                    apiClient.transferNonFungibleToken(nfTokenIds[3], device2, true, function (error, data) {
                        if (error) {
                            endTest('Error transferring non-fungible token: ' + error);
                        }
                        else {
                            expect(typeof data === 'object' && data !== null
                                && typeof data.tokenTransferId === 'string'
                            ).toBeTrue();

                            // Save token transfer ID
                            sharedData.tokenTransferId = tokenTransferId = data.tokenTransferId;
                        }
                    });
                }
            });
        }, 10000);
    });

    describe('Non-fungible token transfer progress.', function () {
        let tokenId;
        let tokenTransferId;

        beforeAll(function (done) {
            // Check if a new non-fungible asset needs to be issued
            if (!sharedData.tokenTransferId) {
                // Issue new non-fungible asset
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
                        // Save non-fungible token IDs
                        sharedData.nfTokenIds = data.nfTokenIds;

                        tokenId = data.nfTokenIds[3];

                        // Transfer non-fungible token asynchronously
                        apiClient.transferNonFungibleToken(tokenId, device2, true, function (error, data) {
                            if (error) {
                                done.fail('Error transferring non-fungible token: ' + error);
                            }
                            else {
                                // Save token transfer ID
                                tokenTransferId = data.tokenTransferId;

                                done();
                            }
                        });
                    }
                });
            }
            else {
                // Use existing token retrieval ID
                tokenId = sharedData.nfTokenIds[3];
                tokenTransferId = sharedData.tokenTransferId;

                done();
            }
        }, 10000);

        it('Retrieve non-fungible token transfer progress', function (done) {
            apiClient.retrieveNonFungibleTokenTransferProgress(tokenId, tokenTransferId, function (error, data) {
                if (error) {
                    done.fail('Error retrieving non-fungible token transfer progress: ' + error);
                }
                else {
                    expect(typeof data === 'object' && data !== null
                        && typeof data.progress === 'object'
                    ).toBeTrue();

                    done();
                }
            });
        });
    });
});
