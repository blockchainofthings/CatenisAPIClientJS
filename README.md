# Catenis API JavaScript Client

This JavaScript library is used to make it easier to access the Catenis Enterprise API services from a web browser.

This current release (5.0.0) targets version 0.9 of the Catenis Enterprise API.

## Development

### Environment setup

From the project's root directory, issue the following commands (it is assumed that nvm - Node Version Manager is installed) to set up the development environment.

```shell
nvm install
nvm use
npm install
```

### Build

Then issue the following command to generate the JavaScript library (CatenisAPIClientJS.min.js), which should
be saved to the ``build`` directory along with its corresponding map file (CatenisAPIClientJS.min.map).

```shell
npm run build
```

## Usage

Load the CatenisAPIClentJS.min.js library onto an HTML page using a ```<script>``` tag.

```html
<script src="CatenisAPIClientJS.min.js"></script>
```

### Instantiate the client
 
```JavaScript
var ctnApiClient = new CatenisApiClient(deviceId, apiAccessSecret, {
    environment: 'sandbox'
});
```

#### Constructor options

The following options can be used when instantiating the client:

- **host** \[String\] - (optional, default: <b>*'catenis.io'*</b>) Host name (with optional port) of target Catenis API server.
- **environment** \[String\] - (optional, default: <b>*'prod'*</b>) Environment of target Catenis API server. Valid values: *'prod'*, *'sandbox'*.
- **secure** \[Boolean\] - (optional, default: ***true***) Indicates whether a secure connection (HTTPS) should be used.
- **version** \[String\] - (optional, default: <b>*'0.9'*</b>) Version of Catenis API to target.
- **useCompression** \[Boolean\] - (optional, default: ***true***) Indicates whether request body should be compressed.
- **compressThreshold** \[Number\] - (optional, default: ***1024***) Minimum size, in bytes, of request body for it to be compressed.

> **Note**: modern web browsers will always accept compressed request responses.

### Returned data

On successful calls to the Catenis API, the data returned by the client library methods **only** include the `data` property of the JSON
originally returned in response to a Catenis API request.

For example, you should expect the following data structure to be returned from a successful call to the `logMessage` method:

```JavaScript
{
    messageId: "<message_id>"
}
```

### Logging (storing) a message to the blockchain

#### Passing the whole message's contents at once

```JavaScript
ctnApiClient.logMessage('My message', {
        encoding: 'utf8',
        encrypt: true,
        offChain: true,
        storage: 'auto'
    },
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            console.log('ID of logged message:', data.messageId);
        }
});
```

#### Passing the message's contents in chunks

```JavaScript
var logMsgChunk = function (msgParts, msgIdx, continuationToken) {
    msgIdx = msgIdx || 0;
    
    ctnApiClient.logMessage({
        data: msgParts[msgIdx],
        isFinal: msgIdx === msgParts.length - 1,
        continuationToken: continuationToken
    }, {
        encoding: 'utf8',
        encrypt: true,
        offChain: true,
        storage: 'auto'
    },
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            if (data.continuationToken) {
                // Get continuation token and send next part of message
                logMsgChunk(msgParts, msgIdx + 1, data.continuationToken);
            }
            else {
                console.log('ID of logged message:', data.messageId);
            }
        }
    });
};

// Start sending message to be logged
logMsgChunk([
    'First part of message',
    'Second part of message',
    'Third and last part of message'
]);
```

#### Logging message asynchronously

```JavaScript
var getAsyncProgress = function (provisionalMessageId) {
    ctnApiClient.retrieveMessageProgress(provisionalMessageId,
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            console.log('Number of bytes processed so far:', data.progress.bytesProcessed);
                
            if (data.progress.done) {
                if (data.progress.success) {
                    // Get result
                    console.log('ID of logged message:', data.result.messageId);
                }
                else {
                    // Process error
                    console.error('Asynchronous processing error: [', data.progress.error.code, ' ] -', data.progress.error.message);
                }
            }
            else {
                // Asynchronous processing not done yet. Continue pooling
                setTimeout(getAsyncProgress, 100, provisionalMessageId);
            }
        }
    });
};

ctnApiClient.logMessage('My message', {
        encoding: 'utf8',
        encrypt: true,
        offChain: true,
        storage: 'auto',
        async: true
    },
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Start pooling for asynchronous processing progress
            setTimeout(getAsyncProgress, 100, data.provisionalMessageId);
        }
});
```

