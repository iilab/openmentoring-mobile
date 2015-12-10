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

.controller('TopicsCtrl', function($scope, $http, $ionicPlatform, $ionicModal, $cordovaFileTransfer, $cordovaZip, $timeout, DBService) {

  var filterBarInstance;

  $scope.allowRefresh = true;

  $scope.doFilter = function () {
    $scope.allowRefresh = false;
    // filterBarInstance = $ionicFilterBar.show({
    //   items: $scope.topics,
    //   update: function (filteredItems, filterText) {
    //     $scope.topics = filteredItems;
    //     if (filterText) {
    //       console.log(filterText);
    //     }
    //   },
    //   cancel: function() {
    //     $scope.allowRefresh = true;
    //   }
    // });
  };

  $scope.swiper = {};

  $scope.onReadySwiper = function (swiper) {

    swiper.on('slideChangeStart', function () {

      console.log('slideChangeStart');
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

  $scope.topics = DBService.getAllTopics();

  $scope.scrollTop = function() {
    $ionicScrollDelegate.scrollTop();
  };

  $scope.clearSearch = function() {
    $scope.search = '';
  };

  var INDEX_URL = $scope.settingsData.contentUrl + '/index.json';

  $scope.refreshTopics = function() {
    if($scope.allowRefresh) {
      $http({
        method: 'GET',
        url: INDEX_URL,
        responseType: 'json'
      }).then(function (resp) {
        $scope.topics = DBService.loadTopics(resp.data.items);
      }, function(err) {
        // Error
        console.log('error');
        console.log(err);
      }).finally(function() {
        // Stop the ion-refresher from spinning
        $scope.$broadcast('scroll.refreshComplete');
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
    var url = cordova.file.dataDirectory + slugPath + '/index.json';
    $http.get(url).then(function (resp) {
      var groupedCardList = _.groupBy(resp.data.cards, 'subtype');
      var cardList = [];
      _.forEach(groupedCardList, function(group){
        var done = false;
        _.forEach(group, function(card){
          var profiles = _.filter(card.category, function(i) {
            return _.startsWith(i,'profile:');
          });
          if(group.length == 1) {
            done = true;
            cardList.push(card);
          } else if((_.indexOf(profiles,'profile:' + settingsData.profile)>-1) && !done) {
            done = true;
            cardList.push(card);
          } else if(!(profiles.length) && !done) {
            done = true;
            cardList.push(card);
          }
        });
      });
      $scope.cards = cardList;
      if(!_.isEmpty($scope.swiper)) {
        $scope.swiper.update();
      }
      $scope.modal.show();
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

.controller('TopicCtrl', function($scope, $stateParams) {
  $scope.units = [
    { title: 'How to', id: 1 }
  ];
});
