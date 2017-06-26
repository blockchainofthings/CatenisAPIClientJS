# Catenis API Javascript Client

This Javascript library is used to make it easier to access the Catenis API services from a web browser.

This current release (1.2.0) targets version 0.3 of the Catenis API.

## Development

### Environment setup

From the project's root directory, issue the following commands (it is assumed that nvm - Node Version Manager is installed) to set up the development environment.

```shell
nvm install
nvm use
npm install
```

### Build

Then issue the following command to generate the Javascript library (CatenisAPIClientJS.min.js), which should
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
ctnApiClient.retrieveMessageContainer({
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

## License

This Javascript library is released under the [MIT License](LICENSE). Feel free to fork, and modify!

Copyright © 2017, Blockchain of Things Inc.
