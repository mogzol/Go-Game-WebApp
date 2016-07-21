"use strict";

var routes = require('../routes.js');
var WebSocket = require('ws');

var Player = require('../model/Player.js');
var Game = require('../model/Game.js');

var activeGames = {};
var gameConnections = {};
var minBoardSize = 3;
var maxBoardSize = 27;

module.exports = class GameController {

	/**
	 * ID is current seconds followed by current nanoseconds followed by a dash and a random number from 0-99999
	 * Really, the random number is unnecessary since there is no way we will be generating multiple games in the
	 * same nanosecond, but hey, maybe the computers of tomorrow will be, so why not add the random number just to
	 * be safe.
	 *
	 * @returns {string}
	 */
	static generateId() {
		var nanotime = process.hrtime();
		return String(nanotime[0]) + nanotime[1] + '-' + Math.floor(Math.random() * 100000);
	}

	/**
	 * Sets up a game and returns the game ID
	 *
	 * @param {string}        user1 The username for the user playing as black
	 * @param {string|object} user2 The username for the user playing as white, or an object if this is an AI.
	 *                              AI object should look like: {ai: true, mode: 'MODE'}. Replace MODE with the ai mode.
	 * @param {int}           size  The board size
	 *
	 * @returns {string|boolean} The ID of the game, or false if there was an error creating the game
	 */
	static generateLobbyGame(user1, user2, size) {
		// Make sure size is valid
		if (!Number.isInteger(size) || size % 2 !== 1 || size < minBoardSize || size > maxBoardSize)
			return false;

		// Create players based on the usernames
		var player1 = new Player(user1, 1);

		var player2;
		if (user2.ai) {
			if (!['random', 'maxLibs', 'offensive', 'defensive'].includes(user2.mode))
				return false;

			player2 = new Player('AI (' + user2.mode + ')', 2, true);
		} else {
			player2 = new Player(user2, 2);
		}

		// Set up the game
		var game = new Game(player1, player2, size);

		// Add the game to the array
		var id = this.generateId();
		activeGames[id] = game;

		return id;
	}

	static lobbyGameAction(request, response) {
		var gameId = request.params.id;

		if (!activeGames[gameId]) {
			request.flash('danger', 'The requested game was not found');
			response.redirect(routes.lobbies);
			return;
		}

		response.render('views/game.html.njk', {
			gameId: gameId,
		})
	}

	static lobbyWsAction(ws, request) {
		var gameId = request.params.id;
		var game = activeGames[gameId];
		var user = request.session.username;
		var passes = 0;

		if (!game) {
			ws.close(undefined, 'The requested game doesn\'t exist.');
			return;
		}

		if (game.started) {
			ws.close(undefined, 'The requested game has already started.');
			return;
		}

		var player = 0;
		if (game.playerBlack.player === user)
			player = 1;
		else if (game.playerWhite.player === user)
			player = 2;

		// Make sure this player is part of this game
		if (player < 1) {
			ws.close(undefined, 'You are not a member of this game.');
			return;
		}

		if (!gameConnections[gameId])
			gameConnections[gameId] = [];

		// Make sure this player hasn't already connected
		if (gameConnections[gameId][player - 1]) {
			ws.close(undefined, 'You are already connected to this game.');
			return;
		}

		// Save this websocket connection
		gameConnections[gameId][player - 1] = ws;

		// If both users have connected (or second user is an AI) start the game
		if (gameConnections[gameId][0] && (gameConnections[gameId][1] || game.playerWhite.isAI)) {
			game.start();
			pushUpdate({
				message: {by: null, msg: 'The game has started!'},
				board: game.board,
				black: game.playerBlack,
				white: game.playerWhite,
				nextTurn: game.turn.color
			});
		} else {
			ws.send(JSON.stringify({message: {by: null, msg: 'Waiting for other player to connect...'}}))
		}

		// Sends the board to both game members
		function pushUpdate(data) {
			for (var ws of gameConnections[gameId]) {
				ws.send(JSON.stringify(data));
			}
		}

		ws.on('message', function(message) {
			message = JSON.parse(message);

			if (message.move) {
				if (game.turn.player === user) {
					var result = game.makeMove(message.move.x, message.move.y, game.turn);

					if (result !== true) {
						ws.send(JSON.stringify({error: result}));
					} else {
						// If a move is made, we can reset passes to 0
						passes = 0;

						// And send the new board and change the turn
						pushUpdate({board: game.board, nextTurn: game.turn.color});
					}
				} else {
					ws.send(JSON.stringify({error: 'It is not your turn', nextTurn: game.turn.color}));
				}
			}

			if (message.pass) {
				if (game.turn.player === user) {
					passes++;

					if (passes > 1) {
						game.finishGame();

						// TODO: Proper finish game, if there were others in lobby, reconnect the winners, persist player scores to db, etc.
						pushUpdate({gameOver: true, player1: game.playerBlack, player2: game.playerWhite});
						for (let ws of gameConnections[gameId]) {
							ws.close(undefined, 'Game Over');
						}
						return;
					}

					game.switchTurn();
					pushUpdate({pass: user, nextTurn: game.turn.color});
				} else {
					ws.send(JSON.stringify({error: 'It is not your turn', nextTurn: game.turn.color}));
				}
			}

			if (message.message) {
				pushUpdate({message: {by: user, msg: message.message}});
			}
		});

		ws.on('close', function() {
			// Delete this user's connection
			delete gameConnections[gameId][player - 1];

			if (!gameConnections[gameId][0] && !gameConnections[gameId][1]) {
				// If neither of the users are connected, delete this game entirely
				delete gameConnections[gameId];
				delete activeGames[gameId];
			} else if (game.turn !== null) { // If game is not finished, finish it
				var stillConnected = player === 1 ? gameConnections[gameId][1] : gameConnections[gameId][0];
				game.finishGame();

				if (ws.readyState == WebSocket.OPEN)
					stillConnected.send(JSON.stringify({gameOver: true, player1: game.playerBlack, player2: game.playerWhite}));

				// TODO: Proper finish game, if there were others in lobby, reconnect the winners, persist player scores to db, etc.
				stillConnected.close(undefined, 'Game Over');
			}
		});
	}

	static hotseatAction(request, response) {
		var size = 9;//parseInt(request.body.size);

		if (isNaN(size) || size % 2 !== 1 || size < minBoardSize || size > maxBoardSize) {
			request.flash('danger', 'Board size must be an odd integer between 3 and 27');
			response.redirect(routes.quickGame);
			return;
		}

		// Set up the players
		var player1 = new Player('Player 1', 1);
		var player2 = new Player('Player 2', 2);

		// Set up the game
		var game = new Game(player1, player2, size);

		// Add the game to the array
		var id = this.generateId();
		activeGames[id] = game;

		// Store the game in the user's session so that we know which one they are playing when the websocket connects
		request.session.hotseatGame = id;

		response.render('views/hotseat-game.html.njk', {
			gameId: id,
		});
	}

	static hotseatWsAction(ws, request) {
		var gameId = request.params.id;
		var game = activeGames[gameId];
		var passes = 0;

		if (!game) {
			ws.close(undefined, 'The requested game doesn\'t exist.');
			return;
		}

		if (game.started) {
			ws.close(undefined, 'The requested game has already started.');
			return;
		}

		// Start the game so that nobody new can connect to it.
		game.start();

		// Send the initial board
		ws.send(JSON.stringify({board: game.board, nextTurn: game.turn.color}));

		ws.on('message', function(message) {
			message = JSON.parse(message);
			var color;

			if (message.move) {
				color = message.color;

				if (game.turn.color === color) {
					var result = game.makeMove(message.move.x, message.move.y, game.turn);

					if (result !== true) {
						ws.send(JSON.stringify({error: result}));
					} else {
						// If a move is made, we can reset passes to 0
						passes = 0;

						// And send the new board and change the turn
						ws.send(JSON.stringify({board: game.board, nextTurn: game.turn.color}));
					}
				} else {
					ws.send(JSON.stringify({error: 'Wrong color played', nextTurn: game.turn.color}));
				}
			}

			if (message.pass) {
				color = message.color;

				if (game.turn.color === color) {
					passes++;

					if (passes > 1) {
						game.finishGame();
						ws.send(JSON.stringify({gameOver: true, player1: game.playerBlack, player2: game.playerWhite}));
						ws.close(undefined, 'Game Over');
					}

					game.switchTurn();
					ws.send(JSON.stringify({nextTurn: game.turn.color}));
				} else {
					ws.send(JSON.stringify({nextTurn: game.turn.color})); // Wrong color passed, just tell client to switch to other color
				}
			}

			if (message.message) {
				ws.send(JSON.stringify({message: {by: game.turn.player, msg: message.message}}));
			}
		});

		ws.on('close', function() {
			// Right now we just delete the game
			delete activeGames[gameId];
		});
	}
};