### Sending a message to another device

#### Passing the whole message's contents at once

```JavaScript
ctnApiClient.sendMessage('My message', {
       id: targetDeviceId,
       isProdUniqueId: false
    }, {
        encoding: 'utf8',
        encrypt: true,
        offChain: true,
        storage: 'auto',
        readConfirmation: true
    },
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            console.send('ID of sent message:', data.messageId);
        }
});
```

#### Passing the message's contents in chunks

```JavaScript
var sendMsgChunk = function (msgChunks, msgIdx, continuationToken) {
    msgIdx = msgIdx || 0;
    
    ctnApiClient.sendMessage({
        data: msgChunks[msgIdx],
        isFinal: msgIdx === msgChunks.length - 1,
        continuationToken: continuationToken
    }, {
       id: targetDeviceId,
       isProdUniqueId: false
    }, {
        encoding: 'utf8',
        encrypt: true,
        offChain: true,
        storage: 'auto',
        readConfirmation: true
    },
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            if (data.continuationToken) {
                // Get continuation token and send next part of message
                sendMsgChunk(msgChunks, msgIdx + 1, data.continuationToken);
            }
            else {
                console.log('ID of sent message:', data.messageId);
            }
        }
    });
};

// Start sending message
sendMsgChunk([
    'First part of message',
    'Second part of message',
    'Third and last part of message'
]);
```

#### Sending message asynchronously

```JavaScript
var getAsyncProgress = function (provisionalMessageId) {
    ctnApiClient.retrieveMessageProgress(provisionalMessageId,
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            console.log('Number of bytes processed so far:', data.progress.bytesProcessed);
                
            if (data.progress.done) {
                if (data.progress.success) {
                    // Get result
                    console.log('ID of logged message:', data.result.messageId);
                }
                else {
                    // Process error
                    console.error('Asynchronous processing error: [', data.progress.error.code, ' ] -', data.progress.error.message);
                }
            }
            else {
                // Asynchronous processing not done yet. Continue pooling
                setTimeout(getAsyncProgress, 100, provisionalMessageId);
            }
        }
    });
};

ctnApiClient.sendMessage('My message', {
       id: targetDeviceId,
       isProdUniqueId: false
    }, {
        encoding: 'utf8',
        encrypt: true,
        offChain: true,
        storage: 'auto',
        readConfirmation: true,
        async: true
    },
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Start pooling for asynchronous processing progress
            setTimeout(getAsyncProgress, 100, data.provisionalMessageId);
        }
});
```

### Reading a message

#### Retrieving the whole read message's contents at once
 
```JavaScript
ctnApiClient.readMessage(messageId, 'utf8',
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            if (data.msgInfo.action === 'send') {
                console.log('Message sent from:', data.msgInfo.from);
            }

            console.log('Read message:', data.msgData);
        }
});
```

#### Retrieving the read message's contents in chunks

```JavaScript
var readMsgChunk = function (messageId, chunkCount, continuationToken) {
    chunkCount = chunkCount || 1;
    
    ctnApiClient.readMessage(messageId, {
        encoding: 'utf8',
        continuationToken: continuationToken,
        dataChunkSize: 1024
    },
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            if (data.msgInfo && data.msgInfo.action === 'send') {
                console.log('Message sent from:', data.msgInfo.from);
            }
            
            console.log('Read message (part', chunkCount, '):', data.msgData);
            
            if (data.continuationToken) {
                // Get continuation token and get next part of message
                readMsgChunk(messageId, chunkCount + 1, data.continuationToken);
            }
        }
    });
};

// Start reading message
readMsgChunk(messageId);
```

#### Reading message asynchronously

```JavaScript
var getAsyncProgress = function (cachedMessageId) {
    ctnApiClient.retrieveMessageProgress(cachedMessageId,
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            console.log('Number of bytes processed so far:', data.progress.bytesProcessed);
                
            if (data.progress.done) {
                if (data.progress.success) {
                    // Actually read the message now
                    readMsg(data.result.messageId, data.result.cachedMessageId);
                }
                else {
                    // Process error
                    console.error('Asynchronous processing error: [', data.progress.error.code, ' ] -', data.progress.error.message);
                }
            }
            else {
                // Asynchronous processing not done yet. Continue pooling
                setTimeout(getAsyncProgress, 100, cachedMessageId);
            }
        }
    });
};

var readMsg = function (messageId, continuationToken) {
    ctnApiClient.readMessage(messageId, {
        encoding: 'utf8',
        continuationToken: continuationToken,
        async: true
    },
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            if (data.cachedMessageId) {
                // Start pooling for asynchronous processing progress
                setTimeout(getAsyncProgress, 100, data.cachedMessageId);
            }
            else {
                if (data.msgInfo.action === 'send') {
                    console.log('Message sent from:', data.msgInfo.from);
                }
                
                console.log('Read message:', data.msgData);
            }
        }
    });
};

// Start reading message
readMsg(messageId);
```

