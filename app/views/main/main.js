var vmModule = require("../../shared/view-models/user-view-model");
function pageLoaded(args) {
    var page = args.object;
    page.bindingContext = vmModule.User;
}
exports.pageLoaded = pageLoaded;
