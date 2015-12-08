angular.module('lodash', [])
.factory('_', ['$window', function($window) {
    return $window._; // assumes underscore has already been loaded on the page
}]);

angular.module('starter.services', ['lodash','ionic','lokijs'])

.factory('DBService', function(_, $q, Loki) {
  var _db;
  var _topics;
  var _downloadedTopics;

  return {
    initDB: function() {

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
            _downloadedTopics = _db.getCollection('downloadedTopics');

            if (!_topics) {
              _topics = _db.addCollection('topics', { unique: ['slug'] });
            }

            if (!_downloadedTopics) {
              _downloadedTopics = _db.addCollection('downloadedTopics', { unique: ['slug'] });
            }
            console.log(_topics);
            console.log(_downloadedTopics);

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

    },

    getAllTopics: function() {
      return _topics.chain().find();
    },

    markAsDownloaded: function(topic) {
      //update the topic in the downloaded list
      console.log('marking as downloaded: ' + topic.slug);
      var wasDownloaded = _downloadedTopics.by('slug', topic.slug);
      if(wasDownloaded) {
        //update the existing entry in case there's a new date
        wasDownloaded.updatedAt = topic.updatedAt;
        _downloadedTopics.update(wasDownloaded);
      } else {
        _downloadedTopics.insert({
          slug: topic.slug,
          updatedAt: topic.updatedAt
        });
      }
      //udate the topic in the index
      _topics.update(topic);
    },

    loadTopics: function(topicList) {
      //get the list of previously downloaded topics and conver it to a hash for easy lookup
      var previouslyDownloaded = _downloadedTopics.chain().find().data();
      var downloadsHash = {};
      if(previouslyDownloaded && previouslyDownloaded.length) {
        downloadsHash = _.indexBy(previouslyDownloaded,'slug');
      }

      var loadListObject = {};
      //add topics to the list and units as subobjects of the topics
      topicList.forEach(function(item){
        if (item.slug.indexOf('_') != 0) {
          if(item.type === "topic") {
            item.units = [];
            //check previous downloads to set boolean for display
            if(downloadsHash[item.slug]) {
              item.isDownloaded = true;
              var downloadedDate = new Date(downloadsHash[item.slug].updatedAt);
              var indexDate = new Date(item.updatedAt);
              if(indexDate > downloadedDate) {
                item.isLatest = false;
              } else {
                item.isLatest = true;
              }
            } else {
              item.isDownloaded = false;
              item.isLatest = false;
            }
            console.log('adding topic: ' + item.slug);
            loadListObject[item.slug] = item;
          } else if(item.type === "unit") {
            var slugParts = item.slug.split('_');
            console.log('adding unit to topic: ' + slugParts[0]);
            loadListObject[slugParts[0]].units.push(item);
          }
        }
      });
      //blow away the existing topics collection and replace with the fresh list
      _topics.removeDataOnly();
      _topics.insert(_.values(loadListObject));
      var retVal = _topics.chain().find();
      return retVal.data();
    }
  };
});
