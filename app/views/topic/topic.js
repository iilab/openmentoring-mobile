var topic = {};

topic.pageNavigatedTo = function(args) {
    var page = args.object;
    page.bindingContext = page.navigationContext;
}

module.exports = topic;
