"use strict";

var routes = require('../routes.js');

var Lobby = require('../model/Lobby.js');

var lobbyDb = 'lobby';

module.exports = class LobbyController {
	static indexAction(request, response, db) {
		var lobbies = db.collection(lobbyDb);
		lobbies.find({}, function(err, lobbies) {
			if (err) {
				console.log(err);
				request.flash('danger', 'An error occurred, please try again.');
				response.render('views/lobbies.html.njk');
				return;
			}

			var realLobbies = [];
			for (var lobby of lobbies) {
				realLobbies.push(new Lobby(lobby));
			}

			response.render('views/lobbies.html.njk', {
				csrfToken: request.csrfToken(),
				lobbies: realLobbies,
			});
		});
	}

	static addAction(request, response, db) {
		var name = request.body.name;
		var visibility = request.body.visibility;

		if (!name || !['public', 'private'].includes(visibility)) {
			request.flash('danger', 'Please specify a name and a valid visibility.');
			response.redirect(routes.lobbies);
			return;
		}

		var lobbies = db.collection(lobbyDb);
		lobbies.find({_name: name}, function(err, user) {
			if (err) {
				console.log(err);
				request.flash('danger', 'An error occurred, please try again.');
				response.redirect(routes.lobbies);
				return;
			} else if (user.length > 0) {
				request.flash('danger', 'A lobby with that name already exists, please try a different one.');
				response.redirect(routes.lobbies);
				return;
			}

			var lobby = new Lobby(name, request.session.username);

			// If the user doesn't exist, insert them
			lobbies.insert(lobby, function(err) {
				if (err) {
					console.log(err);
					request.flash('danger', 'An error occurred, please try again.');
					response.redirect(routes.lobbies);
					return;
				}

				request.flash('success', 'Lobby created successfully!');
				response.redirect(routes.lobbies);
			});
		});
	}
};
