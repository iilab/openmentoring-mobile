// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'ksSwiper', 'ngCordova', 'starter.controllers', 'starter.services'])
.run(function($state, $window, LaunchService, $ionicPlatform, DBService) {
  $ionicPlatform.ready(function() {

    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    $window.addEventListener('CustomURLFollow', function(e) {
      if(LaunchService.checkUrl(e.detail.url)) {
        $state.go('app.unit');
      }
    });
  });
})


.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
  // .state('intro', {
  //   url: '/',
  //   templateUrl: 'templates/intro.html',
  //   controller: 'IntroCtrl'
  // })

  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl',
    resolve: {
      db: function($ionicPlatform, $q, DBService) {
        var dfd = $q.defer();
        $ionicPlatform.ready(function() {
          dfd.resolve(DBService.initDB());
        });
        return dfd.promise;
      }
    }
  })

  .state('app.about', {
    url: '/about',
    views: {
      'menuContent': {
        templateUrl: 'templates/about.html',
        controller: 'AboutCtrl'
      }
    }
  })

  .state('app.topics', {
    url: '/topics',
    views: {
      'menuContent': {
        templateUrl: 'templates/topics.html',
        controller: 'TopicsCtrl'
      }
    }
  })

  .state('app.unit', {
    url: '/units/:unitSlug',
    views: {
      'menuContent': {
        templateUrl: 'templates/topics.html',
        controller: 'TopicsCtrl'
      }
    }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/topics');
});

//url scheme handling
function handleOpenURL(url) {
  setTimeout(function() {
    if (window.CustomEvent) {
      var event = new CustomEvent('CustomURLFollow', {detail: {url: url}});
    } else {
      var event = document.createEvent('CustomEvent');
      event.initCustomEvent('CustomURLFollow', true, true, {url: url});
    }

    window.dispatchEvent(event);
  }, 0);
}
