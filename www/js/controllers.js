angular.module('starter.controllers', ['starter.services'])

.controller('StartCtrl', function($scope, $state) {

})

.controller('IntroCtrl', function($scope, $state, $ionicSlideBoxDelegate) {

  // Called to navigate to the main app
  $scope.startApp = function() {
    $state.go('home.learn');
  };
  $scope.next = function() {
    $ionicSlideBoxDelegate.next();
  };
  $scope.previous = function() {
    $ionicSlideBoxDelegate.previous();
  };

  // Called each time the slide changes
  $scope.slideChanged = function(index) {
    $scope.slideIndex = index;
  };
})

.controller('HomeCtrl', function($scope, $ionicModal, $timeout, DBService, $cordovaFile) {

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});

    $scope.toIntro = function(){
      $state.go('intro');
    }

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

    $scope.incompleteUnits = [];

    $scope.suggestedUnits = [];

    $scope.toQueue = function() {
      $scope.incompleteUnits = DBService.getIncompleteUnits();
    };

    // Perform the settings action when the user submits the settings form
    $scope.doSettings = function() {
      console.log('Doing settings', $scope.settingsData);
      $scope.closeSettings();
    };

})


.controller('AppCtrl', function($scope, $ionicModal, $timeout, DBService, $cordovaFile) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.toIntro = function(){
    $state.go('intro');
  }

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

.controller('TopicsCtrl', function($scope, $state, $stateParams, $q, $http, $ionicFilterBar, $ionicPlatform, $ionicHistory, $ionicScrollDelegate, $ionicModal, $ionicPopup, $ionicLoading, $cordovaFileTransfer, $cordovaZip, $timeout, DBService, $cordovaFile) {

  var INDEX_URL = $scope.settingsData.contentUrl + '/index.json';
  $scope.data = {};
  $scope.currentUnit = null;

  //if the unit was passed in to the url, add it to the global variable that is also used by the custom URL handler
  if($stateParams.unit) {
    console.log("Skip to Unit!")
    console.log($stateParams.unit)
    window.skipToUnit = $stateParams.unit;
  }

  // if($stateParams.card) {
  //   window.skipToCard = $stateParams.card;
  // }

  $scope.$on('modal.hidden', function() {
    $ionicHistory.goBack();
  });

  $scope.$on('$destroy', function(){
    $scope.modal.remove();
  });

  $scope.showFilterBar = function () {
    filterBarInstance = $ionicFilterBar.show({
      items: $scope.topics,
      update: function (filteredItems, filterText) {
        if (filterText) {
          var results = DBService.doSearch(filterText);
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
      }
    });
  };

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
      console.log('before startApp set')
      var sApp = startApp.set("org.torproject.android")
      console.log('after startApp set')
      sApp.check(function(message) { /* success */
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
          console.log("orbot not installed")
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
      $ionicLoading.hide();
      $scope.$broadcast('scroll.refreshComplete');
    });
  }

  function _performTopicDownload(topic) {
    //TODO: replace this with a service
    var dfd = $q.defer();
    $ionicPlatform.ready(function() {}).then(function () {
      var url = topic.downloadUrl;
      var targetPath = cordova.file.applicationStorageDirectory + topic.slug + '.zip';
      var trustHosts = true;
      var options = {};
      $ionicLoading.show({
        template: 'Downloading...'
      });
      $cordovaFileTransfer.download(url, targetPath, options, trustHosts)
        .then(function(result) {
          var folderDest = cordova.file.applicationStorageDirectory;
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
            topics = DBService.getAllTopics();
            $scope.topics = topics;
            _doFilter();
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
    if (false) {
    // deactivate tor check for now
    // if (window.Connection) {
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
              console.log("clicked fdroid")
              window.open('https://f-droid.org/repository/browse/?fdid=org.torproject.android', '_system');
              $scope.$broadcast('scroll.refreshComplete');
            } else if(res==="play") {
              console.log("clicked play")
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
    } else {
      _downloadTopicList();
    }
  };

  $scope.closeUnit = function() {
    $scope.modal.hide();
  };

  $scope.goHome = function() {
    $ionicHistory.nextViewOptions({
      historyRoot: true
    });
    $scope.modal.hide();
    _loadLocalTopicList();
  };

  $scope.$watch('data.slider', function(nv, ov) {
    $scope.swiper = $scope.data.slider;
    if($scope.swiper) {
      $scope.swiper.on('slideChangeEnd', function (sw) {
        // console.log($scope.data.slider);
        $scope.currentCardTitle = $scope.cards[sw.activeIndex].title ;
        $scope.currentProgress = "scaleX(" + sw.progress + ")";
        $scope.$apply();
        // console.log($scope.currentProgress)
        DBService.logUnitAdvance($scope.currentUnit, sw.activeIndex, sw.isEnd);
      });
    }
  });

  $scope.goToUnit = function(unit) {
    console.log("goToUnit")
    console.log(unit)
    var topic = DBService.getTopicByUnit(unit);
    if($scope.isDownloaded(topic)) {
      var confirmPopup = $ionicPopup.confirm({
        title: 'Open New Topic',
        template: '<p>In order to view this unit, you will exit this lesson and go to the <strong>' + topic.title + '</strong> lesson. </p><p> You will be able to return to this lesson by clicking on the Keep Learning icon.</p><i class="icon ion-ios-bookmarks-outline" style="font-size:6vh;"></i><p>Confirm?</p>'
      });

      confirmPopup.then(function(res) {
        if(res) {
          $scope.openUnit(unit);
          window.skipToUnit = null;
        } else {
          //the user cancelled... just show them the topic list
          window.skipToUnit = null;
          $scope.refreshTopics();
        }
      });
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
            $scope.openUnit(unit);
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
  }

  $scope.openUnit = function(unitSlug) {
    //TODO: this is super messy.  Replace with a service
    var settingsData = $scope.$parent.$parent.settingsData;
    var slugPath = unitSlug.replace('_','/');
    var baseUrl = cordova.file.applicationStorageDirectory + slugPath;
    $scope.baseUrl = baseUrl;
    var imgBaseUrl = baseUrl;
    if (window.location.port == 8100) { imgBaseUrl = window.location.origin + "/tmp/en/topics/" + slugPath}
    console.log(imgBaseUrl)
    $scope.imgBaseUrl = imgBaseUrl;
    console.log(baseUrl);
    var url = baseUrl + '/index.json';
    $cordovaFile.readAsText(baseUrl, "index.json").then(function (text) {
      var unit = JSON.parse(text);
      console.log(unit)
      var title = unit.title;
      var groupedCardList = _.groupBy(unit.cards, 'subtype');
      var cardList = [];
      var re = /src=\"(.*)\"/ig;
      var linkingRe = /href=\"topics\/([A-Za-z0-9_\-]*)\/([A-Za-z0-9_\-]*)(\.md)?\"/ig;
      var linkingCard = /href=\"topics\/([A-Za-z0-9_\-]*)\/([A-Za-z0-9_\-]*)\/([A-Za-z0-9_\-]*)(\.md)?\"/ig;
      _.forEach(groupedCardList, function(group){
        var done = false;
        _.forEach(group, function(card){

          $scope.goTo = function(stack) {
            var gotoStack = _.findIndex($scope.cards, function(s) {
              console.log(s);
              return s.stack == stack })
            console.log(gotoStack)
            $scope.swiper.slideTo(gotoStack,0,false);
          };

          card.contents = card.contents.replace(re, "src=\"" + imgBaseUrl + "/$1\"");
          // card.contents = card.contents.replace(linkingRe, "href=\"#/home/learn?unit=$1_$2\"");
          card.contents = card.contents.replace(linkingRe, "ng-click=\"goToUnit('$1_$2')\"");
          card.contents = card.contents.replace(linkingCard, "ng-click=\"goTo('$3')\"");
          // Called to navigate to the main app

          var profiles = _.filter(card.category, function(i) {
            return _.startsWith(i,'profile:');0
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

      $scope.currentTopicTitle = unit.parentTitle;
      $scope.currentUnitTitle = title;
      $scope.currentUnit = unitSlug;
      DBService.logUnitStart($scope.currentUnit);
      console.log($scope.swiper)
      if ($scope.swiper.detachEvents) $scope.swiper.detachEvents();
      $scope.cards = cardList;
      $scope.swiper.update(true);
      var startSlide = DBService.getStartSlide(unitSlug);
      $scope.swiper.slideTo(startSlide,0,false);
      $scope.currentCardTitle = $scope.cards[startSlide].title ;
      $scope.currentProgress = "scaleX(" + $scope.swiper.progress + ")";
      $scope.modal.show();
      $scope.swiper.attachEvents();
    }, function(err) {
      // Error
      console.log('error');
      console.log(err);
    });
  };

  $scope.downloadTopic = function(topic) {
    if (window.Connection) {
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
    } else {
      _performTopicDownload(topic);
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
    $ionicLoading.show({
      template: 'Loading...'
    });
    $scope.modal = modal;
    if (!$scope.swiper) {
      $scope.swiper = {
        options: {
          pagination: '.custom-swiper-pagination',
          paginationType: 'progress',
          spaceBetween: 20,
          speed: 600
        }
      };
    }
    if(window.skipToUnit) {
      $scope.goToUnit(window.skipToUnit);
    } else {
      $scope.refreshTopics();
    }
  });

})

.directive('compile', ['$compile', function ($compile) {
      return function(scope, element, attrs) {
          var ensureCompileRunsOnce = scope.$watch(
            function(scope) {
               // watch the 'compile' expression for changes
              return scope.$eval(attrs.compile);
            },
            function(value) {
              // when the 'compile' expression changes
              // assign it into the current DOM
              element.html(value);

              // compile the new DOM and link it to the current
              // scope.
              // NOTE: we only compile .childNodes so that
              // we don't get into infinite loop compiling ourselves
              $compile(element.contents())(scope);

              // Use Angular's un-watch feature to ensure compilation only happens once.
              ensureCompileRunsOnce();
            }
        );
    };
}])

.controller('NewsCtrl', function($scope, $state, $stateParams, $q, $http, $ionicFilterBar, $ionicPlatform, $ionicHistory, $ionicScrollDelegate, $ionicModal, $ionicPopup, $ionicLoading, $cordovaFileTransfer, $cordovaZip, $timeout, DBService, $cordovaFile) {

  // var INDEX_URL = $scope.settingsData.contentUrl + '/index.json';
  // $scope.data = {};
  // $scope.currentUnit = null;
  //
  // //if the unit was passed in to the url, add it to the global variable that is also used by the custom URL handler
  // if($stateParams.unit) {
  //   window.skipToUnit = $stateParams.unit;
  // }
  //
  // $scope.$watch('data.slider', function(nv, ov) {
  //   $scope.swiper = $scope.data.slider;
  //   if($scope.swiper) {
  //     $scope.swiper.on('slideChangeEnd', function (sw) {
  //       DBService.logUnitAdvance($scope.currentUnit, sw.activeIndex, sw.isEnd);
  //     });
  //   }
  // });
  //
  // $scope.$on('modal.hidden', function() {
  //   $ionicHistory.goBack();
  // });
  //
  // $scope.$on('$destroy', function(){
  //   $scope.modal.remove();
  // });
  //
  // $scope.showFilterBar = function () {
  //   filterBarInstance = $ionicFilterBar.show({
  //     items: $scope.topics,
  //     update: function (filteredItems, filterText) {
  //       if (filterText) {
  //         var results = DBService.doSearch(filterText);
  //         var resultsHash = _.indexBy(results,'ref');
  //         $scope.topics.forEach(function(topic){
  //           topic.isVisible = resultsHash[topic.slug];
  //           topic.showUnits = false;
  //           topic.units.forEach(function(unit){
  //             unit.isVisible = resultsHash[unit.slug];
  //             if(unit.isVisible) {
  //               topic.isVisible = true;
  //             }
  //           });
  //         });
  //       }
  //     }
  //   });
  // };
  //
  // // PRIVATE FUNCTIONS
  // function _doFilter() {
  //   //TODO: apply filter based on results from lunr
  //   console.log('doFilter');
  //
  //   if(_.isEmpty($scope.search)) {
  //     _resetViewState($scope.topics);
  //   } else {
  //     var results = DBService.doSearch($scope.search);
  //     var resultsHash = _.indexBy(results,'ref');
  //     $scope.topics.forEach(function(topic){
  //       topic.isVisible = resultsHash[topic.slug];
  //       topic.showUnits = false;
  //       topic.units.forEach(function(unit){
  //         unit.isVisible = resultsHash[unit.slug];
  //         if(unit.isVisible) {
  //           topic.isVisible = true;
  //         }
  //       });
  //     });
  //   }
  // };
  //
  // function _resetViewState(nestedList) {
  //   nestedList.forEach(function(topic){
  //     topic.isVisible = true;
  //     topic.showUnits = false;
  //     topic.units.forEach(function(unit){
  //       unit.isVisible = false;
  //     });
  //   });
  // };
  //
  // function _activateOrbotOrOverride() {
  //   var dfd = $q.defer();
  //   if(window.skipOrbotCheck) {
  //     //don't check for orbot if the user has bypassed it intentionally
  //     dfd.resolve();
  //   } else {
  //     console.log('before startApp set')
  //     var sApp = startApp.set("org.torproject.android")
  //     console.log('after startApp set')
  //     sApp.check(function(message) { /* success */
  //         console.log("app exists: ");
  //         console.log(message.versionName);
  //         console.log(message.packageName);
  //         console.log(message.versionCode);
  //         console.log(message.applicationInfo);
  //         window.isOrbotInstalled = true;
  //         navigator.startApp.start([["action", "org.torproject.android.intent.action.START", "org.torproject.android"],[{"org.torproject.android.intent.extra.PACKAGE_NAME":"org.iilab.openmentoring"}]], function(message) { /* success */
  //           console.log(message); // => OK
  //           dfd.resolve();
  //         },
  //         function(error) { /* error */
  //           console.log(error);
  //           dfd.reject();
  //         });
  //
  //     },
  //     function(error) { /* error */
  //         console.log("orbot not installed")
  //         console.log(error);
  //         window.isOrbotInstalled = false;
  //         dfd.reject();
  //     });
  //   }
  //   return dfd.promise;
  // }
  //
  // function _loadLocalTopicList() {
  //   var topics = DBService.getAllTopics();
  //   $scope.topics = topics;
  //   _doFilter();
  // }
  //
  // function _downloadTopicList() {
  //   $http({
  //     method: 'GET',
  //     url: INDEX_URL,
  //     responseType: 'json'
  //   }).then(function (resp) {
  //     var topics = DBService.loadTopics(resp.data.items);
  //     $scope.topics = topics;
  //     _doFilter();
  //   }, function(err) {
  //     // Error
  //     console.log('error');
  //     console.log(err);
  //   }).finally(function() {
  //     // Stop the ion-refresher from spinning
  //     $scope.$broadcast('scroll.refreshComplete');
  //   });
  // }
  //
  // function _performTopicDownload(topic) {
  //   //TODO: replace this with a service
  //   var dfd = $q.defer();
  //   $ionicPlatform.ready(function() {}).then(function () {
  //     var url = topic.downloadUrl;
  //     var targetPath = cordova.file.dataDirectory + topic.slug + '.zip';
  //     var trustHosts = true;
  //     var options = {};
  //     $ionicLoading.show({
  //       template: 'Downloading...'
  //     });
  //     $cordovaFileTransfer.download(url, targetPath, options, trustHosts)
  //       .then(function(result) {
  //         var folderDest = cordova.file.dataDirectory;
  //         return $cordovaZip.unzip(result.nativeURL,folderDest);
  //       }, function(err) {
  //         // Error
  //         console.log('error');
  //         console.log(JSON.stringify(err));
  //         $ionicLoading.show({
  //           template: 'Download failed!',
  //           duration: 1500
  //         });
  //         dfd.reject();
  //       }, function (progress) {
  //         $timeout(function () {
  //           $scope.downloadProgress = (progress.loaded / progress.total) * 100;
  //           console.log('Progress: ' + $scope.downloadProgress);
  //         })
  //       }).then(function(zipResult){
  //         console.log("Successfully unzipped");
  //         $timeout(function() {
  //           topic.isDownloaded = true;
  //           topic.isLatest = true;
  //           DBService.markAsDownloaded(topic);
  //           $ionicLoading.hide();
  //           dfd.resolve();
  //         });
  //       }, function (zipErr) {
  //         console.log('error ' + zipErr);
  //         $ionicLoading.show({
  //           template: 'Content could not be loaded.',
  //           duration: 1500
  //         });
  //         dfd.reject();
  //       }, function (progressEvent) {
  //         // https://github.com/MobileChromeApps/zip#usage
  //         console.log(progressEvent);
  //       });
  //     });
  //
  //     console.log('Downloading ' + topic);
  //
  //     return dfd.promise;
  // }
  //
  // // PUBLIC FUNCTIONS
  //
  // $scope.updateFilter = function() {
  //   $ionicScrollDelegate.scrollTop();
  //   _doFilter();
  // };
  //
  // $scope.clearSearch = function() {
  //   $scope.search = '';
  //   $scope.updateFilter();
  // };
  //
  // $scope.toggleUnits = function(topic) {
  //   if(topic.showUnits) {
  //     topic.showUnits = false;
  //   } else {
  //     topic.showUnits = true;
  //   }
  // };
  //
  // $scope.refreshTopics = function() {
  //   if (false) {
  //   // deactivate tor check for now
  //   // if (window.Connection) {
  //     if(window.isOnline) {
  //       var orbotCheck = _activateOrbotOrOverride();
  //       orbotCheck.then(function(){
  //         //orbot is installed... proceed
  //         _downloadTopicList();
  //       }).catch(function(){
  //         //orbot is not installed.. prompt to download
  //         var getAppPopup = $ionicPopup.show({
  //           title: 'Downloading Content',
  //           cssClass: 'popup-vertical-buttons',
  //           template: 'In order to download content safely, we recommend using Orbot. Without Orbot, your activity in this app is easier for malicious parties to intercept.',
  //           buttons: [{ // Array[Object] (optional). Buttons to place in the popup footer.
  //              text: 'Install Orbot from F-Droid',
  //              type: 'button-positive',
  //              onTap: function(e) {
  //                return "fdroid";
  //              }
  //            }, {
  //               text: 'Install Orbot from Google Play',
  //               type: 'button-positive',
  //               onTap: function(e) {
  //                 return "play";
  //               }
  //             }, {
  //              text: 'Proceed without Orbot',
  //              type: 'button-default',
  //              onTap: function(e) {
  //                // Returning a value will cause the promise to resolve with the given value.
  //                return "unprotected";
  //              }
  //            }, {
  //               text: 'Cancel (stay offline)',
  //               type: 'button-default',
  //               onTap: function(e) {
  //                 // Returning a value will cause the promise to resolve with the given value.
  //                 return "offline";
  //               }
  //            }]
  //         });
  //
  //         getAppPopup.then(function(res) {
  //           if(res==="fdroid") {
  //             //TODO: take the user to app store?
  //             console.log("clicked fdroid")
  //             window.open('https://f-droid.org/repository/browse/?fdid=org.torproject.android', '_system');
  //             $scope.$broadcast('scroll.refreshComplete');
  //           } else if(res==="play") {
  //             console.log("clicked play")
  //             //TODO: take the user to app store?
  //             window.open('market://details?id=org.torproject.android', '_system');
  //             $scope.$broadcast('scroll.refreshComplete');
  //           } else if(res==="unprotected") {
  //             //the user cancelled... just get the topic list anyways
  //             window.skipOrbotCheck = true;
  //             _downloadTopicList();
  //           } else if(res==="offline") {
  //             _loadLocalTopicList();
  //             $scope.$broadcast('scroll.refreshComplete');
  //           }
  //         });
  //       });
  //
  //     } else {
  //       //quickly return if we've disabled the refresher
  //       _loadLocalTopicList();
  //       $scope.$broadcast('scroll.refreshComplete');
  //     }
  //   } else {
  //     _downloadTopicList();
  //   }
  // };
  //
  // $scope.closeUnit = function() {
  //   $scope.modal.hide();
  // };
  //
  // $scope.goHome = function() {
  //   $ionicHistory.nextViewOptions({
  //     historyRoot: true
  //   });
  //   $scope.modal.hide();
  //   _loadLocalTopicList();
  // };
  //
  // $scope.openUnit = function(unitSlug) {
  //   //TODO: this is super messy.  Replace with a service
  //   var settingsData = $scope.$parent.$parent.settingsData;
  //   var slugPath = unitSlug.replace('_','/');
  //   var baseUrl = cordova.file.dataDirectory + slugPath;
  //   var url = baseUrl + '/index.json';
  //   $cordovaFile.readAsText(baseUrl, "index.json").then(function (text) {
  //     var unit = JSON.parse(text);
  //     console.log(unit)
  //     var title = unit.title;
  //     var groupedCardList = _.groupBy(unit.cards, 'subtype');
  //     var cardList = [];
  //     var re = /src=\"(.*)\"/ig;
  //     var linkingRe = /href=\"topics\/([A-Za-z0-9_\-]*)\/([A-Za-z0-9_\-]*)(\.md)?\"/ig;
  //     _.forEach(groupedCardList, function(group){
  //       var done = false;
  //       _.forEach(group, function(card){
  //         card.contents = card.contents.replace(re, "src=\"" + baseUrl + "/$1\"");
  //         card.contents = card.contents.replace(linkingRe, "href=\"#/app/topics?unit=$1_$2\"");
  //         var profiles = _.filter(card.category, function(i) {
  //           return _.startsWith(i,'profile:');
  //         });
  //         if(group.length == 1) {
  //           cardList.push(card);
  //         } else if((_.indexOf(profiles,'profile:' + settingsData.profile)>-1)) {
  //           done = true;
  //           cardList.push(card);
  //         } else if(!(profiles.length) && !done) {
  //           cardList.push(card);
  //         }
  //       });
  //     });
  //     $scope.currentTopicTitle = unit.parentTitle;
  //     $scope.currentUnitTitle = title;
  //     $scope.currentUnit = unitSlug;
  //     DBService.logUnitStart($scope.currentUnit);
  //
  //     $scope.swiper.detachEvents();
  //     $scope.cards = cardList;
  //     $scope.swiper.update(true);
  //     var startSlide = DBService.getStartSlide(unitSlug);
  //     $scope.swiper.slideTo(startSlide,0,false);
  //     $scope.modal.show();
  //     $scope.swiper.attachEvents();
  //   }, function(err) {
  //     // Error
  //     console.log('error');
  //     console.log(err);
  //   });
  // };
  //
  // $scope.downloadTopic = function(topic) {
  //   if (window.Connection) {
  //     if(window.isOnline) {
  //       var orbotCheck = _activateOrbotOrOverride();
  //       orbotCheck.then(function(){
  //         //orbot is installed... proceed
  //         _performTopicDownload(topic);
  //       }).catch(function(){
  //         //orbot is not installed.. prompt to download
  //         var getAppPopup = $ionicPopup.show({
  //           title: 'Downloading Content',
  //           cssClass: 'popup-vertical-buttons',
  //           template: 'In order to download content safely, we recommend using Orbot. Without Orbot, your activity in this app is easier for malicious parties to intercept.',
  //           buttons: [{ // Array[Object] (optional). Buttons to place in the popup footer.
  //              text: 'Install Orbot from F-Droid',
  //              type: 'button-positive',
  //              onTap: function(e) {
  //                return "fdroid";
  //              }
  //            }, {
  //               text: 'Install Orbot from Google Play',
  //               type: 'button-positive',
  //               onTap: function(e) {
  //                 return "play";
  //               }
  //             }, {
  //              text: 'Proceed without Orbot',
  //              type: 'button-default',
  //              onTap: function(e) {
  //                // Returning a value will cause the promise to resolve with the given value.
  //                return "unprotected";
  //              }
  //            }, {
  //               text: 'Cancel (stay offline)',
  //               type: 'button-default',
  //               onTap: function(e) {
  //                 // Returning a value will cause the promise to resolve with the given value.
  //                 return "offline";
  //               }
  //            }]
  //         });
  //
  //         getAppPopup.then(function(res) {
  //           if(res==="fdroid") {
  //             //TODO: take the user to app store?
  //             window.open('https://f-droid.org/repository/browse/?fdid=org.torproject.android', '_system');
  //           } else if(res==="play") {
  //             //TODO: take the user to app store?
  //             window.open('market://details?id=org.torproject.android', '_system');
  //           } else if(res==="unprotected") {
  //             //the user cancelled... just get the topic anyways
  //             window.skipOrbotCheck = true;
  //             _performTopicDownload(topic);
  //           } else if(res==="offline") {
  //             //do nothing... staying offline
  //           }
  //         });
  //       });
  //
  //     } else {
  //       var offlinePopup = $ionicPopup.alert({
  //         title: 'Unable to Download Content',
  //         template: 'You are currently offline. To download content, enable your network connection.'
  //       });
  //     }
  //   } else {
  //     _performTopicDownload(topic);
  //   }
  // };
  //
  // $scope.isDownloaded = function(topic) {
  //   if(topic.isDownloaded) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // };
  //
  // //initialize the view
  // $ionicModal.fromTemplateUrl('templates/unit.html', {
  //   scope: $scope
  // }).then(function(modal) {
  //   $scope.modal = modal;
  //   if(window.skipToUnit) {
  //     var topic = DBService.getTopicByUnit(window.skipToUnit);
  //     if($scope.isDownloaded(topic)) {
  //       $scope.openUnit(window.skipToUnit);
  //       window.skipToUnit = null;
  //     } else {
  //       var confirmPopup = $ionicPopup.confirm({
  //         title: 'Download Topic',
  //         template: 'In order to view this unit, you need to download <strong>' + topic.title + '</strong>. Download it now?'
  //       });
  //
  //       confirmPopup.then(function(res) {
  //         if(res) {
  //           var download = $scope.downloadTopic(topic);
  //           download.then(function(){
  //             //download succeeded... proceed to the unit
  //             $scope.openUnit(window.skipToUnit);
  //             window.skipToUnit = null;
  //           }).catch(function(){
  //             //download failed... just show the topic list
  //             window.skipToUnit = null;
  //             $scope.refreshTopics();
  //           });
  //         } else {
  //           //the user cancelled... just show them the topic list
  //           window.skipToUnit = null;
  //           $scope.refreshTopics();
  //         }
  //       });
  //     }
  //
  //   } else {
  //     $scope.refreshTopics();
  //   }
  // });

})

.controller('SettingsCtrl', function($scope, $cordovaDevice, $cordovaAppVersion) {

  document.addEventListener("deviceready", function () {
    $scope.device = $cordovaDevice.getDevice();
    $cordovaAppVersion.getVersionNumber().then(function (version) {
        $scope.appVersion = version;
    });
  }, false);
});
