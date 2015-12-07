angular.module('lodash', [])
.factory('_', ['$window', function($window) {
    return $window._; // assumes underscore has already been loaded on the page
}]);

angular.module('starter.services', ['lodash','ionic','lokijs'])

.factory('DBService', function(_, $q, Loki) {
  var _db;
  var _topics;

  function initDB() {

    var dfd = $q.defer();
    if(_db) {
      dfd.resolve();
    } else {
      var lokiPrefs = {
        autosave: true,
        autoload: true,
        autosaveInterval: 1000, // 1 second
        autoloadCallback: function() {
          _topics = _db.getCollection('topics');

          if (!_topics) {
            _topics = _db.addCollection('topics');
          }

          dfd.resolve();
        }
      };
      if(window.cordova) {
        var fsAdapter = new LokiCordovaFSAdapter({"prefix": "loki"});
        lokiPrefs.adapter = fsAdapter;
      }
      _db = new Loki('localDB',lokiPrefs);
    }

    return dfd.promise;

  };

  function getAllTopics() {
    return _topics.chain().find();
  };

  function loadTopics(topicList) {
    var loadListObject = {};
    topicList.forEach(function(item){
      if (item.slug.indexOf('_') != 0) {
        if(item.type === "topic") {
          item.units = [];
          item.isDownloaded = false;
          console.log('adding topic: ' + item.slug);
          loadListObject[item.slug] = item;
        } else if(item.type === "unit") {
          var slugParts = item.slug.split('_');
          console.log('adding unit to topic: ' + slugParts[0]);
          loadListObject[slugParts[0]].units.push(item);
        }
      }
    });
    _topics.removeDataOnly();
    _topics.insert(_.values(loadListObject));
    var retVal = _topics.chain().find();
    console.log(retVal);
    return retVal.data();
  };

  return {
      initDB: initDB,
      getAllTopics: getAllTopics,
      loadTopics: loadTopics
  };
});
