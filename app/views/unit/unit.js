var unitModel = require("../../shared/view-models/unit").unitModel;
var frameModule = require("ui/frame");

var unitView = {};

unitView.pageNavigatedTo = function(args) {
  var page = args.object;
  page.bindingContext = unitModel;
}

unitView.buttonBackTap = function(args) {
  var topmost = frameModule.topmost();
  topmost.goBack();
}

module.exports = unitView;
