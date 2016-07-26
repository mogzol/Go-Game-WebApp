"user strict";

var routes = require('../routes.js');
var Account = require('../model/Account');
var bcrypt = require('bcryptjs');

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
				csrfToken: request.csrfToken(),
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

	static updateAction(request, response, db)
	{
		var email = request.body.email;
		var password = request.body.password;

		var update = {$set: {}};
		if (email) {
			update.$set._email = email;
		}

		if (password) {
			password = bcrypt.hashSync(password, 10);
			update.$set._password = password;
		}

		var users = db.collection(userDB);

		if (update.$set._email || update.$set._password) {
			users.update({_username: request.session.username}, update, function(err) {
				if (err) {
					console.log(err);
					request.flash('danger', 'An error occurred, please try again.');
					response.redirect(routes.account);
					return;
				}

				request.flash('success', 'Account updated successfully');
				response.redirect(routes.account);
			});
		} else {
			request.flash('success', 'Account updated successfully');
			response.redirect(routes.account);
		}
	}
};
