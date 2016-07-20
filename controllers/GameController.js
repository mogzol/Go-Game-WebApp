"use strict";

var routes = require('../routes.js');
var WebSocket = require('ws');

var Player = require('../model/Player.js');
var Game = require('../model/Game.js');

var activeGames = {};

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

	static hotseatAction(request, response) {
		var size = 9;//parseInt(request.body.size);

		if (isNaN(size) || size % 2 !== 1 || size < 3 || size > 27) {
			request.flash('Board size must be an odd integer between 3 and 27');
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
		});

		ws.on('close', function() {
			// Right now we just delete the game
			delete activeGames[gameId];
		});
	}

};
