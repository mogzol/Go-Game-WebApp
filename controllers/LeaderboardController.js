
"user strict";

var routes = require('../routes.js');
var Account = require('../model/Account');

var userDB = "user";

module.exports = class LeaderboardController
{
	static indexAction(request, response, db) {

		var users = db.collection(userDB);
		users.find({}).limit(20).sort({_userSkillLevel: -1}, function(err, users) {
			if (err) {
				console.log(err);
				return;
			} else if (users.length < 1) {
				request.flash('danger', 'Couldn\'t find accounts.');
				response.redirect(routes.account);
				return;
			}

			var accounts = [];

			for (var users of users){
				accounts.push(users);
			}

			response.render('views/leaderboards.html.njk', {
				accounts:accounts
			})//render

		});//users
	}//static
}
