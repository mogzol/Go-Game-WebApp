"use strict";

var bcrypt = require('bcryptjs');
var routes = require('../routes.js');

var Account = require('../model/Account.js');

var userDb = 'user';

module.exports = class Login
{
	/**
	 * Handles rendering the base user page
	 */
	static indexAction(request, response, db)
	{
		response.render('views/login.html.njk', {
			csrfToken: request.csrfToken()
		});
	}

	static loginAction(request, response, db)
	{
		var username = request.body.username;
		var password = request.body.password;

		if (!username || !password) {
			request.flash('danger', 'Please specify a username and password.');
			response.redirect(routes.login);
			return;
		}

		var users = db.collection(userDb);
		users.find({_username:username}, function(err, users) {
			if (err) {
				console.log(err);
				request.flash('danger', 'An error occurred, please try again.');
				response.redirect(routes.login);
				return;
			} else if (users.length < 1) {
				request.flash('danger', 'Invalid username/password.');
				response.redirect(routes.login);
				return;
			}

			// Create an account from the first user (there should only be 1 user)
			var account = new Account(users[0]);

			// Verify the password
			if (bcrypt.compareSync(password, account.password)) {
				// For now we'll just show an alert that it was good
				request.session.username = account.username;
				request.flash('success', 'You have been successfully logged in');
				response.redirect(routes.home);
			} else {
				// For now we'll just show an alert that it was good
				request.flash('danger', 'Invalid username/password.');
				response.redirect(routes.login);
			}
		});
	}

	static logoutAction(request, response)
	{
		delete request.session.username;
		request.flash('success', 'Successfully logged out');
		response.redirect(routes.home);
	}

	static addAccountAction(request, response, db)
	{
		var username = request.body.username;
		var password = request.body.password;
		var email = request.body.email;

		if (!username || !password || !email) {
			request.flash('danger', 'Please specify a username, password, and email address.');
			response.redirect(routes.login);
			return;
		}

		var users = db.collection(userDb);

		// First we will search for a user with that username
		users.find({_username: username}, function(err, user) {
			if (err) {
				console.log(err);
				request.flash('danger', 'An error occurred, please try again.');
				response.redirect(routes.login);
				return;
			} else if (user.length > 0) {
				request.flash('danger', 'That username already exists, please try a different one.');
				response.redirect(routes.login);
				return;
			}

			var account = new Account(username, bcrypt.hashSync(password, 10), email);

			// If the user doesn't exist, insert them
			users.insert(account, function(err) {
				if (err) {
					console.log(err);
					request.flash('danger', 'An error occurred, please try again.');
					response.redirect(routes.login);
					return;
				}

				request.flash('success', 'User added to the database!');
				response.redirect(routes.login);
			});
		});
	}
};

