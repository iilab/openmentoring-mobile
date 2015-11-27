var observable = require("data/observable");
var observableArrayModule = require("data/observable-array");

var localArray = new observableArrayModule.ObservableArray();

localArray.push([
  {title:"How To Share"}]);

var unitListModel = new observable.Observable();

Object.defineProperty(unitListModel, "unitItems", {
    get: function () {
        return localArray;
    },
    getItem: function(index) {
      return localArray.getItem(index);
    },
    enumerable: true,
    configurable: true
})

exports.unitListModel = unitListModel;
