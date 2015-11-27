var observable = require("data/observable");

var unitModel = new observable.Observable();

Object.defineProperty(unitModel, "htmlString", {
    get: function () {
        return "<span>I'm some html</span>";
    },
    configurable: true
})

exports.unitModel = unitModel;
