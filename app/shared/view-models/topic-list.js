var observable = require("data/observable");
var observableArrayModule = require("data/observable-array");

var localArray = new observableArrayModule.ObservableArray();

localArray.push([
  {title:"Safe Social Networks"}, {title:"Sharing Open Mentoring"}]);

var topicListModel = new observable.Observable();

Object.defineProperty(topicListModel, "topicItems", {
    get: function () {
        return localArray;
    },
    getItem: function(index) {
      return localArray.getItem(index);
    },
    enumerable: true,
    configurable: true
})

exports.topicListModel = topicListModel;
