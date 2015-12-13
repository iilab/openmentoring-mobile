angular.module('lodash', [])
.factory('_', ['$window', function($window) {
    return $window._; // assumes lodash has already been loaded on the page
}]);

angular.module('lunr', [])
.factory('lunr', ['$window', function($window) {
    return $window.lunr; // assumes lunr has already been loaded on the page
}]);

angular.module('starter.services', ['lodash','ionic','lokijs', 'lunr'])

.factory('DBService', function(_, $q, Loki, lunr) {
  var _db;
  var _topics;
  var _topicIndex;
  var _downloadedTopics;
  var _idx;

  function convertCategoriesToProperties(flatIndex) {
    var newList = [];
    flatIndex.forEach(function(item){
      var newItem = _.cloneDeep(item);
      newItem.profile = "";
      newItem.devices = [];
      var categories = newItem.categories;
      categories.forEach(function(category){
        var propArray = category.split(':');
        switch(propArray[0]) {
          case 'profile': item.profile = propArray[1]; break;
          case 'device': item.devices.push(propArray[1]); break;
        }
      });
      newList.push(newItem);
    });
    return newList;
  };

  function loadSearchIndex(flatIndex) {
    //initialize search index, effectively clearing it
    _idx = lunr(function () {
      this.field('title', { boost: 10 });
      this.field('parentTitle');
      this.ref('slug');
    });
    flatIndex.forEach(function(item){
      console.log(item);
      _idx.add(item,false);
    });
    console.log('done with all');
  };

  function renderIndexAsNestedList(flatIndex) {
    //get the list of previously downloaded topics and conver it to a hash for easy lookup
    var previouslyDownloaded = _downloadedTopics.chain().find().data();
    var downloadsHash = {};
    if(previouslyDownloaded && previouslyDownloaded.length) {
      downloadsHash = _.indexBy(previouslyDownloaded,'slug');
    }

    var loadListObject = {};
    //add topics to the list and units as subobjects of the topics
    flatIndex.forEach(function(item){
      var newItem = _.cloneDeep(item);
      //get rid of db reference
      delete newItem.$loki;
      if (newItem.slug.indexOf('_') != 0) {
        if(newItem.type === "topic") {
          newItem.units = [];
          //check previous downloads to set boolean for display
          if(downloadsHash[newItem.slug]) {
            newItem.isDownloaded = true;
            var downloadedDate = new Date(downloadsHash[newItem.slug].updatedAt);
            var indexDate = new Date(newItem.updatedAt);
            if(indexDate > downloadedDate) {
              newItem.isLatest = false;
            } else {
              newItem.isLatest = true;
            }
          } else {
            newItem.isDownloaded = false;
            newItem.isLatest = false;
          }
          loadListObject[newItem.slug] = newItem;
        } else if(newItem.type === "unit") {
          var slugParts = newItem.slug.split('_');
          loadListObject[slugParts[0]].units.push(newItem);
        }
      }
    });
    return _.values(loadListObject);
  };

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
            _topicIndex = _db.getCollection('topicIndex');

            if(!_topics) {
              _topics = _db.addCollection('topics', { unique: ['slug'] });
            }

            if(!_downloadedTopics) {
              _downloadedTopics = _db.addCollection('downloadedTopics', { unique: ['slug'] });
            }


            if(!_topicIndex) {
              _topicIndex = _db.addCollection('topicIndex', { unique: ['slug'] });
            } else {
              var fullIndex = _topicIndex.chain().find().data();
              loadSearchIndex(fullIndex);
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

    },

    getAllTopics: function() {
      return _topics.chain().find().data();
    },

    markAsDownloaded: function(topic) {
      //update the topic in the downloaded list
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
      //transform the flat list to the format used in the app
      var normalizedTopicList = convertCategoriesToProperties(topicList);

      //transform the normalized list to the version used for display
      var nestedList = renderIndexAsNestedList(normalizedTopicList);
      //blow away the existing topics collection and replace with the fresh list
      _topics.removeDataOnly();
      _topics.insert(nestedList);

      //blow away the existing search index and replace with the mormalized version
      _topicIndex.removeDataOnly();
      _topicIndex.insert(normalizedTopicList);
      loadSearchIndex(normalizedTopicList);

      var retVal = _topics.chain().find();
      return retVal.data();
    }
  };
});