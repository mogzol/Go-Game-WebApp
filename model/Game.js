"use strict";

/*
 * This is an alternate game class made I (Morgan) made since I was bored and wanted to try making one. To use this
 * just rename the current game class to something like Game_old.js and rename this one to Game.js
 */

var Player = require('./Player.js');

module.exports = class Game{

	/**
	 * ID is current seconds followed by current nanoseconds followed by a dash and a random number from 0-99999
	 * Really, the random number is unnecessary since there is no way we will be generating multiple games in the
	 * same nanosecond, but hey, maybe the computers of tomorrow will be, so why not add the random number just to
	 * be safe.
	 *
	 * @returns {string}
	 */
	static generateId()
	{
		var nanotime = process.hrtime();
		return String(nanotime[0]) + nanotime[1] + '-' + Math.floor(Math.random() * 100000);
	}

	constructor(playerOne, playerTwo, size, lobby)
	{
		var load = playerOne instanceof Player === 'object';

		this._id = load ? playerOne._id : Game.generateId();
		this._playerBlack = load ? new Player(playerOne._playerBlack) : playerOne;
		this._playerWhite = load ? new Player(playerOne._playerWhite) : playerTwo;
		this._turn = load ? playerOne._turn : null;
		this._board = load ? playerOne._board : this.createBoard(size);
		this._size = load ? playerOne._size : size;
		this._boardHistory = load ? playerOne._boardHistory : [];
		this._lobby = load ? playerOne._lobby : lobby;
		this._passes = load ? playerOne._passes : 0;
		this._startTime = load ? playerOne._startTime : Date.now();
		this._winner =  load ? playerOne._winner : null;
		this._endTime = load ? playerOne._endTime : null;
		this._que = [];
		this._start = true;
		this._captured = false;
	}

	/**
	 * Starts the game
	 */
	start() {
		this._turn = this._playerBlack;

		// Add white's handicap
		this._playerWhite.score = 6.5;
	}

	/**
	 * @returns {boolean} Whether or not the game is started
	 */
	get started() {
		return this._turn !== null;
	}

	/**
	 * Creates new board of size N
	 * @param n board size
	 * @returns {Array} Board [n][n]
	 */
	createBoard(n)
	{
		var board = new Array(n);               //Create N Rows
		for(var r = 0; r < n ; r++)
		{
			board[r] = new Array(n);            //Create N Cols
			for(var c = 0;  c < n ; c++)
				board[r][c] = 0;                //Initialize all 0
		}
		return board;
	}

	getLiberties(x, y, visited)
	{
		var liberties = 0;
		var color = this.board[y][x];

		// Check up, right, down, left
		for (var dir of [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]]) {
			let x = dir[0], y = dir[1], visitedIndex = y * this.size + x;
			if (y < 0 || y >= this.size || x < 0 || x >= this.size || visited[visitedIndex])
				continue;

			visited[visitedIndex] = true;
			var boardVal = this.board[y][x];
			if (boardVal === 0)
				liberties++;
			else if (boardVal === color)
				liberties += this.getLiberties(x, y, visited);
		}

		return liberties;
	}

	removeArmy(x, y, dontReturn) {
		var color = this.board[y][x];

		// Delete this token
		this.board[y][x] = 0;

		// Add 1 to current turn's captured
		this.turn.captured++;

		// If this is the only piece we remove, return coords as string
		var returnVal = dontReturn ? true : (x + ":" + y);

		// Check up, right, down, left
		for (var dir of [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]]) {
			let x = dir[0], y = dir[1];
			if (y < 0 || y >= this.size || x < 0 || x >= this.size)
				continue;

			if (this.board[y][x] === color) {
				// If we remove more than 1, just return true
				returnVal = true;
				this.removeArmy(x, y, true);
			}
		}

		return returnVal
	}

	/**
	 * Make move
	 * @param x coordinate for colm
	 * @param y coordinate for row
	 * @param player is the player making the move
	 * @return {Boolean|String} returns true if move was made or an error string if it was not
	 */
	makeMove(x, y, player)
	{
		if (player.color !== this.turn.color) {
			return 'It is not that player\'s turn';
		}

		var color = this.turn.color;

		if (this.board[y][x] !== 0)
			return "Space already taken";

		// If only a single token was removed last turn, and we try to replace it, then we are putting the board in a
		// previous state, which is not allowed
		if (this.lastMove && this.lastMove.removedToken === x + ':' + y)
			return "Move puts board into previous state";

		var thisMove = {
			removedToken: false,
			next: { // Structured like this to keep compatibility with old Game class
				row: y,
				col: x,
			}
		};

		// Add the move to the board
		this.board[y][x] = color;

		// Check up, right, down, left
		for (var dir of [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]]) {
			let x = dir[0], y = dir[1];
			if (y < 0 || y >= this.size || x < 0 || x >= this.size)
				continue;

			var boardVal = this.board[y][x];
			if (boardVal !== 0 && boardVal !== color && this.getLiberties(x, y, new Array(this.size * this.size)) === 0) {
				var removed = this.removeArmy(x, y); // True if multiple, or coord string like 'x:y' if single remove
				if (thisMove.removedToken === false)
					thisMove.removedToken = removed;
				else
					thisMove.removedToken = true; // We are removing multiple, so set to true
			}
		}

		if (this.getLiberties(x, y, new Array(this.size * this.size)) === 0) {
			this.board[y][x] = 0;
			return "Suicide is not the answer";
		}

		this.boardHistory.push(thisMove);
		this.switchTurn();
		return true;
	}

	getOwnedBy(x, y, visited)
	{
		var ownedBy = 0;

		// Check up, right, down, left
		for (var dir of [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]]) {
			let x = dir[0], y = dir[1], visitedIndex = y * this.size + x;
			if (y < 0 || y >= this.size || x < 0 || x >= this.size || visited[visitedIndex])
				continue;

			visited[visitedIndex] = true;
			var boardVal = this.board[y][x];
			var thisOwnedBy;

			if (boardVal === 0) {
				thisOwnedBy = this.getOwnedBy(x, y, visited);
				if (thisOwnedBy === null) {
					return null;
				}
			} else {
				thisOwnedBy = boardVal;
			}

			if (thisOwnedBy !== 0) {
				if (ownedBy === 0) {
					ownedBy = thisOwnedBy;
				} else if (ownedBy !== thisOwnedBy) {
					return null;
				}
			}
		}

		return ownedBy ;
	}

	fill(x, y, color)
	{
		this.board[y][x] = color;
		for (var dir of [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]]) {
			let x = dir[0], y = dir[1];
			if (y < 0 || y >= this.size || x < 0 || x >= this.size)
				continue;

			if (this.board[y][x] === 0) {
				this.fill(x, y, color);
			}
		}
	}

	/**
	 *Calculates the score and assigns them to players
	 * This method goes down along the last 2 col in graph, each vertex owned or controlled is 1 point
	 */
	calScore()
	{
		for (var y = 0; y < this.size; y++) {
			for (var x = 0; x < this.size; x++) {
				if (this.board[y][x] === 0) {
					var ownedBy = this.getOwnedBy(x, y, new Array(this.size * this.size));

					// If contested, fills with null so we don't check it again
					this.fill(x, y, ownedBy);
				}

				var boardVal = this.board[y][x];
				if (boardVal === 1) {
					this.playerBlack.score++;
				} else if (boardVal === 2) {
					this.playerWhite.score++;
				}
			}
		}

		this.playerBlack.score += this.playerBlack.captured;
		this.playerWhite.score += this.playerWhite.captured;
	}

	/**
	 * Calculates final Score
	 * Assigns skill level to each player
	 * Skill ratio = (score + captured) * (player time / total time)
	 *
	 * @param {string} [winner] (optional) Either 'white' or 'black'. If provided, this will force the winner to be the
	 *                          given colour, giving the other colour a score of 0.
	 */
	finishGame(winner) {
		this.calScore();

		if (winner === 'black')
			this._playerWhite.score = 0;
		else if (winner === 'white')
			this._playerBlack.score = 0;

		this._turn = null;

		if (this._playerBlack.score > this._playerWhite.score) {
			this._winner = this._playerBlack;
			this._playerBlack.result = 1;
			this._playerWhite.result = 0;
		} else {
			this._winner = this._playerWhite;
			this._playerBlack.result = 0;
			this._playerWhite.result = 1;
		}

		if (!this._playerBlack.isAI && !this._playerWhite.isAI) {
			this.calculateRating();
		}
	}

	/**
	 * Calculates a rating based off an elo scoring system found here:
	 * https://en.wikipedia.org/wiki/Go_ranks_and_ratings
	 * Rating can't go below 100
	 */
	calculateRating() {
		var bs = this._playerBlack.skill;
		var ws = this._playerWhite.skill;
		var K = 116;

		var Se = 1 / (Math.pow(Math.E, (Math.abs(bs - ws) / (ws ? bs : bs > ws))) + 1);
		console.log(Se);

		// If black's skill is greater than or equal to white's and white won the game
		if (bs > this._winner.skill || (ws.skill == bs.skill && this.playerWhite == this._winner)) {
			this.playerWhite.skill = Math.round(this.playerWhite.skill + K * (1 - Se));
			this.playerBlack.skill = Math.round(this.playerBlack.skill + K * (0 - (1 - Se)));
			console.log("playerBlack > playerWhite and white won");
		}

		// If black's skill is less than white's skill but white won the game
		else if (bs < this._winner.skill) {
			this.playerWhite.skill = Math.round(this.playerWhite.skill + K * (1 -(1 - Se)));
			this.playerBlack.skill = Math.round(this.playerBlack.skill + K * (0 - Se));
			console.log("playerBlack < playerWhite and white won");
		}

		// If white's skill is greater than or equal to black's skill but black won the game
		else if (ws > this._winner.skill || (ws == bs && this.playerBlack == this._winner)) {
			this.playerBlack.skill = Math.round(this.playerBlack.skill + K * (1 - Se));
			this.playerWhite.skill = Math.round(this.playerWhite.skill + K * (0 - (1 - Se)));
			console.log("playerBlack < playerWhite and black won");
		}

		// If white's skill is less than black's skill but black won the game
		else {
			this.playerBlack.skill = Math.round(this.playerBlack.skill + K * (1 - (1 - Se)));
			this.playerWhite.skill = Math.round(this.playerWhite.skill + K * (0 - Se));
			console.log("playerBlack > playerWhite and black won");
		}

		if (this.playerWhite.skill < 100) {
			this.playerWhite.skill = 100;
		}
		else if (this.playerBlack.skill < 100) {
			this.playerBlack.skill = 100;
		}
	}

	/**
	 * Changes player turn and starts/ends timer tracker
	 */
	switchTurn()
	{
		if( this._turn === this._playerBlack) {
			this._playerBlack.end();
			this._turn = this._playerWhite;
			this._playerWhite.start();
		} else {
			this._playerWhite.end();
			this._turn = this._playerBlack;
			this._playerBlack.start();
		}
	}

	get id()
	{
		return this._id;
	}

	get turn()
	{
		return this._turn;
	}

	get board()
	{
		return this._board;
	}

	get boardHistory()
	{
		return this._boardHistory;
	}

	get lastMove()
	{
		return this._boardHistory[this._boardHistory.length - 1];
	}

	get size()
	{
		return this._size;
	}

	get playerBlack()
	{
		return this._playerBlack;
	}

	get playerWhite()
	{
		return this._playerWhite;
	}

	get passes()
	{
		return this._passes;
	}

	set passes(passes)
	{
		this._passes = passes;
	}

	get lobby() {
		return this._lobby;
	}

	get winner() {
		return this._winner;
	}

	get endTime() {
		return this._endTime;
	}
};
