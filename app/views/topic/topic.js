var unitListModel = require("../../shared/view-models/unit-list").unitListModel;
var frameModule = require("ui/frame");

var topicView = {};

topicView.pageNavigatedTo = function(args) {
  var page = args.object;
  page.bindingContext = unitListModel;
}

topicView.listViewItemTap = function(args) {
  var itemIndex = args.index;
  var topmost = frameModule.topmost();
  var navigationEntry = {
      moduleName: "/views/unit/unit",
      context: unitListModel.unitItems.getItem(itemIndex),
      animated: false
  };
  topmost.navigate(navigationEntry);
};

topicView.buttonBackTap = function(args) {
  var topmost = frameModule.topmost();
  topmost.goBack();
}

module.exports = topicView;
