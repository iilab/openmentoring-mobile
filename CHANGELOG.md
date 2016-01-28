# Change Log
All notable changes to this project will be documented in this file.
From version 0.1.0 forward, this project adheres to [Semantic Versioning](http://semver.org/).

## [0.1.1] - 2016-01-28
### Added
- Menu item that shows a queue of units that have been started but not completed

### Changed
- When a topic has not yet been downloaded, tapping on any of the units in it will kick off the download

## [0.1.0] - 2016-01-22
### Added
- Allow units to be linked from the web or other apps using ```openmentoring://``` custom urls
- Allow units to link to eachother
- If the user follows a link to a unit that has not been downloaded, prompt the user to download the topic
- Show an activity indicator when downloading a topic
- Add a changelog :)

### Changed
- Updated Ionic from 1.1.1 to 1.2.4

### Fixed
- Allow ```ionic state reset``` to work properly (was broken when adding the custom url plugin)
- Fixed typos on the About screen
- Fixed issue with "pull to refresh" element remaining onscreen after a partial pull

## [0.0.4] - 2015-12-23
### Added
- Keep track of where the user is in a unit and ensure that it opens back up to the same spot

### Changed
- Differentiate the download and update buttons

### Fixed
- Reset to the first slide when switching to a new unit
- Fix rendering of local images on cards
