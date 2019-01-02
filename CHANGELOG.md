# Changelog

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
