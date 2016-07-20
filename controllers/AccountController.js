"user strict";

var routes = require('../routes.js');
var Account = require('../model/Account');

var userDB = "user";

module.exports = class AccountController
{
	static indexAction(request, response, db)
	{
		var user = request.session.username;

		var users = db.collection(userDB);
		users.find({_username: user}, function(err, users) {
			if (err) {
				console.log(err);
				request.flash('danger', 'Couldn\'t find account.');
				response.redirect(routes.account);
				return;
			} else if (users.length < 1) {
				request.flash('danger', 'Couldn\'t find account.');
				response.redirect(routes.account);
				return;
			}

			// Create an account from the first user (there should only be 1 user)
			var account = new Account(users[0]);
			if(account.userType === 1)
				var type = "Basic";
			else
				var type = "Administrator";

			response.render('views/account.html.njk', {
				userName: account.username,
				userEmail: account.email,
				userType: type,
				playerGames: account.userGames,
				numWin: account.userWins,
				numLoss: account.userLoss,
				ratio:  account.overallRatio,
				userSkill:  account.userSkillLevel,
				UserBestGame: account.userBestGame

			})
		});
	}
}
