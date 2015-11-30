var observable = require("data/observable");
var observableArrayModule = require("data/observable-array");

var localArray = new observableArrayModule.ObservableArray();

localArray.push([
  {htmlString:"<span>I'm some html</span>"}]);

var unitModel = new observable.Observable();

Object.defineProperty(unitModel, "cardItems", {
    get: function () {
        return localArray;
    },
    getItem: function(index) {
      return localArray.getItem(index);
    },
    enumerable: true,
    configurable: true
})

exports.unitModel = unitModel;
