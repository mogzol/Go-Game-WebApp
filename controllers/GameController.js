"use strict";

var routes = require('../routes.js');
var WebSocket = require('ws');

var Player = require('../model/Player.js');
var Game = require('../model/Game.js');
var LobbyController = require('./LobbyController.js');
var AccountController = require('./AccountController.js');
var aiInterface = require('../aiInterface');

var activeGames = {};
var gameConnections = {};
var minBoardSize = 3;
var maxBoardSize = 27;

module.exports = class GameController
{
	/**
	 * Sets up a game and returns the game ID
	 *
	 * @param {string}        user1   The username for the user playing as black
	 * @param {string|object} user2   The username for the user playing as white, or an object if this is an AI. The AI
	 *                                object should look like: {ai: true, mode: 'MODE'}. Replace MODE with the ai mode.
	 * @param {int}           size    The board size
	 * @param {string|null}   lobbyId The id for the lobby to reconnect to, or null to not reconnect.
	 * @param {object}        db      The MongoJs database object
	 *
	 * @returns {string|boolean} The ID of the game, or false if there was an error creating the game
	 */
	static generateLobbyGame(user1, user2, size, lobbyId, db) {
		// Make sure size is valid
		if (!Number.isInteger(size) || size % 2 !== 1 || size < minBoardSize || size > maxBoardSize)
			return false;

		// Create players based on the usernames
		var player1 = new Player(user1, 1);

		var player2;
		if (user2.ai) {
			if (!['random', 'maxLibs', 'offensive', 'defensive'].includes(user2.mode))
				return false;

			player2 = new Player('AI (' + user2.mode + ')', 2, true, user2.mode);
		} else {
			player2 = new Player(user2, 2);
		}

		// Set up the game
		var game = new Game(player1, player2, size, lobbyId);

		// We need to get player skill levels from the database and assign them, so lets do that now
		AccountController.getPlayerSkills(user1, user2.ai ? null : user2, db, function(u1skill, u2skill) {
			game.playerBlack.skill = u1skill || game.playerBlack.skill;
			game.playerWhite.skill = u2skill || game.playerWhite.skill;
		});

		// Add the game to the array
		activeGames[game.id] = game;

		return game;
	}

	/**
	 * Delete a game from the game array
	 *
	 * @param id
	 */
	static deleteGame(id) {
		delete activeGames[id];
	}

	static aiGameAction(request, response) {
		var size = parseInt(request.body.size);
		var ai = request.body.ai;
		var username = request.session.username || 'Player';

		if (isNaN(size) || size % 2 !== 1 || size < minBoardSize || size > maxBoardSize) {
			request.flash('danger', 'Board size must be an odd integer between ' + minBoardSize + ' and ' + maxBoardSize);
			response.redirect(routes.quickGame);
			return;
		}

		if (!['random', 'maxLibs', 'offensive', 'defensive'].includes(ai)) {
			request.flash('danger', 'Selected AI mode is invalid');
			response.redirect(routes.quickGame);
			return;
		}

		// Set up the players
		var player1 = new Player(username, 1);
		var player2 = new Player('AI (' + ai + ')', 2, true, ai);

		// Set up the game
		var game = new Game(player1, player2, size);

		// Add the game to the array
		activeGames[game.id] = game;

		response.render('views/game.html.njk', {
			gameId: game.id,
			username: username,
			ai: true
		});
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
			username: request.session.username,
		})
	}

	static wsAction(ws, request, db) {
		var gameId = request.params.id;
		var game = activeGames[gameId];
		var user = request.session.username || 'Player'; // We fall back to Player to allow for AI play without signing in

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
			if (gameConnections[gameId]) {
				for (var ws of gameConnections[gameId]) {
					if (ws && ws.readyState === WebSocket.OPEN)
						ws.send(JSON.stringify(data));
				}
			}
		}

		function doAiMove(pass) {
			if (game.turn.isAI) {
				var aiFunc = null;
				switch (game.turn.aiMode) {
					case 'maxLibs':
						aiFunc = aiInterface.findMaxLibs;
						break;
					case 'offensive':
						aiFunc = aiInterface.attackEnemy;
						break;
					case 'defensive':
						aiFunc = aiInterface.formEyes;
						break;
					default:
						aiFunc = aiInterface.getRandomMove;
						break;
				}

				// Simon's interpretation of x and y is backwards from us
				var lastMove = {
					x: game.lastMove ? game.lastMove.next.row : undefined,
					y: game.lastMove ? game.lastMove.next.col : undefined,
					c: 1,
					pass: pass
				};

				aiFunc(game.size, game.board, lastMove, function(data) {
					if (!data.pass) {
						game.passes = 0;
						var result = game.makeMove(data.y, data.x, game.turn); // Simon's interpretation of x and y is backwards from us
						if (result !== true) {
							console.log('Ai made invalid move: ' + JSON.stringify(data));
							endGame('black');
							return;
						}

						pushUpdate({board: game.board, nextTurn: game.turn.color});
					} else {
						game.passes++;
						if (game.passes > 1) {
							endGame();
							return;
						}

						game.switchTurn();
						pushUpdate({pass: game.playerWhite.player, nextTurn: game.turn.color});
					}
				}, function(err) {
					// On AI error we will give the win to the player
					endGame('black');
				});
			}
		}

		// Ends the game, optionally forcing a winner
		function endGame(winner) {
			// Update player skills before finishing game, as player stats may have changed
			AccountController.getPlayerSkills(game.playerBlack.player, game.playerWhite.player, db, function(u1skill, u2skill) {
				game.playerBlack.skill = u1skill || game.playerBlack.skill;
				game.playerWhite.skill = u2skill || game.playerWhite.skill;

				game.finishGame(winner);
				var black = game.playerBlack;
				var white = game.playerWhite;

				// If the game has a lobby, tell the winner to re-connect
				if (black.score > white.score && gameConnections[gameId]) {
					let ws = gameConnections[gameId][0];
					if (ws && ws.readyState === WebSocket.OPEN)
						ws.send(JSON.stringify({lobby: game.lobby}));
				} else if (gameConnections[gameId]) {
					let ws = gameConnections[gameId][1];
					if (ws && ws.readyState === WebSocket.OPEN)
						gameConnections[gameId][1].send(JSON.stringify({lobby: game.lobby}));
				}

				// Send the game over message
				pushUpdate({nextTurn: null, done: {black: black, white: white}});

				// Wait a second and then close the connections. We were having an issue where sometimes the connection would
				// be closed before the pushUpdate finished
				setTimeout(function() {
					for (var ws of gameConnections[gameId]) {
						if (ws)
							ws.close(undefined, 'Game Over');
					}
				}, 2000);

				// Update accounts with game results
				if (!game.playerBlack.isAI && !game.playerWhite.isAI) {
					AccountController.updateAccountFromPlayer(game.playerBlack, db);
					AccountController.updateAccountFromPlayer(game.playerWhite, db);
				}
			});
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
						game.passes = 0;

						// And send the new board and change the turn
						pushUpdate({board: game.board, nextTurn: game.turn.color});
					}

					if (game.turn.isAI)
						doAiMove(false);
				} else {
					ws.send(JSON.stringify({error: 'It is not your turn', nextTurn: game.turn.color}));
				}
			}

			if (message.pass) {
				if (game.turn.player === user) {
					game.passes++;

					if (game.passes > 1) {
						endGame();
						return;
					}

					game.switchTurn();
					pushUpdate({pass: user, nextTurn: game.turn.color});

					if (game.turn.isAI)
						doAiMove(true);
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
			if (gameConnections[gameId])
				delete gameConnections[gameId][player - 1];

			if (gameConnections[gameId] && !gameConnections[gameId][0] && !gameConnections[gameId][1]) {
				// If neither of the users are connected, delete this game entirely
				delete gameConnections[gameId];
				delete activeGames[gameId];
			} else if (game.turn !== null) { // If game is not finished, finish it, giving the win to the user that is still connected
				if (gameConnections[gameId][0])
					endGame('black');
				else
					endGame('white');
			}
		});
	}

	static hotseatGameAction(request, response) {
		var size = parseInt(request.body.size);

		if (isNaN(size) || size % 2 !== 1 || size < minBoardSize || size > maxBoardSize) {
			request.flash('danger', 'Board size must be an odd integer between ' + minBoardSize + ' and ' + maxBoardSize);
			response.redirect(routes.quickGame);
			return;
		}

		// Set up the players
		var player1 = new Player('Player 1', 1);
		var player2 = new Player('Player 2', 2);

		// Set up the game
		var game = new Game(player1, player2, size);

		// Add the game to the array
		activeGames[game.id] = game;

		response.render('views/game.html.njk', {
			gameId: game.id,
			hotseat: true,
		});
	}

	static hotseatWsAction(ws, request) {
		var gameId = request.params.id;
		var game = activeGames[gameId];

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
		ws.send(JSON.stringify({
			message: {by: null, msg: 'The game has started!'},
			board: game.board,
			black: game.playerBlack,
			white: game.playerWhite,
			nextTurn: game.turn.color
		}));

		ws.on('message', function(message) {
			message = JSON.parse(message);

			if (message.move) {
				var result = game.makeMove(message.move.x, message.move.y, game.turn);

				if (result !== true) {
					ws.send(JSON.stringify({error: result}));
				} else {
					// If a move is made, we can reset passes to 0
					game.passes = 0;

					// And send the new board and change the turn
					ws.send(JSON.stringify({board: game.board, nextTurn: game.turn.color}));
				}
			}

			if (message.pass) {
				game.passes++;

				if (game.passes > 1) {
					game.finishGame();
					ws.send(JSON.stringify({nextTurn: null, done: {black: game.playerBlack, white: game.playerWhite}}));
					ws.close(undefined, 'Game Over');
					return;
				}

				game.switchTurn();
				ws.send(JSON.stringify({pass: game.turn.player, nextTurn: game.turn.color}));
			}

			if (message.message) {
				ws.send(JSON.stringify({message: {by: game.turn.player, msg: message.message}}));
			}
		});

		ws.on('close', function() {
			// Since it's a hotseat game we'll just delete the game
			delete activeGames[gameId];
		});
	}
};
