"use strict";

var routes = require('../routes.js');
var Lobby = require('../model/Lobby.js');
var GameController = require('./GameController.js');
var WebSocket = require('ws');

var lobbies = {};
var lobbyConnections = {};

module.exports = class LobbyController {

	/**
	 * Run by server.js periodically to clean up any lobbies that are invalid
	 */
	static cleanupLobbies()
	{
		for (var lobbyId in lobbies) {
			if (!lobbies.hasOwnProperty(lobbyId))
				continue; // skip loop if the property is from prototype

			var lobby = lobbies[lobbyId];
			this.deleteLobbyIfInvalid(lobby);
		}
	}

	/**
	 * Deletes the lobby if it is invalid. Invalid lobbies are lobbies that have no users and no active games.
	 *
	 * @param lobby The ID for the lobby
	 */
	static deleteLobbyIfInvalid(lobby)
	{
		this.cleanupGames(lobby);

		// If the lobby has no users, and has no games, or no active games for over 5 mins, delete it
		if (lobby.users.length < 1 && (lobby.games.length < 1 || lobby.lastFinished() > 300000)) {
			// Clear the lobby games (also deletes them from GameController)
			this.clearGames(lobby);

			// Close any open connections (there shouldn't be any though)
			for (var username in lobbyConnections[lobby.id]) {
				if (!lobbyConnections[lobby.id].hasOwnProperty(username))
					continue; // skip loop if the property is from prototype

				var ws = lobbyConnections[lobby.id][username];
				if (ws)
					ws.close(undefined, 'Lobby closed');
			}

			// Delete the lobby and the connections
			delete lobbyConnections[lobby.id];
			delete lobbies[lobby.id];
		}
	}

	/**
	 * Deletes games in the lobby that have not started and have had no users connect for over 60 seconds
	 *
	 * @param lobby
	 */
	static cleanupGames(lobby)
	{
		// If the lobby starts off with unfinished games, and after this all games are finished, we want to notify
		// the lobby users that they can now start the next round
		var finished = lobby.gamesFinished();

		// Removing games while iterating causes issues, so we will save what we want to remove and then remove them after
		var removes = [];
		for (var game of lobby.games) {
			if (!game.winner && !game.turn && (Date.now() - game.startDate > 60000)) {
				var id = game.id;
				removes.push(id);
				GameController.deleteGame(id);
			}
		}

		for (var remove of removes) {
			lobby.removeGame(remove);
		}

		if (!finished && lobby.gamesFinished()) {
			lobby.addMessage(null, 'All lobby games are now completed, you may now start the next round of games.');
			this.pushUpdate(lobby);
		}
	}

	/**
	 * Deletes all games that are in the lobby
	 *
	 * @param lobby
	 */
	static clearGames(lobby)
	{
		for (var game of lobby.games) {
			GameController.deleteGame(game.id);
		}
		lobby.games = [];
	}

	/**
	 * Pushes the current lobby data to all connected lobby members
	 *
	 * @param lobby
	 */
	static pushUpdate(lobby)
	{
		// For each user in this lobby, send them the updated lobby
		for (var user in lobbyConnections[lobby.id]) {
			if (!lobbyConnections[lobby.id].hasOwnProperty(user))
				continue; // skip loop if the property is from prototype

			var ws = lobbyConnections[lobby.id][user];
			if (ws && ws.readyState === WebSocket.OPEN)
				ws.send(JSON.stringify({lobby: lobbies[lobby.id]}));
		}
	}

	static indexAction(request, response)
	{
		var openLobbies = [];

		// Look through lobbies for open ones
		for (var lobby in lobbies) {
			if (!lobbies.hasOwnProperty(lobby))
				continue; // skip loop if the property is from prototype

			lobby = lobbies[lobby];
			if (lobby.visibility === 'public' && !lobby.starting)
				openLobbies.push(lobby);

		}

		response.render('views/lobbies.html.njk', {
			csrfToken: request.csrfToken(),
			lobbies: openLobbies,
		});
	}

	static addAction(request, response)
	{
		var name = request.body.name;
		var visibility = request.body.visibility;

		if (!name || !['public', 'private'].includes(visibility)) {
			request.flash('danger', 'Please specify a name and a valid visibility.');
			response.redirect(routes.lobbies);
			return;
		}

		// We don't want duplicate public lobbies with same name, so we only generate unique on private lobbies
		var lobby = new Lobby(name, visibility);

		if (lobbies[lobby.id]) {
			request.flash('danger', 'A lobby with that name already exists, please try a different one.');
			response.redirect(routes.lobbies);
			return;
		}

		lobbies[lobby.id] = lobby;
		response.redirect(routes.joinLobby.replace(':lobby', encodeURIComponent(lobby.id)));
	}

	static joinAction(request, response)
	{
		var id = request.params.lobby;
		var lobby = lobbies[id];

		if (!lobby) {
			request.flash('danger', 'The requested lobby doesn\'t exist.');
			response.redirect(routes.lobbies);
			return;
		}

		var allowed = lobby.verifyAllowedToJoin(request.session.username);
		if (allowed !== true) {
			request.flash('danger', allowed);
			response.redirect(routes.lobbies);
			return;
		}

		response.render('views/lobby.html.njk', {
			name: lobby.name,
			id: id,
		});
	}

	static wsAction(ws, request)
	{
		var id = request.params.lobby;
		var lobby = lobbies[id];

		if (!lobby) {
			ws.close(undefined, 'The requested lobby doesn\'t exist.');
			return;
		}

		var user = request.session.username;
		if (!user || lobby.verifyAllowedToJoin(user) !== true) {
			ws.close(undefined, 'Unauthorized');
			return;
		}

		// First we'll add the user to the lobby
		lobby.addUser(user);

		// If the lobby has multiple games and they are all finished, send a message notifying the lobby
		if (lobby.games.length > 1 && lobby.gamesFinished()) {
			lobby.addMessage(null, 'All lobby games are now completed, you may now start the next round of games.');
		} else if (lobby.games.length === 1) {
			lobby.addMessage(null, 'Congratulations, you are the champion of this lobby. You may leave at any time.');
		}

		// And then we'll save the socket connection
		if (!lobbyConnections[id])
			lobbyConnections[id] = {};
		lobbyConnections[id][user] = ws;

		// Re-define pushUpdate for this specific lobby (for easy usage)
		var pushUpdate = function() { LobbyController.pushUpdate(lobby) };

		// And then push the updated lobby to all lobby members
		pushUpdate();

		// Handle receiving any messages from the user
		ws.on('message', function(message) {
			message = JSON.parse(message);

			// A message for the chat
			if (message.message) {
				lobby.addMessage(user, message.message);
				pushUpdate();
			}

			// Change lobby owner
			if (message.owner && lobby.owner === user && lobby.users.includes(message.owner)) {
				lobby.owner = message.owner;
				pushUpdate();
			}

			// Kick or ban a user
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

			// Start the game
			if (message.start && lobby.owner === user && lobby.starting === false) {
				// If the lobby has games that aren't finished yet, we can't start until those games finish and the
				// winners connect. We'll cleanup the games before checking.
				LobbyController.cleanupGames(lobby);
				if (!lobby.gamesFinished()) {
					lobby.addMessage(null, 'ERROR: There are still games in this lobby in progress, please wait for them ' +
						'to complete before continuing. A message will be sent when the lobby is ready to start.');
					pushUpdate();
					return;
				}

				// Set the lobby to starting so that we can't start again and new users can't join
				lobby.starting = true;

				// The games are now finished (or this lobby doesn't have games) so we'll remove them from the lobby
				// so that we can replace them with the new games
				LobbyController.clearGames(lobby);

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

				lobby.addMessage(null, 'Creating game(s)...');

				// If this lobby isn't already private, convert it.
				if (lobby.visibility !== 'private') {
					lobby.changeVisibility('private', true);
					lobbies[lobby.id] = lobby;
					lobbyConnections[lobby.id] = lobbyConnections[id];
					delete lobbies[id];
					delete lobbyConnections[id];
					id = lobby.id;
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

						// Set starting to false since we were unsuccessful
						lobby.starting = false;
						return;
					}

					lobby.addGame(game);
				}

				// Push a last minute update before everyone disconnects
				lobby.addMessage(null, 'Game(s) are about to begin, get ready');
				pushUpdate();

				// Do a countdown
				setTimeout(function () {
					lobby.addMessage(null, '3...');
					pushUpdate();
				}, 1000);
				setTimeout(function () {
					lobby.addMessage(null, '2...');
					pushUpdate();
				}, 2000);
				setTimeout(function () {
					lobby.addMessage(null, '1...');
					pushUpdate();
				}, 3000);

				// Tell game members to join the games
				setTimeout(function () {
					if (lobbyConnections[id]) {
						for (var game of lobby.games) {
							[game.playerBlack.player, game.playerWhite.player].forEach(function(username) {
								var ws = lobbyConnections[id][username];
								if (ws) {
									ws.close(4000, game.id);
								}
							});
						}
					}
				}, 4000);
			}
		});

		// When this websocket is closed, remove the user from the lobby
		ws.on('close', function() {
			// Remove user from lobby connections
			if (lobbyConnections[id])
				delete lobbyConnections[id][user];

			// Remove the user from the lobby
			lobby.removeUser(user);

			// Delete the lobby if it is invalid
			LobbyController.deleteLobbyIfInvalid(lobby);

			// If the lobby is starting, then we won't push the update, as everyone is disconnecting
			if (!lobby.starting) {
				pushUpdate();
			}

			// If the last user just disconnected, the lobby is no longer starting
			if (lobby.users.length < 1) {
				lobby.starting = false;
			}
		});
	}
};
