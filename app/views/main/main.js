var topicListModel = require("../../shared/view-models/topic-list").topicListModel;
var frameModule = require("ui/frame");

var mainView = {};

mainView.pageLoaded = function(args) {
    var page = args.object;
    page.bindingContext = topicListModel;
};

mainView.listViewItemTap = function(args) {
  var itemIndex = args.index;
  var topmost = frameModule.topmost();
  var navigationEntry = {
      moduleName: "/views/topic/topic",
      context: topicListModel.topicItems.getItem(itemIndex),
      animated: false
  };
  topmost.navigate(navigationEntry);
};

module.exports = mainView;
