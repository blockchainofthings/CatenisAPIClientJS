# Catenis API JavaScript Client

This JavaScript library is used to make it easier to access the Catenis Enterprise API services from a web browser.

This current release (1.4.0) targets version 0.5 of the Catenis Enterprise API.

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

```shell
<script src="CatenisAPIClientJS.min.js"></script>
```

### Instantiate the client
 
```shell
var ctnApiClient = new CtnApiClient(deviceId, apiAccessSecret, {
    environment: 'beta'
});
```

### Logging (storing) a message to the blockchain

```shell
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
        }
});
```

### Sending a message to another device

```shell
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
        }
});
```

### Reading a message

```shell
ctnApiClient.readMessage(messageId, 'utf8',
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
        }
});
```

### Retrieving information about a message's container

```shell
ctnApiClient.retrieveMessageContainer(messageId,
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
        }
});
```

### List messages

```shell
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
        }
});
```

### List permission events

```shell
ctnApiClient.listPermissionEvents(function (err, data) {
    if (err) {
        // Process error
    }
    else {
        // Process returned data
    }
});
```

### Retrieve permission rights

```shell
ctnApiClient.retrievePermissionRights('receive_msg',
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
        }
});
```

### Set permission rights

```shell
ctnApiClient.setPermissionRights('receive_msg', {
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
        }
});
```

### Check effective permission right

```shell
ctnApiClient.checkEffectivePermissionRight('receive_msg', deviceId, false,
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
        }
});
```

### List notification events

```shell
ctnApiClient.listNotificationEvents(function (err, data) {
    if (err) {
        // Process error
    }
    else {
        // Process returned data
    }
});
```

### Retrieve device identification information

```shell
ctnApiClient.retrieveDeviceIdentificationInfo(deviceId, false,
    function (err, data) {
        if (err) {
            // Process error
        }
        else {
            // Process returned data
        }
});
```

### Receiving notifications

Instantiate WebSocket notification channel object.

```shell
var wsNtfyChannel = ctnApiClient.createWsNotifyChannel(eventName);
```

Add listeners.

```shell
wsNtfyChannel.addListener('error', function (error) {
    // Process error
});

wsNtfyChannel.addListener('close', function (code, reason) {
    // Process indication that WebSocket connection has been closed
});

wsNtfyChannel.addListener('message', function (data) {
    // Process received notification message
});
```

Open notification channel.

```shell
wsNtfyChannel.open(function (err) {
    if (err) {
        // Process WebSocket connection error
    }
    else {
        // Process indication that WebSocket connection is open
    }
});
```

## License

This JavaScript library is released under the [MIT License](LICENSE). Feel free to fork, and modify!

Copyright © 2018, Blockchain of Things Inc.