### Retrieving information about a message's container

```JavaScript
ctnApiClient.retrieveMessageContainer(messageId,
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            if (data.offChain) {
                console.log('IPFS CID of Catenis off-chain message envelope:', data.offChain.cid);
            }
            
            if (data.blockchain) {
                console.log('ID of blockchain transaction containing the message:', data.blockchain.txid);
            }
    
            if (data.externalStorage) {
                console.log('IPFS reference to message:', data.externalStorage.ipfs);
            }
        }
});
```

### Retrieving asynchronous message processing progress

```JavaScript
ctnApiClient.retrieveMessageProgress(provisionalMessageId,
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            console.log('Number of bytes processed so far:', data.progress.bytesProcessed);
                
            if (data.progress.done) {
                if (data.progress.success) {
                    // Get result
                    console.log('Asynchronous processing result:', data.result);
                }
                else {
                    // Process error
                    console.error('Asynchronous processing error: [', data.progress.error.code, ' ] -', data.progress.error.message);
                }
            }
            else {
                // Asynchronous processing not done yet. Continue pooling
            }
        }
});
```

> **Note**: see the *Logging message asynchronously*, *Sending message asynchronously* and *Reading message
>asynchronously* sections above for more complete examples.

### Listing messages

```JavaScript
ctnApiClient.listMessages({
        action: 'send',
        direction: 'inbound',
        readState: 'unread',
        startDate: '20170101T000000Z'
    }, 200, 0,
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            if (data.msgCount > 0) {
                console.log('Returned messages:', data.messages);
                
                if (data.hasMore) {
                    console.log('Not all messages have been returned');
                }
            }
        }
});
```

> **Note**: the parameters taken by the *listMessages* method do not exactly match the parameters taken by the List
 Messages Catenis API method. Most of the parameters, with the exception of the last two (`limit` and `skip`), are
 mapped to fields of the first parameter (`selector`) of the *listMessages* method with a few singularities: parameters
 `fromDeviceIds` and `fromDeviceProdUniqueIds` and parameters `toDeviceIds` and `toDeviceProdUniqueIds` are replaced with
 fields `fromDevices` and `toDevices`, respectively. Those fields take an array of device ID objects, which is the same
 type of object taken by the first parameter (`targetDevice`) of the *sendMessage* method. Also, the date fields,
 `startDate` and `endDate`, accept not only strings containing ISO8601 formatted dates/times but also *Date* objects.

### Issuing an amount of a new asset

```JavaScript
ctnApiClient.issueAsset({
        name: 'XYZ001',
        description: 'My first test asset',
        canReissue: true,
        decimalPlaces: 2
    }, 1500.00, null,
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            console.log('ID of newly issued asset:', data.assetId);
        }
});
```

### Issuing an additional amount of an existing asset

```JavaScript
ctnApiClient.reissueAsset(assetId, 650.25, {
        id: otherDeviceId,
        isProdUniqueId: false
    },
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            console.log('Total existent asset balance (after issuance):', data.totalExistentBalance);
        }
});
```

### Transferring an amount of an asset to another device

```JavaScript
ctnApiClient.transferAsset(assetId, 50.75, {
        id: otherDeviceId,
        isProdUniqueId: false
    },
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            console.log('Remaining asset balance:', data.remainingBalance);
        }
});
```

### Retrieving information about a given asset

```JavaScript
ctnApiClient.retrieveAssetInfo(assetId,
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            console.log('Asset info:', data);
        }
});
```

### Getting the current balance of a given asset held by the device

```JavaScript
ctnApiClient.getAssetBalance(assetId,
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            console.log('Current asset balance:', data.balance.total);
            console.log('Amount not yet confirmed:', data.balance.unconfirmed);
        }
});
```

### Listing assets owned by the device

