var Observable = require("data/observable").Observable;

function User(info) {
	info = info || {};

	var viewModel = new Observable({
		preferences: info.preferences || {}
	});

	return viewModel;
}

module.exports = User;
