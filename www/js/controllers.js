angular.module('starter.controllers', ['starter.services'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, DBService) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  // Form data for the settings modal
  $scope.settingsData = {
    platforms: [
      { text: "Android", checked: true },
      { text: "iOS (iPhone or iPad)", checked: false },
      { text: "Windows", checked: false },
      { text: "OSX (Mac)", checked: false },
      { text: "Linux", checked: false }
    ],
    contentUrl: "http://openmentoring.io",
    profile: "journo"
  };

  // Create the settings modal that we will use later
  $ionicModal.fromTemplateUrl('templates/settings.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.settingsModal = modal;
  });

  // Triggered in the settings modal to close it
  $scope.closeSettings = function() {
    $scope.settingsModal.hide();
  };

  // Open the settings modal
  $scope.settings = function() {
    $scope.settingsModal.show();
  };

  // Perform the settings action when the user submits the settings form
  $scope.doSettings = function() {
    console.log('Doing settings', $scope.settingsData);
    $scope.closeSettings();
  };
})

.controller('TopicsCtrl', function($scope, $http, $ionicPlatform, $ionicScrollDelegate, $ionicModal, $cordovaFileTransfer, $cordovaZip, $timeout, DBService) {

  var filterBarInstance;

  $scope.allowRefresh = true;

  function doFilter() {
    //TODO: apply filter based on results from lunr
    console.log('doFilter');

    if(_.isEmpty($scope.search)) {
      resetViewState($scope.topics);
    } else {
      var results = DBService.doSearch($scope.search);
      var resultsHash = _.indexBy(results,'ref');
      $scope.topics.forEach(function(topic){
        topic.isVisible = resultsHash[topic.slug];
        topic.showUnits = false;
        topic.units.forEach(function(unit){
          unit.isVisible = resultsHash[unit.slug];
          if(unit.isVisible) {
            topic.isVisible = true;
          }
        });
      });
    }
  };

  $scope.swiper = {};
  $scope.currentUnit = null;
  $scope.onReadySwiper = function (swiper) {
    $scope.swiper = swiper;

    swiper.on('slideChangeEnd', function (sw) {
      DBService.logUnitAdvance($scope.currentUnit, sw.activeIndex, sw.isEnd);
    });
  };

  $ionicModal.fromTemplateUrl('templates/unit.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  $scope.$on('$destroy', function(){
    $scope.modal.remove();
  });

  $scope.updateFilter = function() {
    $ionicScrollDelegate.scrollTop();
    doFilter();
  };

  $scope.clearSearch = function() {
    $scope.search = '';
    $scope.updateFilter();
  };

  $scope.toggleUnits = function(topic) {
    if(topic.showUnits) {
      topic.showUnits = false;
    } else {
      topic.showUnits = true;
    }
  };

  function resetViewState(nestedList) {
    nestedList.forEach(function(topic){
      topic.isVisible = true;
      topic.showUnits = false;
      topic.units.forEach(function(unit){
        unit.isVisible = false;
      });
    });
  };

  var INDEX_URL = $scope.settingsData.contentUrl + '/index.json';

  $scope.refreshTopics = function() {
    if($scope.allowRefresh) {
      $http({
        method: 'GET',
        url: INDEX_URL,
        responseType: 'json'
      }).then(function (resp) {
        var topics = DBService.loadTopics(resp.data.items);
        $scope.topics = topics;
        doFilter();
      }, function(err) {
        // Error
        console.log('error');
        console.log(err);
      }).finally(function() {
        // Stop the ion-refresher from spinning
        $scope.$broadcast('scroll.refreshComplete');
        if(window.skipToUnit) {
          $scope.openUnit(window.skipToUnit);
          window.skipToUnit = null;
        }
      });
    } else {
      //quickly return if we've disabled the refresher
      $scope.$broadcast('scroll.refreshComplete');
    }
  };

  $scope.openUnit = function(unitSlug) {
    //TODO: this is super messy.  Replace with a service
    var settingsData = $scope.$parent.$parent.settingsData;
    var slugPath = unitSlug.replace('_','/');
    var baseUrl = cordova.file.dataDirectory + slugPath;
    var url = baseUrl + '/index.json';
    $http.get(url).then(function (resp) {
      var groupedCardList = _.groupBy(resp.data.cards, 'subtype');
      var cardList = [];
      var re = /src=\"(.*)\"/ig;
      var linkingRe = /href=\"topics\/([A-Za-z0-9_\-]*)\/([A-Za-z0-9_\-]*)(\.md)?\"/ig;
      _.forEach(groupedCardList, function(group){
        var done = false;
        _.forEach(group, function(card){
          card.contents = card.contents.replace(re, "src=\"" + baseUrl + "/$1\"");
          card.contents = card.contents.replace(linkingRe, "href=\"#\" onclick=\"window.handleOpenURL('openmentoring://units/$1_$2');\"");
          var profiles = _.filter(card.category, function(i) {
            return _.startsWith(i,'profile:');
          });
          if(group.length == 1) {
            cardList.push(card);
            console.log("card: " + card.contents);
          } else if((_.indexOf(profiles,'profile:' + settingsData.profile)>-1)) {
            done = true;
            console.log("card: " + card.contents);
            cardList.push(card);
          } else if(!(profiles.length) && !done) {
            cardList.push(card);
            console.log("card: " + card.contents);
          }
        });
      });
      $scope.currentUnit = unitSlug;
      DBService.logUnitStart($scope.currentUnit);

      $scope.swiper.detachEvents();
      $scope.cards = cardList;
      $scope.swiper.update(true);
      var startSlide = DBService.getStartSlide(unitSlug);
      $scope.swiper.slideTo(startSlide,0,false);
      $scope.modal.show();
      $scope.swiper.attachEvents();
    }, function(err) {
      // Error
      console.log('error');
      console.log(err);
    });
  };

  $scope.downloadTopic = function(topic) {
    $ionicPlatform.ready(function() {}).then(function () {
      var url = topic.downloadUrl;
      var targetPath = cordova.file.dataDirectory + topic.slug + '.zip';
      var trustHosts = true;
      var options = {};

      $cordovaFileTransfer.download(url, targetPath, options, trustHosts)
        .then(function(result) {
          var folderDest = cordova.file.dataDirectory;
          return $cordovaZip.unzip(result.nativeURL,folderDest);
        }, function(err) {
          // Error
          console.log('error');
          console.log(JSON.stringify(err));
        }, function (progress) {
          $timeout(function () {
            $scope.downloadProgress = (progress.loaded / progress.total) * 100;
            console.log('Progress: ' + $scope.downloadProgress);
          })
        }).then(function(zipResult){
          console.log("Successfully unzipped");
          $timeout(function() {
            topic.isDownloaded = true;
            topic.isLatest = true;
            DBService.markAsDownloaded(topic);
          });
        }, function (zipErr) {
          console.log('error ' + zipErr);
        }, function (progressEvent) {
          // https://github.com/MobileChromeApps/zip#usage
          console.log(progressEvent);
        });
    });

    console.log('Downloading ' + topic);

  };
  $scope.isDownloaded = function(topic) {
    if(topic.isDownloaded) {
      return true;
    } else {
      return false;
    }
  };

  //initialize the view
  $scope.refreshTopics();

})

.controller('AboutCtrl', function($scope, $cordovaDevice, $cordovaAppVersion) {

  document.addEventListener("deviceready", function () {
    $scope.device = $cordovaDevice.getDevice();
    $cordovaAppVersion.getVersionNumber().then(function (version) {
        $scope.appVersion = version;
    });
  }, false);
});