```JavaScript
ctnApiClient.listOwnedAssets(200, 0,
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            data.ownedAssets.forEach(function (ownedAsset, idx) {
                console.log('Owned asset #', idx + 1, ':');
                console.log('  - asset ID:', ownedAsset.assetId);
                console.log('  - current asset balance:', ownedAsset.balance.total);
                console.log('  - amount not yet confirmed:', ownedAsset.balance.unconfirmed);
            });

            if (data.hasMore) {
                console.log('Not all owned assets have been returned');
            }
        }
});
```

### Listing assets issued by the device

```JavaScript
ctnApiClient.listIssuedAssets(200, 0,
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            data.issuedAssets.forEach(function (issuedAsset, idx) {
                console.log('Issued asset #', idx + 1, ':');
                console.log('  - asset ID:', issuedAsset.assetId);
                console.log('  - total existent balance:', issuedAsset.totalExistentBalance);
            });

            if (data.hasMore) {
                console.log('Not all issued assets have been returned');
            }
        }
});
```

### Retrieving issuance history for a given asset

```JavaScript
ctnApiClient.retrieveAssetIssuanceHistory(assetId, '20170101T000000Z', null, 200, 0,
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            data.issuanceEvents.forEach(function (issuanceEvent, idx) {
                console.log('Issuance event #', idx + 1, ':');
                console.log('  - issued amount:', issuanceEvent.amount);
                console.log('  - device to which issued amount had been assigned:', issuanceEvent.holdingDevice);
                console.log('  - date of issuance:', issuanceEvent.date);
            });

            if (data.hasMore) {
                console.log('Not all asset issuance events have been returned');
            }
        }
});
```

> **Note**: the parameters of the *retrieveAssetIssuanceHistory* method are slightly different than the ones taken by
>the Retrieve Asset Issuance History Catenis API method. In particular, the date parameters, `startDate` and `endDate`,
>accept not only strings containing ISO8601 formatted dates/times but also *Date* objects.

### Listing devices that currently hold any amount of a given asset

```JavaScript
ctnApiClient.listAssetHolders(assetId, 200, 0,
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            data.assetHolders.forEach(function (assetHolder, idx) {
                console.log('Asset holder #', idx + 1, ':');
                console.log('  - device holding an amount of the asset:', assetHolder.holder);
                console.log('  - amount of asset currently held by device:', assetHolder.balance.total);
                console.log('  - amount not yet confirmed:', assetHolder.balance.unconfirmed);
            });

            if (data.hasMore) {
                console.log('Not all asset holders have been returned');
            }
        }
});
```

### Listing system defined permission events

```JavaScript
ctnApiClient.listPermissionEvents(function (err, data) {
    if (err) {
        // Process error
    }
    else {
        // Process returned data
        Object.keys(data).forEach(function (eventName) {
            console.log('Event name:', eventName, '; event description:', data[eventName]);
        });
    }
});
```

### Retrieving permission rights currently set for a specified permission event

```JavaScript
ctnApiClient.retrievePermissionRights('receive-msg',
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            console.log('Default (system) permission right:', data.system);
            
            if (data.catenisNode) {
                if (data.catenisNode.allow) {
                    console.log('Index of Catenis nodes with \'allow\' permission right:', data.catenisNode.allow);
                }
                
                if (data.catenisNode.deny) {
                    console.log('Index of Catenis nodes with \'deny\' permission right:', data.catenisNode.deny);
                }
            }
            
            if (data.client) {
                if (data.client.allow) {
                    console.log('ID of clients with \'allow\' permission right:', data.client.allow);
                }
                
                if (data.client.deny) {
                    console.log('ID of clients with \'deny\' permission right:', data.client.deny);
                }
            }
            
            if (data.device) {
                if (data.device.allow) {
                    console.log('Devices with \'allow\' permission right:', data.device.allow);
                }
                
                if (data.device.deny) {
                    console.log('Devices with \'deny\' permission right:', data.device.deny);
                }
            }
        }
});
```

### Setting permission rights at different levels for a specified permission event

```JavaScript
ctnApiClient.setPermissionRights('receive-msg', {
        system: 'deny',
        catenisNode: {
            allow: 'self'
        },
        client: {
            allow: [
                'self',
                clientId
            ]
        },
        device: {
            deny: [{
                id: deviceId1
            }, {
                id: 'ABCD001',
                isProdUniqueId: true
            }]
        }
    },
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            console.log('Permission rights successfully set');
        }
});
```

