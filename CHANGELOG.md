# Changelog

## [7.1.0] - 2022-11-25

### New features
- Added support for changes introduced by version 0.13 of the Catenis API: new non-fungible assets related API methods
  List Owned Non-Fungible Tokens, Get Non-Fungible Token Owner, Check Non-Fungible Token Ownership.

## [7.0.0] - 2022-08-29

### Breaking changes
- The issuance event entries returned by the *retrieveAssetIssuanceHistory* method for non-fungible assets are different
  from the ones returned for regular (fungible) assets as per the new behavior of version 0.12 of the Catenis API. The
  observed differences are: the `amount` property is replaced by a new `nfTokenIds` property, which lists the IDs of the
  non-fungible tokens that have been issued; and the `holdingDevice` property is replaced by a new `holdingDevices`
  property, which lists the Catenis virtual devices to which the issued non-fungible tokens have been assigned.

### New features
- Added support for changes introduced by version 0.12 of the Catenis API: new non-fungible assets feature, including
  the new API methods Issue Non-Fungible Asset, Reissue Non-Fungible Asset, Retrieve Non-Fungible Asset Issuance
  Progress, Retrieve Non-Fungible Token, Retrieve Non-Fungible Token Retrieval Progress, Transfer Non-Fungible Token,
  Retrieve Non-Fungible Token Transfer Progress.

## [6.0.1] - 2021-09-04

### Fixes
- Enhance build process and fix properties of generated source map.

## [6.0.0] - 2021-09-02

### Breaking changes
- The list of current asset holders returned by the *listAssetHolders* method may now include an entry that reports the
  total asset amount that is currently migrated to foreign blockchains as per the new behavior of version 0.11 of the
  Catenis API. That entry differs from the regular ones in that the `holder` property is missing and a new boolean type
  property named `migrated`, the value of which is always `true`, is present.

### New features
- Added support for changes introduced by version 0.11 of the Catenis API: new asset export feature, including the new
 API methods Export Asset, Migrate Asset, Asset Export Outcome, Asset Migration Outcome, List Exported Assets, and
 List Asset Migrations.

## [5.1.0] - 2020-07-01

### New features
- Added support for changes introduced by version 0.10 of the Catenis API: new public API method Retrieve
 Message Origin.

## [5.0.1] - 2020-01-23

### Changes
- Add missing information to header comment of logMessage() and readMessage() methods.
- Update README file to fix sample code for retrieving information about a message's container.

## [5.0.0] - 2020-01-21

### Breaking changes
- When calling the *LogMessage* and *SendMessage* methods without specifying a value for the new `off-chain` property of
 the *options* parameter, off-chain messages are used. Thus any existing code that uses those methods, when changed to
 use this new version of the Catenis API client — provided that the client is instantiated with its default API version
 (0.9) —, will produce a different result. To get the same behavior as before, the `off-chain` property of the *options*
 parameter needs to be set to ***false***.

### Changes
- The default version of the Catenis API (when instantiating the API client) is now set to 0.9.

### New features
- As a consequence for targeting version 0.9 of the Catenis API, the new features introduced by that version
 are supported: log, send, read and retrieve container info of Catenis off-chain messages.

## [4.0.2] - 2019-08-21

### Fixes
- Properly restore any version of the Stanford Javascript Crypto Library that might have been loaded before the Catenis
 API client library is loaded.

## [4.0.1] - 2019-08-19

### Changes
- Updated README file to fix sample code for using API methods that had their interface changed in version 4.0.0 of the library.

## [4.0.0] - 2019-08-16

### Breaking changes
- The `countExceeded` property of the object returned from a successful call to the *listMessages* method has been
 replaced with the new `hasMore` property.
- The `countExceeded` property of the object returned from a successful call to the *retrieveAssetIssuanceHistory*
 method has been replaced with the new `hasMore` property.

### Changes
- Changed interface of *listMessages* method: first parameter renamed to `selector`; new parameters `limit` and `skip` added.
- Changed interface of *retrieveAssetIssuanceHistory* method: new parameters `limit` and `skip` added.

### New features
- Added options (when instantiating API client) to send compressed data, which is on by default.
- Added support for changes introduced by version 0.8 of the Catenis API: "pagination" (limit/skip) for API
 methods List Messages and Retrieve Asset Issuance History; new URI format for notification endpoints.

## [3.1.0] - 2019-05-29

### New features
- WebSocket notification channel object emits new `open` event.

## [3.0.1] - 2019-03-26

### Changes
- Small fixes to sample code in README file.

## [3.0.0] - 2019-03-13

### Breaking changes
- Changed interface of *sendMessage* method: parameters `message` and `targetDevice` have swapped positions.
- The object returned from a successful call to the *readMessage* method has a different structure.

### New features
- Added support for changes introduced by version 0.7 of the Catenis API: log, send and read message in chunks.

## [2.2.1] - 2019-01-25

### Fixes
- Changed setting on jQuery so AJAX calls work on Internet Explorer

## [2.2.0] - 2019-01-02

### Changes
- Changed interface of API methods that take optional parameters so that the optional parameters can be suppressed when
 calling those methods.

## [2.1.0] - 2018-12-10

### Deprecations
- The `message` event of the WebSocket notification channel object has been deprecated in favour of the new `notify`
 event. The difference between the two is that the new `notify` event returns a deserialized JSON object whereas the
 `message` event returns the originally received JSON string.

### New features
- New `notify` event added to WebSocket notification channel object.

## [2.0.0] - 2018-12-03

### Breaking changes
- Replaced name of Catenis API Client constructor object from *CtnApiClient* to *CatenisApiClient*.
- Changed interface of *listMessages* method: fields `fromDeviceIds`, `fromDeviceProdUniqueIds`, `toDeviceIds`,
 and `toDeviceProdUniqueIds` of *options* parameter replaced with fields `fromDevices` and `toDevices`.
- Changed type of returned error from API method calls.

### Other changes
- Changed interface of *listMessages* method: date fields now accept *Date* objects in addition to strings.
- Changed interface of *retrieveAssetIssuanceHistory* method: date fields now accept *Date* object in addition to
 strings.
- Removed unnecessary instance variables from *CatenisApiClient* objects.
- Updated README file to account for the new Catenis API Client constructor name, and the changes in the API methods and error handling.
- Added CHANGELOG (this) file.

### Fixes
- Proper handling of time stamp and sign date values used for signing request.
- Signing of requests with empty URL parameters.
