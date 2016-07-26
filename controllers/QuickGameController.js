"use strict";

var routes = require('../routes.js');

module.exports = class QuickGameController {

	static indexAction(request, response) {
		response.render('views/quickgame.html.njk', {
			csrfToken: request.csrfToken(),
		});
	}

};
