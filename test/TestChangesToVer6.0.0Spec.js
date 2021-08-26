describe('Test changes to Catenis API client ver. 6.0.0.', function  () {
    var device1 = {
        id: 'drc3XdxNtzoucpw9xiRp'
    };
    var accessKey1 = '4c1749c8e86f65e0a73e5fb19f2aa9e74a716bc22d7956bf3072b4bc3fbfe2a0d138ad0d4bcfee251e4e5f54d6e92b8fd4eb36958a7aeaeeb51e8d2fcc4552c3';
    var apiClient;
    var randomNumber;
    var asset;
    var foreignBlockchain = 'ethereum';
    var adminAddress = '0xe247c9BfDb17e7D8Ae60a744843ffAd19C784943';
    var amountToMigrate = 24.75;

    beforeAll(function (done) {
        randomNumber = function () {
            return Math.floor(Math.random() * 1000000000);
        };

        // Instantiate a Catenis API client
        apiClient = new CatenisApiClient(
            device1.id,
            accessKey1, {
                host: 'localhost:3000',
                secure: false
            }
        );

        var randomId = randomNumber();

        // Issue test asset
        asset = {
            randomId: randomId,
            info: {
                name: 'Test_asset_#' + randomId,
                canReissue: true,
                decimalPlaces: 2
            },
            token: {
                name: 'Catenis test token #' + randomId,
                symbol: 'CTK' + randomId
            }
        };

        apiClient.issueAsset(asset.info, 200, function (error, data) {
            if (error) {
                // Error. Throw exception
                throw new Error('Error issuing test asset: ' + error);
            }
            else {
                // Save asset ID
                asset.id = data.assetId;
                done();
            }
        });
    });

    it('should retrieve asset export price estimate', function (done) {
        apiClient.exportAsset(asset.id, foreignBlockchain, asset.token, {
            estimateOnly: true
        }, function (error, data) {
            if (error) {
                done.fail('Error getting asset export price estimate: ' + error);
            }
            else {
                // Success. Validate returned data
                expect(typeof data === 'object').toBeTrue();
                expect('estimatedPrice' in data).toBeTrue();

                done();
            }
        });
    });

    it('should export asset and receive notification of its final outcome', function (done) {
        // Create WebSocket notification channel to be notified when an asset export is finalized
        var wsNotifyChannel = apiClient.createWsNotifyChannel('asset-export-outcome');
        var ntfyChannelClosed = false;
        var foreignTxId;

        // Wire notification event
        wsNotifyChannel.addListener('error', function (error) {
            done.fail('Error with WebSocket notification channel: ' + error);
        });

        wsNotifyChannel.addListener('close', function (code, reason) {
            if (!ntfyChannelClosed) {
                done.fail('WebSocket notification channel closed unexpectedly. [' + code + '] - ' + reason);
            }
        });

        wsNotifyChannel.addListener('notify', function (data) {
            // Notification received. Make sure that it refers to the
            //  asset export that we are expecting
            if (data.assetId === asset.id && data.foreignBlockchain === foreignBlockchain) {
                if (data.status === 'success') {
                    // Asset export succeeded. Save token ID
                    asset.tokenId = data.token.id;

                    if (foreignTxId) {
                        // Export asset call has already returned.
                        //  Close notification channel, and end test case
                        ntfyChannelClosed = true;
                        wsNotifyChannel.close();
                        done();
                    }
                }
                else {
                    done.fail('Error executing foreign transaction to export asset: ' + data.foreignTransaction.error)
                }
            }
        });

        wsNotifyChannel.addListener('open', function () {
            // WebSocket notification channel is open.
            //  Export asset
            apiClient.exportAsset(asset.id, foreignBlockchain, asset.token, function (error, data) {
                if (error) {
                    done.fail('Error exporting asset: ' + error);
                }
                else {
                    // Success. Validate returned data
                    expect(typeof data === 'object').toBeTrue();
                    expect('foreignTransaction' in data).toBeTrue();
                    expect('token' in data).toBeTrue();
                    expect('status' in data).toBeTrue();
                    expect('date' in data).toBeTrue();

                    // Save foreign transaction ID
                    foreignTxId = data.foreignTransaction.txid;

                    if (asset.tokenId) {
                        // Notification already received.
                        //  Close notification channel, and end test case
                        ntfyChannelClosed = true;
                        wsNotifyChannel.close();
                        done();
                    }
                }
            });
        });

        // Open notification channel
        wsNotifyChannel.open(function (error) {
            if (error) {
                done.fail('Error opening WebSocket notification channel: ' + error);
            }
            else {
                // WebSocket client successfully connected. Wait for open event
            }
        });
    }, 5000);   // Set timeout to 5 sec

    it('should retrieve asset export outcome', function (done) {
        apiClient.assetExportOutcome(asset.id, foreignBlockchain, function (error, data) {
            if (error) {
                done.fail('Error retrieving asset export outcome: ' + error);
            }
            else {
                // Success. Validate returned data
                expect(typeof data === 'object').toBeTrue();
                expect('foreignTransaction' in data).toBeTrue();
                expect('token' in data).toBeTrue();
                expect('status' in data).toBeTrue();
                expect('date' in data).toBeTrue();
                expect(data.status).toBe('success');

                done();
            }
        });
    });

    it('should retrieve asset migration price estimate', function (done) {
        apiClient.migrateAsset(asset.id, foreignBlockchain, {
            direction: 'outward',
            amount: amountToMigrate,
            destAddress: adminAddress
        }, {
            estimateOnly: true
        }, function (error, data) {
            if (error) {
                done.fail('Error getting asset migration price estimate: ' + error);
            }
            else {
                // Success. Validate returned data
                expect(typeof data === 'object').toBeTrue();
                expect('estimatedPrice' in data).toBeTrue();

                done();
            }
        });
    });

    it('should migrate asset amount and receive notification of its final outcome', function (done) {
        // Create WebSocket notification channel to be notified when an asset migration is finalized
        var wsNotifyChannel = apiClient.createWsNotifyChannel('asset-migration-outcome');
        var ntfyChannelClosed = false;
        var ntfyData = [];

        // Wire notification event
        wsNotifyChannel.addListener('error', function (error) {
            done.fail('Error with WebSocket notification channel: ' + error);
        });

        wsNotifyChannel.addListener('close', function (code, reason) {
            if (!ntfyChannelClosed) {
                done.fail('WebSocket notification channel closed unexpectedly. [' + code + '] - ' + reason);
            }
        });

        wsNotifyChannel.addListener('notify', function (data) {
            // Notification received. Check if migrate asset call has already returned
            if (asset.migrationId) {
                // Make sure that notification refers to the asset migration that we are expecting
                if (data.migrationId === asset.migrationId) {
                    if (data.status === 'success') {
                        // Asset migration succeeded.
                        //  Close notification channel, and end test case
                        ntfyChannelClosed = true;
                        wsNotifyChannel.close();
                        done();
                    }
                    else {
                        done.fail('Error executing foreign transaction to migrate asset amount: ' + data.foreignTransaction.error)
                    }
                }
            }
            else {
                // Migrate asset call has not returned yet.
                //  Save notification data
                ntfyData.push(data);
            }
        });

        wsNotifyChannel.addListener('open', function () {
            // WebSocket notification channel is open.
            //  Migrate asset amount
            apiClient.migrateAsset(asset.id, foreignBlockchain, {
                direction: 'outward',
                amount: amountToMigrate,
                destAddress: adminAddress
            }, function (error, data) {
                if (error) {
                    done.fail('Error migrating asset: ' + error);
                }
                else {
                    // Success. Validate returned data
                    expect(typeof data === 'object').toBeTrue();
                    expect('migrationId' in data).toBeTrue();
                    expect('catenisService' in data).toBeTrue();
                    expect('foreignTransaction' in data).toBeTrue();
                    expect('status' in data).toBeTrue();
                    expect('date' in data).toBeTrue();

                    // Save asset migration ID
                    asset.migrationId = data.migrationId;

                    // Check if notification has already been received
                    var ntfyReceived = ntfyData.some(function (data) {
                        return data.migrationId === asset.migrationId;
                    });

                    if (ntfyReceived) {
                        // Notification already received.
                        //  Close notification channel, and end test case
                        ntfyChannelClosed = true;
                        wsNotifyChannel.close();
                        done();
                    }
                }
            });
        });

        // Open notification channel
        wsNotifyChannel.open(function (error) {
            if (error) {
                done.fail('Error opening WebSocket notification channel: ' + error);
            }
            else {
                // WebSocket client successfully connected. Wait for open event
            }
        });
    }, 5000);   // Set timeout to 5 sec

    it('should retrieve asset migration outcome', function (done) {
        apiClient.assetMigrationOutcome(asset.migrationId, function (error, data) {
            if (error) {
                done.fail('Error retrieving asset migration outcome: ' + error);
            }
            else {
                // Success. Validate returned data
                expect(typeof data === 'object').toBeTrue();
                expect('assetId' in data).toBeTrue();
                expect('foreignBlockchain' in data).toBeTrue();
                expect('direction' in data).toBeTrue();
                expect('amount' in data).toBeTrue();
                expect('catenisService' in data).toBeTrue();
                expect('foreignTransaction' in data).toBeTrue();
                expect('status' in data).toBeTrue();
                expect('date' in data).toBeTrue();
                expect(data.status).toBe('success');

                done();
            }
        });
    });

    it('should report the migrated asset amount', function (done) {
        apiClient.listAssetHolders(asset.id, function (error, data) {
            if (error) {
                done.fail('Error listing asset holders: ' + error);
            }
            else {
                // Success. Validate returned data
                expect(typeof data === 'object').toBeTrue();
                expect('assetHolders' in data).toBeTrue();
                expect(data.assetHolders.length).toEqual(2);
                expect(data.assetHolders[1].migrated).toBeTrue();
                expect(data.assetHolders[1].balance.total).toEqual(amountToMigrate);

                done();
            }
        });
    });

    it('should list the exported assets', function (done) {
        apiClient.listExportedAssets({
            assetId: asset.id,
            foreignBlockchain: foreignBlockchain,
            status: 'success'
        }, function (error, data) {
            if (error) {
                done.fail('Error listing exported assets: ' + error);
            }
            else {
                // Success. Validate returned data
                expect(typeof data === 'object').toBeTrue();
                expect('exportedAssets' in data).toBeTrue();
                expect(data.exportedAssets.length).toEqual(1);
                expect(typeof data.exportedAssets[0] === 'object').toBeTrue();
                expect('assetId' in data.exportedAssets[0]).toBeTrue();
                expect('foreignBlockchain' in data.exportedAssets[0]).toBeTrue();
                expect('foreignTransaction' in data.exportedAssets[0]).toBeTrue();
                expect('token' in data.exportedAssets[0]).toBeTrue();
                expect('status' in data.exportedAssets[0]).toBeTrue();
                expect('date' in data.exportedAssets[0]).toBeTrue();
                expect(data.exportedAssets[0].assetId).toBe(asset.id);
                expect(data.exportedAssets[0].foreignBlockchain).toBe(foreignBlockchain);
                expect(data.exportedAssets[0].status).toBe('success');

                done();
            }
        })
    });

    it('should list the asset migrations', function (done) {
        apiClient.listAssetMigrations({
            assetId: asset.id,
            foreignBlockchain: foreignBlockchain,
            direction: 'outward',
            status: 'success'
        }, function (error, data) {
            if (error) {
                done.fail('Error listing asset migrations: ' + error);
            }
            else {
                // Success. Validate returned data
                expect(typeof data === 'object').toBeTrue();
                expect('assetMigrations' in data).toBeTrue();
                expect(data.assetMigrations.length).toEqual(1);
                expect(typeof data.assetMigrations[0] === 'object').toBeTrue();
                expect('migrationId' in data.assetMigrations[0]).toBeTrue();
                expect('assetId' in data.assetMigrations[0]).toBeTrue();
                expect('foreignBlockchain' in data.assetMigrations[0]).toBeTrue();
                expect('direction' in data.assetMigrations[0]).toBeTrue();
                expect('amount' in data.assetMigrations[0]).toBeTrue();
                expect('catenisService' in data.assetMigrations[0]).toBeTrue();
                expect('foreignTransaction' in data.assetMigrations[0]).toBeTrue();
                expect('status' in data.assetMigrations[0]).toBeTrue();
                expect('date' in data.assetMigrations[0]).toBeTrue();
                expect(data.assetMigrations[0].assetId).toBe(asset.id);
                expect(data.assetMigrations[0].foreignBlockchain).toBe(foreignBlockchain);
                expect(data.assetMigrations[0].direction).toBe('outward');
                expect(data.assetMigrations[0].amount).toEqual(amountToMigrate);
                expect(data.assetMigrations[0].status).toBe('success');

                done();
            }
        })
    });
});