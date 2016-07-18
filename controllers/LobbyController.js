"use strict";

var routes = require('../routes.js');
var Lobby = require('../model/Lobby.js');
var WebSocket = require('ws');

var lobbies = {};
var lobbyConnections = {};

module.exports = class LobbyController {

	static indexAction(request, response) {
		var openLobbies = [];

		// Look through lobbies for open ones
		for (var lobby in lobbies) {
			if (!lobbies.hasOwnProperty(lobby))
				continue; // skip loop if the property is from prototype

			lobby = lobbies[lobby];
			if (lobby.visibility === 'public' && !lobby.locked)
				openLobbies.push(lobby);

		}

		response.render('views/lobbies.html.njk', {
			csrfToken: request.csrfToken(),
			lobbies: openLobbies,
		});
	}

	static addAction(request, response) {
		var name = request.body.name;
		var visibility = request.body.visibility;

		if (!name || !['public', 'private'].includes(visibility)) {
			request.flash('danger', 'Please specify a name and a valid visibility.');
			response.redirect(routes.lobbies);
			return;
		}

		if (lobbies[name]) {
			request.flash('danger', 'A lobby with that name already exists, please try a different one.');
			response.redirect(routes.lobbies);
			return;
		}

		var lobby = new Lobby(name, visibility);
		lobbies[name] = lobby;
		response.redirect(routes.joinLobby.replace(':lobby', encodeURIComponent(lobby.name)));
	}

	static joinAction(request, response) {
		var name = request.params.lobby;
		var lobby = lobbies[name];

		if (!lobby) {
			request.flash('danger', 'The requested lobby doesn\'t exist.');
			response.redirect(routes.lobbies);
			return;
		}

		response.render('views/lobby.html.njk', {
			lobby: lobby,
		});
	}

	static wsAction(ws, request) {
		var name = request.params.lobby;
		var lobby = lobbies[name];
		if (!lobby) {
			ws.close(undefined, 'The requested lobby doesn\'t exist.');
			return;
		}

		var user = request.session.username;
		if (!user) {
			ws.close(undefined, 'Unauthorized');
			return;
		}

		// Updates the lobby and sends it to all of the lobbies users
		function pushUpdate() {
			// For each user in this lobby, send them the updated lobby
			for (var user in lobbyConnections[name]) {
				if (!lobbyConnections[name].hasOwnProperty(user))
					continue; // skip loop if the property is from prototype

				ws = lobbyConnections[name][user];
				if (ws && ws.readyState == WebSocket.OPEN)
					ws.send(JSON.stringify({lobby: lobby}));
			}
		}

		// First we'll try to add the user to the lobby
		try {
			lobby.addUser(user);
		} catch (err) {
			ws.close(undefined, err);
			return;
		}

		// If that worked then we'll save the socket connection
		if (!lobbyConnections[name])
			lobbyConnections[name] = {};
		lobbyConnections[name][user] = ws;

		// And then push the updated lobby to all lobby members
		pushUpdate();

		// Handle receiving any messages from the user
		ws.on('message', function(message) {
			message = JSON.parse(message);

			if (message.message) {
				lobby.addMessage(user, message.message);
				pushUpdate();
			}

			if (message.owner && lobby.owner === user && lobby.users.includes(message.owner)) {
				lobby.owner = message.owner;
				pushUpdate();
			}

			if ((message.kick || message.ban) && lobby.owner === user) {
				var remove = message.kick || message.ban;
				var ban = Boolean(message.ban);
				var action = ban ? 'been banned from' : 'been kicked from';
				lobby.removeUser(remove, ban, action);
				if (lobbyConnections[name]) {
					var ws = lobbyConnections[name][remove];
					if (ws) {
						ws.close(undefined, 'You have ' + action + ' the lobby');
					}

					delete lobbyConnections[name][remove];
				}

				pushUpdate();
			}
		});

		// When this websocket is closed, remove the user from the lobby
		ws.on('close', function() {
			// Remove user from lobby connections
			if (lobbyConnections[name])
				delete lobbyConnections[name][user];

			// Remove the user from the lobby
			lobby.removeUser(user);

			// If there are no more users in this lobby, delete it
			if (lobby.users.length < 1) {
				// Close any open connections (there shouldn't be any though)
				for (var username in lobbyConnections[name]) {
					if (!lobbyConnections[name].hasOwnProperty(username))
						continue; // skip loop if the property is from prototype

					ws = lobbyConnections[name][username];
					if (ws)
						ws.close(undefined, 'Lobby closed');
				}

				// Delete this lobby from the connection list and from the lobby list
				delete lobbyConnections[name];
				delete lobbies[name];
			} else {
				pushUpdate(lobby);
			}
		});
	}
};
