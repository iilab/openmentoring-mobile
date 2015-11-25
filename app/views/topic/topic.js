var frameModule = require("ui/frame");

var topicView = {};

topicView.pageNavigatedTo = function(args) {
  var page = args.object;
  page.bindingContext = page.navigationContext;
}

topicView.buttonBackTap = function(args) {
  var topmost = frameModule.topmost();
  topmost.goBack();
}

module.exports = topicView;
