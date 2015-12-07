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
    $scope.modal = modal;
  });

  // Triggered in the settings modal to close it
  $scope.closeSettings = function() {
    $scope.modal.hide();
  };

  // Open the settings modal
  $scope.settings = function() {
    $scope.modal.show();
  };

  // Perform the settings action when the user submits the settings form
  $scope.doSettings = function() {
    console.log('Doing settings', $scope.settingsData);
    $scope.closeSettings();
  };
})

.controller('TopicsCtrl', function($scope, $http, $ionicPlatform, $ionicLoading, $cordovaFileTransfer, $cordovaZip, $timeout, DBService) {
  console.log('inside topics controller');

  $scope.downloadedTopics = {};

  $ionicLoading.show({
     template: 'Loading...'
   });
  var url = $scope.settingsData.contentUrl + '/index.json';
  $http.get(url).then(function (resp) {
    console.log('inside success');
    $scope.topics = DBService.loadTopics(resp.data.items);
    $ionicLoading.hide();
  }, function(err) {
    // Error
    console.log('error');
    $ionicLoading.hide();
    console.log(err);
  });

  $scope.downloadTopic = function(topic) {
    $ionicPlatform.ready(function() {}).then(function () {
      var url = topic.downloadUrl;
      var targetPath = cordova.file.dataDirectory + topic.slug + '.zip';
      var trustHosts = true;
      var options = {};

      $cordovaFileTransfer.download(url, targetPath, options, trustHosts)
        .then(function(result) {
          console.log('inside success');
          var folderDest = cordova.file.dataDirectory + topic.slug + "/";
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

})

// .controller('TopicsCtrl', function($scope, $ionicPlatform, $timeout, $cordovaFileTransfer) {
//   console.log('inside topics controller');
//   $ionicPlatform.ready(function() {}).then(function () {
//     console.log('inside ready');
//     var url = $scope.settingsData.contentUrl + '/index.json';
//     var targetPath = cordova.file.dataDirectory + 'index.json';
//     var trustHosts = true;
//     var options = {};
//
//     $cordovaFileTransfer.download(url, targetPath, options, trustHosts)
//       .then(function(result) {
//         console.log('inside success');
//          console.log(JSON.stringify(result));
//         $scope.topics = [
//           { title: 'Safe Social Networks', id: 1 },
//           { title: 'Sharing Open Mentoring', id: 2 }
//         ];
//       }, function(err) {
//         // Error
//         console.log('error');
//         console.log(JSON.stringify(err));
//       }, function (progress) {
//         $timeout(function () {
//           $scope.downloadProgress = (progress.loaded / progress.total) * 100;
//           console.log('Progress: ' + $scope.downloadProgress);
//         })
//       });
//   });
// })

.controller('TopicCtrl', function($scope, $stateParams) {
  $scope.units = [
    { title: 'How to', id: 1 }
  ];
})

.controller('UnitCtrl', function($scope, $stateParams) {
  $scope.cards = [
    { title: 'Card 1', id: 1 },
    { title: 'Card 2', id: 2 }
  ];
});
