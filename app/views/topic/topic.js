var topicView = {};

topicView.pageNavigatedTo = function(args) {
    var page = args.object;
    page.bindingContext = page.navigationContext;
}

module.exports = topicView;
