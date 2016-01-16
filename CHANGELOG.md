# Change Log
All notable changes to this project will be documented in this file.
From version 0.1.0 forward, this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased - 0.1.0]
### Added
- Allow units to be linked from the web or other apps using ```openmentoring://``` custom urls
- Allow units to link to eachother
- If the user follows a link to a unit that has not been downloaded, prompt the user to download the topic
- Show an activity indicator when downloading a topic
- Add a changelog :)

### Fixed
- Allow ```ionic state reset``` to work properly (was broken when adding the custom url plugin)

## [0.0.4] - 2015-12-23
### Added
- Keep track of where the user is in a unit and ensure that it opens back up to the same spot

### Changed
- Differentiate the download and update buttons

### Fixed
- Reset to the first slide when switching to a new unit
- Fix rendering of local images on cards
