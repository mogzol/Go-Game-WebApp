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

	static updateAccountFromPlayer(player, db)
	{
		var users = db.collection(userDB);

		users.find({_username: player.player}, function(err, results) {
			if (err) {
				console.log(err);
				return;
			} else if (results.length < 1) {
				console.log('Unable to find user ' + player.player + ' in the database, can\'t update details!');
				return;
			}

			// Create an account from the first user (there should only be 1 user)
			var account = new Account(results[0]);

			// Update the account details
			account.updateFromPlayer(player);

			// And persist it back to the database
			users.update({_username: account.username}, account, function(err) {
				if (err) {
					console.log(err);
				}
			});
		});
	}

	static getPlayerSkills(user1, user2, db, cb)
	{
		var users = db.collection(userDB);

		users.find({_username: {$in: [user1, user2]}}, function(err, results) {
			// Create an account from the first user (there should only be 1 user)
			var u1skill, u2skill;
			if (results[0] && results[0]._username === user1) {
				u1skill = results[0]._userSkillLevel;
			} else if (results[1] && results[1]._username === user1) {
				u1skill = results[1]._userSkillLevel;
			}

			if (results[0] && results[0]._username === user2) {
				u2skill = results[0]._userSkillLevel;
			} else if (results[1] && results[1]._username === user2) {
				u2skill = results[1]._userSkillLevel;
			}

			cb(u1skill, u2skill);
		});
	}
};