### Checking effective permission right applied to a given device for a specified permission event

```JavaScript
ctnApiClient.checkEffectivePermissionRight('receive-msg', deviceProdUniqueId, true,
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            var deviceId = Object.keys(data)[0];
            
            console.log('Effective right for device', deviceId, ':', data[deviceId]);
        }
});
```

### Retrieving identification information of a given device

```JavaScript
ctnApiClient.retrieveDeviceIdentificationInfo(deviceId, false,
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            console.log('Device\'s Catenis node ID info:', data.catenisNode);
            console.log('Device\'s client ID info:', data.client);
            console.log('Device\'s own ID info:', data.device);
        }
});
```

### Listing system defined notification events

```JavaScript
ctnApiClient.listNotificationEvents(function (err, data) {
    if (err) {
        // Process error
    }
    else {
        // Process returned data
        Object.keys(data).forEach(function (eventName) {
            console.log('Event name:', eventName, '; event description:', data[eventName]);
        });
    }
});
```

## Notifications

The Catenis API JavaScript Client makes it easy for receiving notifications from the Catenis system by embedding a
WebSocket client. All the end user needs to do is open a WebSocket notification channel for the desired Catenis
notification event, and monitor the activity on that channel.

### Receiving notifications

Instantiate WebSocket notification channel object.

```JavaScript
var wsNtfyChannel = ctnApiClient.createWsNotifyChannel(eventName);
```

Add listeners.

```JavaScript
wsNtfyChannel.addListener('error', function (error) {
    // Process error in the underlying WebSocket connection
});

wsNtfyChannel.addListener('close', function (code, reason) {
    // Process indication that underlying WebSocket connection has been closed
});

wsNtfyChannel.addListener('open', function () {
    // Process indication that notification channel is successfully open
    //  and ready to send notifications 
});

wsNtfyChannel.addListener('notify', function (data) {
    // Process received notification
    console.log('Received notification:', data);
});
```

> **Note**: the `data` argument of the *notify* event contains the deserialized JSON notification message (an object)
 of the corresponding notification event.

Open notification channel.

```JavaScript
wsNtfyChannel.open(function (err) {
    if (err) {
        // Process error establishing underlying WebSocket connection
    }
    else {
        // WebSocket client successfully connected. Wait for open event to make
        //  sure that notification channel is ready to send notifications
    }
});
```

Close notification channel.

```JavaScript
wsNtfyChannel.close();
```

## Error handling

Two types of error can take place when calling API methods: client or API error.

Client errors return generic error objects.

> **Note**: ajax errors are reported by an Error object the message of which starts with the text *"Ajax error"*. This
> error object also has a custom field named *jqXHR*, which contains the jQuery XMLHttpRequest object returned by the
> ajax call.

API errors, on the other hand, return a custom **CatenisApiError** object.

**CatenisApiError** objects are extended from Javascript's standard *Error* object, so they share the same
 characteristics with the following exceptions:

- The the value of the *name* field is set to `CatenisApiError`
- It has the following additional fields: *httpStatusMessage*, *httpStatusCode*, and *ctnErrorMessage*

> **Note**: the *ctnErrorMessage* field of the CatenisApiError object contains the error message returned by the
 Catenis system. However, there might be cases where that field is **undefined**.

Usage example:

```JavaScript
ctnApiClient.readMessage('INVALID_MSG_ID', null,
    function (err, data) {
        if (err) {
            if (err instanceof CatenisApiError) {
                // Catenis API error
                console.log('HTTP status code:', err.httpStatusCode);
                console.log('HTTP status message:', err.httpStatusMessage);
                console.log('Catenis error message:', err.ctnErrorMessage);
                console.log('Compiled error message:', err.message);
            }
            else {
                // Client error
                console.log(err);
            }
        }
        else {
            // Process returned data
        }
});
```

Expected result:

```
HTTP status code: 400
HTTP status message: Bad Request
Catenis error message: Invalid message ID
Compiled error message: Error returned from Catenis API endpoint: [400] Invalid message ID
```

## Catenis Enterprise API Documentation

For further information on the Catenis Enterprise API, please reference the [Catenis Enterprise API Documentation](https://catenis.com/docs/api).

## License

This JavaScript library is released under the [MIT License](LICENSE). Feel free to fork, and modify!

Copyright © 2020, Blockchain of Things Inc.
