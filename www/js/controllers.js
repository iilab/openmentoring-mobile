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

.controller('QueueCtrl',function($scope, DBService){
  $scope.incompleteUnits = [];

  $scope.suggestedUnits = [];

  $scope.$on('$ionicView.beforeEnter', function() {
    $scope.incompleteUnits = DBService.getIncompleteUnits();
  });
})

.controller('TopicsCtrl', function($scope, $stateParams, $q, $http, $ionicPlatform, $ionicHistory, $ionicScrollDelegate, $ionicModal, $ionicPopup, $ionicLoading, $cordovaFileTransfer, $cordovaZip, $timeout, DBService) {

  var INDEX_URL = $scope.settingsData.contentUrl + '/index.json';
  $scope.data = {};
  $scope.currentUnit = null;

  //if the unit was passed in to the url, add it to the global variable that is also used by the custom URL handler
  if($stateParams.unit) {
    window.skipToUnit = $stateParams.unit;
  }

  $scope.$watch('data.slider', function(nv, ov) {
    $scope.swiper = $scope.data.slider;
    if($scope.swiper) {
      $scope.swiper.on('slideChangeEnd', function (sw) {
        DBService.logUnitAdvance($scope.currentUnit, sw.activeIndex, sw.isEnd);
      });
    }
  });

  $scope.$on('modal.hidden', function() {
    $ionicHistory.goBack();
  });

  $scope.$on('$destroy', function(){
    $scope.modal.remove();
  });

  // PRIVATE FUNCTIONS
  function _doFilter() {
    //TODO: apply filter based on results from lunr
    console.log('doFilter');

    if(_.isEmpty($scope.search)) {
      _resetViewState($scope.topics);
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

  function _resetViewState(nestedList) {
    nestedList.forEach(function(topic){
      topic.isVisible = true;
      topic.showUnits = false;
      topic.units.forEach(function(unit){
        unit.isVisible = false;
      });
    });
  };

  function _activateOrbotOrOverride() {
    var dfd = $q.defer();
    if(window.skipOrbotCheck) {
      //don't check for orbot if the user has bypassed it intentionally
      dfd.resolve();
    } else {
      navigator.startApp.check("org.torproject.android", function(message) { /* success */
          console.log("app exists: ");
          console.log(message.versionName);
          console.log(message.packageName);
          console.log(message.versionCode);
          console.log(message.applicationInfo);
          window.isOrbotInstalled = true;
          navigator.startApp.start([["action", "org.torproject.android.intent.action.START", "org.torproject.android"],[{"org.torproject.android.intent.extra.PACKAGE_NAME":"org.iilab.openmentoring"}]], function(message) { /* success */
            console.log(message); // => OK
            dfd.resolve();
          },
          function(error) { /* error */
            console.log(error);
            dfd.reject();
          });

      },
      function(error) { /* error */
          console.log(error);
          window.isOrbotInstalled = false;
          dfd.reject();
      });
    }
    return dfd.promise;
  }

  function _loadLocalTopicList() {
    var topics = DBService.getAllTopics();
    $scope.topics = topics;
    _doFilter();
  }

  function _downloadTopicList() {
    $http({
      method: 'GET',
      url: INDEX_URL,
      responseType: 'json'
    }).then(function (resp) {
      var topics = DBService.loadTopics(resp.data.items);
      $scope.topics = topics;
      _doFilter();
    }, function(err) {
      // Error
      console.log('error');
      console.log(err);
    }).finally(function() {
      // Stop the ion-refresher from spinning
      $scope.$broadcast('scroll.refreshComplete');
    });
  }

  function _performTopicDownload(topic) {
    //TODO: replace this with a service
    var dfd = $q.defer();
    $ionicPlatform.ready(function() {}).then(function () {
      var url = topic.downloadUrl;
      var targetPath = cordova.file.dataDirectory + topic.slug + '.zip';
      var trustHosts = true;
      var options = {};
      $ionicLoading.show({
        template: 'Downloading...'
      });
      $cordovaFileTransfer.download(url, targetPath, options, trustHosts)
        .then(function(result) {
          var folderDest = cordova.file.dataDirectory;
          return $cordovaZip.unzip(result.nativeURL,folderDest);
        }, function(err) {
          // Error
          console.log('error');
          console.log(JSON.stringify(err));
          $ionicLoading.show({
            template: 'Download failed!',
            duration: 1500
          });
          dfd.reject();
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
            $ionicLoading.hide();
            dfd.resolve();
          });
        }, function (zipErr) {
          console.log('error ' + zipErr);
          $ionicLoading.show({
            template: 'Content could not be loaded.',
            duration: 1500
          });
          dfd.reject();
        }, function (progressEvent) {
          // https://github.com/MobileChromeApps/zip#usage
          console.log(progressEvent);
        });
      });

      console.log('Downloading ' + topic);

      return dfd.promise;
  }

  // PUBLIC FUNCTIONS
  $scope.updateFilter = function() {
    $ionicScrollDelegate.scrollTop();
    _doFilter();
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

  $scope.refreshTopics = function() {
    if(window.isOnline) {
      var orbotCheck = _activateOrbotOrOverride();
      orbotCheck.then(function(){
        //orbot is installed... proceed
        _downloadTopicList();
      }).catch(function(){
        //orbot is not installed.. prompt to download
        var getAppPopup = $ionicPopup.show({
          title: 'Downloading Content',
          cssClass: 'popup-vertical-buttons',
          template: 'In order to download content safely, we recommend using Orbot. Without Orbot, your activity in this app is easier for malicious parties to intercept.',
          buttons: [{ // Array[Object] (optional). Buttons to place in the popup footer.
             text: 'Install Orbot from F-Droid',
             type: 'button-positive',
             onTap: function(e) {
               return "fdroid";
             }
           }, {
              text: 'Install Orbot from Google Play',
              type: 'button-positive',
              onTap: function(e) {
                return "play";
              }
            }, {
             text: 'Proceed without Orbot',
             type: 'button-default',
             onTap: function(e) {
               // Returning a value will cause the promise to resolve with the given value.
               return "unprotected";
             }
           }, {
              text: 'Cancel (stay offline)',
              type: 'button-default',
              onTap: function(e) {
                // Returning a value will cause the promise to resolve with the given value.
                return "offline";
              }
           }]
        });

        getAppPopup.then(function(res) {
          if(res==="fdroid") {
            //TODO: take the user to app store?
            window.open('https://f-droid.org/repository/browse/?fdid=org.torproject.android', '_system');
            $scope.$broadcast('scroll.refreshComplete');
          } else if(res==="play") {
            //TODO: take the user to app store?
            window.open('market://details?id=org.torproject.android', '_system');
            $scope.$broadcast('scroll.refreshComplete');
          } else if(res==="unprotected") {
            //the user cancelled... just get the topic list anyways
            window.skipOrbotCheck = true;
            _downloadTopicList();
          } else if(res==="offline") {
            _loadLocalTopicList();
            $scope.$broadcast('scroll.refreshComplete');
          }
        });
      });

    } else {
      //quickly return if we've disabled the refresher
      _loadLocalTopicList();
      $scope.$broadcast('scroll.refreshComplete');
    }
  };

  $scope.closeUnit = function() {
    $scope.modal.hide();
  };

  $scope.openUnit = function(unitSlug) {
    //TODO: this is super messy.  Replace with a service
    var settingsData = $scope.$parent.$parent.settingsData;
    var slugPath = unitSlug.replace('_','/');
    var baseUrl = cordova.file.dataDirectory + slugPath;
    var url = baseUrl + '/index.json';
    $http.get(url).then(function (resp) {
      var title = resp.data.title;
      var groupedCardList = _.groupBy(resp.data.cards, 'subtype');
      var cardList = [];
      var re = /src=\"(.*)\"/ig;
      var linkingRe = /href=\"topics\/([A-Za-z0-9_\-]*)\/([A-Za-z0-9_\-]*)(\.md)?\"/ig;
      _.forEach(groupedCardList, function(group){
        var done = false;
        _.forEach(group, function(card){
          card.contents = card.contents.replace(re, "src=\"" + baseUrl + "/$1\"");
          card.contents = card.contents.replace(linkingRe, "href=\"#/app/topics?unit=$1_$2\"");
          var profiles = _.filter(card.category, function(i) {
            return _.startsWith(i,'profile:');
          });
          if(group.length == 1) {
            cardList.push(card);
          } else if((_.indexOf(profiles,'profile:' + settingsData.profile)>-1)) {
            done = true;
            cardList.push(card);
          } else if(!(profiles.length) && !done) {
            cardList.push(card);
          }
        });
      });
      $scope.currentUnitTitle = title;
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
    if(window.isOnline) {
      var orbotCheck = _activateOrbotOrOverride();
      orbotCheck.then(function(){
        //orbot is installed... proceed
        _performTopicDownload(topic);
      }).catch(function(){
        //orbot is not installed.. prompt to download
        var getAppPopup = $ionicPopup.show({
          title: 'Downloading Content',
          cssClass: 'popup-vertical-buttons',
          template: 'In order to download content safely, we recommend using Orbot. Without Orbot, your activity in this app is easier for malicious parties to intercept.',
          buttons: [{ // Array[Object] (optional). Buttons to place in the popup footer.
             text: 'Install Orbot from F-Droid',
             type: 'button-positive',
             onTap: function(e) {
               return "fdroid";
             }
           }, {
              text: 'Install Orbot from Google Play',
              type: 'button-positive',
              onTap: function(e) {
                return "play";
              }
            }, {
             text: 'Proceed without Orbot',
             type: 'button-default',
             onTap: function(e) {
               // Returning a value will cause the promise to resolve with the given value.
               return "unprotected";
             }
           }, {
              text: 'Cancel (stay offline)',
              type: 'button-default',
              onTap: function(e) {
                // Returning a value will cause the promise to resolve with the given value.
                return "offline";
              }
           }]
        });

        getAppPopup.then(function(res) {
          if(res==="fdroid") {
            //TODO: take the user to app store?
            window.open('https://f-droid.org/repository/browse/?fdid=org.torproject.android', '_system');
          } else if(res==="play") {
            //TODO: take the user to app store?
            window.open('market://details?id=org.torproject.android', '_system');
          } else if(res==="unprotected") {
            //the user cancelled... just get the topic anyways
            window.skipOrbotCheck = true;
            _performTopicDownload(topic);
          } else if(res==="offline") {
            //do nothing... staying offline
          }
        });
      });

    } else {
      var offlinePopup = $ionicPopup.alert({
        title: 'Unable to Download Content',
        template: 'You are currently offline. To download content, enable your network connection.'
      });
    }
  };

  $scope.isDownloaded = function(topic) {
    if(topic.isDownloaded) {
      return true;
    } else {
      return false;
    }
  };

  //initialize the view
  $ionicModal.fromTemplateUrl('templates/unit.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
    if(window.skipToUnit) {
      var topic = DBService.getTopicByUnit(window.skipToUnit);
      if($scope.isDownloaded(topic)) {
        $scope.openUnit(window.skipToUnit);
        window.skipToUnit = null;
      } else {
        var confirmPopup = $ionicPopup.confirm({
          title: 'Download Topic',
          template: 'In order to view this unit, you need to download <strong>' + topic.title + '</strong>. Download it now?'
        });

        confirmPopup.then(function(res) {
          if(res) {
            var download = $scope.downloadTopic(topic);
            download.then(function(){
              //download succeeded... proceed to the unit
              $scope.openUnit(window.skipToUnit);
              window.skipToUnit = null;
            }).catch(function(){
              //download failed... just show the topic list
              window.skipToUnit = null;
              $scope.refreshTopics();
            });
          } else {
            //the user cancelled... just show them the topic list
            window.skipToUnit = null;
            $scope.refreshTopics();
          }
        });
      }

    } else {
      $scope.refreshTopics();
    }
  });

})

.controller('AboutCtrl', function($scope, $cordovaDevice, $cordovaAppVersion) {

  document.addEventListener("deviceready", function () {
    $scope.device = $cordovaDevice.getDevice();
    $cordovaAppVersion.getVersionNumber().then(function (version) {
        $scope.appVersion = version;
    });
  }, false);
});
