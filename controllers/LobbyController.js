"use strict";

var routes = require('../routes.js');
var Lobby = require('../model/Lobby.js');
var GameController = require('./GameController.js');
var WebSocket = require('ws');

var lobbies = {};
var lobbyConnections = {};

module.exports = class LobbyController {

	static generateUniqueLobbyId(name) {
		var nanotime = process.hrtime();
		return String(nanotime[0]) + nanotime[1] + '-' + name;
	}

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

		// We don't want duplicate public lobbies with same name, so we only generate unique on private lobbies
		var id = visibility === 'private' ? this.generateUniqueLobbyId(name) : name;

		if (lobbies[id]) {
			request.flash('danger', 'A lobby with that name already exists, please try a different one.');
			response.redirect(routes.lobbies);
			return;
		}

		lobbies[id] = new Lobby(name, visibility);
		response.redirect(routes.joinLobby.replace(':lobby', encodeURIComponent(id)));
	}

	static joinAction(request, response) {
		var id = request.params.lobby;
		var lobby = lobbies[id];

		if (!lobby) {
			request.flash('danger', 'The requested lobby doesn\'t exist.');
			response.redirect(routes.lobbies);
			return;
		}

		response.render('views/lobby.html.njk', {
			name: lobby.name,
			id: id,
		});
	}

	static wsAction(ws, request) {
		var id = request.params.lobby;
		var lobby = lobbies[id];
		var closing = false;

		if (!lobby) {
			ws.close(undefined, 'The requested lobby doesn\'t exist.');
			return;
		}

		var user = request.session.username;
		if (!user) {
			ws.close(undefined, 'Unauthorized');
			return;
		}

		// First we'll try to add the user to the lobby
		try {
			lobby.addUser(user);
		} catch (err) {
			ws.close(undefined, err);
			return;
		}

		// If that worked then we'll save the socket connection
		if (!lobbyConnections[id])
			lobbyConnections[id] = {};
		lobbyConnections[id][user] = ws;

		// Updates the lobby and sends it to all of the lobbies users
		function pushUpdate() {
			// For each user in this lobby, send them the updated lobby
			for (var user in lobbyConnections[id]) {
				if (!lobbyConnections[id].hasOwnProperty(user))
					continue; // skip loop if the property is from prototype

				ws = lobbyConnections[id][user];
				if (ws && ws.readyState == WebSocket.OPEN)
					ws.send(JSON.stringify({lobby: lobby}));
			}
		}

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
				if (lobbyConnections[id]) {
					var ws = lobbyConnections[id][remove];
					if (ws) {
						ws.close(undefined, 'You have ' + action + ' the lobby');
					}

					delete lobbyConnections[id][remove];
				}

				pushUpdate();
			}

			if (message.start && lobby.owner === user) {
				lobby.addMessage(null, 'Starting Game...');

				var size = parseInt(message.start.size);
				var ai = message.start.ai;

				lobby.addMessage(null, 'Splitting users into groups of 2...');

				var groups = [[]];

				for (var i = 0; i < lobby.users.length; i++) {
					if (groups[groups.length - 1].length < 2) {
						groups[groups.length - 1].push(lobby.users[i]);
					} else {
						groups.push([lobby.users[i]]);
					}
				}

				// If the last group only has 1 user, add an AI
				if (groups[groups.length - 1].length < 2) {
					groups[groups.length - 1].push({ai: true, mode: ai});
				}

				lobby.addMessage(null, 'Creating games...');

				// Push a last minute update before everyone disconnects
				pushUpdate();

				// Lock the lobby so it doesn't get deleted.
				lobby.locked = true;

				// If this lobby isn't already private, convert it.
				if (lobby.visibility !== 'private') {
					lobby.visibility = 'private';
					var newId = LobbyController.generateUniqueLobbyId(lobby.name);
					lobbies[newId] = lobbies[id];
					lobbyConnections[newId] = lobbyConnections[id];
					delete lobbies[id];
					delete lobbyConnections[id];
					id = newId;
				}

				for (var group of groups) {
					var game = GameController.generateLobbyGame(group[0], group[1], size, id);

					// If ID is false, then the size or AI is invalid
					if (game === false) {
						lobby.addMessage(null, 'ERROR: Game parameters are invalid. Please try again with valid selections.');

						// Delete the games we've already made
						for (let game of lobby.games) {
							GameController.deleteGame(game.id);
						}
						lobby.games = [];

						pushUpdate();
						return;
					}

					lobby.addGame(game);
				}

				// Tell game members to join the games
				closing = true;
				if (lobbyConnections[id]) {
					for (let game of lobby.games) {
						[game.playerBlack.player, game.playerWhite.player].forEach(function(username) {
							var ws = lobbyConnections[id][username];
							if (ws) {
								ws.close(4000, game.id);
							}
						});
					}
				}
			}
		});

		// When this websocket is closed, remove the user from the lobby
		ws.on('close', function() {
			// Remove user from lobby connections
			if (lobbyConnections[id])
				delete lobbyConnections[id][user];

			// Remove the user from the lobby
			lobby.removeUser(user);

			// If there are no more users in this lobby, delete it
			if (lobby.users.length < 1) {
				// Close any open connections (there shouldn't be any though)
				for (var username in lobbyConnections[id]) {
					if (!lobbyConnections[id].hasOwnProperty(username))
						continue; // skip loop if the property is from prototype

					ws = lobbyConnections[id][username];
					if (ws)
						ws.close(undefined, 'Lobby closed');
				}

				// If the lobby is not locked, delete this lobby from the connection list and from the lobby list
				if (!lobby.locked) {
					delete lobbyConnections[id];
					delete lobbies[id];
				}

				closing = false;
			} else if (!closing) { // If we aren't closing all connections, push the update
				pushUpdate(lobby);
			}
		});
	}
};
