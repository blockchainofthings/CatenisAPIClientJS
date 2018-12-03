# Catenis API JavaScript Client

This JavaScript library is used to make it easier to access the Catenis Enterprise API services from a web browser.

This current release (1.8.0) targets version 0.6 of the Catenis Enterprise API.

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

```JavaScript
ctnApiClient.logMessage('My message', {
        encoding: 'utf8',
        encrypt: true,
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

### Sending a message to another device

```JavaScript
ctnApiClient.sendMessage({
        id: targetDeviceId,
        isProdUniqueId: false
    },
    'My message to send', {
        readConfirmation: true,
        encoding: 'utf8',
        encrypt: true,
        storage: 'auto'
    },
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            console.log('ID of sent message:', data.messageId);
        }
});
```

### Reading a message

```JavaScript
ctnApiClient.readMessage(messageId, 'utf8',
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            console.log('Message read:', data.message);
            
            if (data.action === 'send') {
                console.log('Message originally from:', data.from);
            }
        }
});
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
            console.log('ID of blockchain transaction containing the message:', data.blockchain.txid);

            if (data.externalStorage) {
                console.log('IPFS reference to message:', data.externalStorage.ipfs);
            }
        }
});
```

### Listing messages

```JavaScript
ctnApiClient.listMessages({
        action: 'send',
        direction: 'inbound',
        readState: 'unread',
        startDate: '20170101T000000Z'
    },
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
            if (data.msgCount > 0) {
                console.log('Returned messages:', data.messages);
                
                if (data.countExceeded) {
                    console.log('Warning: not all messages fulfilling search criteria have been returned!';
                }
            }
        }
});
```

> **Note**: the fields of the *options* parameter of the *listMessages* method are slightly different than the ones
>taken by the List Messages Catenis API method. In particular, fields `fromDeviceIds` and `fromDeviceProdUniqueIds`,
>and fields `toDeviceIds` and `toDeviceProdUniqueIds` are replaced by fields `fromDevices` and `toDevices`,
>respectively. Those fields take an array of device ID objects, which is the same type of object taken by the first
>parameter (`targetDevice`) of the *sendMessage* method. Also, the date fields, `startDate` and `endDate`, accept not
>only strings containing ISO8601 formatted dates/times but also *Date* objects.

### Issuing an amount of a new asset

```JavaScript
ctnApiClient.issueAsset({
        name: 'XYZ001'
        description: 'My first test asset'
        canReissue: true
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
ctnApiClient.retrieveAssetIssuanceHistory(assetId, '20170101T000000Z', null,
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

            if (data.countExceeded) {
                console.log('Warning: not all asset issuance events that took place within the specified time frame have been returned!';
            }
        }
});
```

> **Note**: the parameters of the *retrieveAssetIssuanceHistory* method are slightly different than the ones taken by
>the Retrieve Asset Issuance History Catenis API method. In particular, the date fields, `startDate` and `endDate`,
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
ctnApiClient.checkEffectivePermissionRight('receive-msg', deviceId, false,
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

### Receiving notifications

Instantiate WebSocket notification channel object.

```JavaScript
var wsNtfyChannel = ctnApiClient.createWsNotifyChannel(eventName);
```

Add listeners.

```JavaScript
wsNtfyChannel.addListener('error', function (error) {
    // Process error
});

wsNtfyChannel.addListener('close', function (code, reason) {
    // Process indication that WebSocket connection has been closed
});

wsNtfyChannel.addListener('message', function (data) {
    // Process received notification message
    console.log('Received notification message:', data);
});
```

Open notification channel.

```JavaScript
wsNtfyChannel.open(function (err) {
    if (err) {
        // Process WebSocket connection error
    }
    else {
        // Process indication that WebSocket connection is open
    }
});
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

Copyright © 2018, Blockchain of Things Inc.
