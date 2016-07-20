"use strict";

var Player = require('./Player.js');

module.exports= class Game{

	constructor(playerOne, playerTwo, size)
	{
		var load = !playerOne instanceof Player; // If playerOne is not a Player, then we are loading from an object

		this._playerBlack = load ? new Player(playerOne._playerBlack) : playerOne;
		this._playerWhite = load ? new Player(playerOne._playerWhite) : playerTwo;
		this._turn = load ? playerOne._turn : null;
		this._board = load ? playerOne._board : this.createBoard(size);
		this._boardSize = load ? playerOne._boardSize : size*size;
		this._size = load ? playerOne._size : size;
		this._boardHistory = load ? playerOne._boardHistory : [];
		this._Graph = load ? playerOne._Graph : this.createGraph();
	}

	/**
	 * Starts the game
	 */
	start() {
		this._turn = this._playerBlack;
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

	/**                    vertex -> [Left, Right, Up, Down, Owner, Controlled by]
	 *                          (dir)  0      1    2     3     4       5
	 *
	 * B=   [0,1,0]      Graph= 0 ->    [-1,   1,   -1,   3,   0,   1(BLACK)],
	 *      [1,2,0]             1 ->    [0,    2,   -1,   4,   1,  -1],
	 *      [2,0,2]             2 ->    [1,   -1,   -1,   5,   0,  -1],
	 *                          3 ->    [-1,   4,    0,   6,   1,  -1],
	 * v=   [0,1,2]             4 ->    [3,    5,    1,   7,   2,  -1],
	 *      [3,4,5]             5 ->    [4,   -1,    2,   8,   0,  -1],
	 *      [6,7,8]             6 ->    [-1,   7,    3,  -1,   2,  -1],
	 *                          7 ->    [6,    8,    4,  -1,   0,  2(WHITE)],
	 *                          8 ->    [7,   -1,    5,  -1,   2,  -1]
	 *
	 *  Vertex      = (Row * board.size) + col
	 *  Vertex_left = Vertex - 1
	 *  Vertex_right= Vertex + 1
	 *  Vertex_Up   = Vertex - board.size
	 *  Vertex_Down = Vertex + board.size
	 */
	createGraph()
	{

		var G = new Array(this._boardSize);
		for(var v = 0; v < this._boardSize; v++)
		{
			G[v] = new Array(6);
			for(var dir = 0; dir < 6; dir++)
			{
				switch(dir){
					case 0:
						if((this._boardSize - v) % this._size === 0)    //at left most vertex on board
							G[v][dir] = -1;
						else
							G[v][dir] = v-1;
						break;
					case 1:
						if((v+1) % this._size === 0)                    //at right most vertex on board
							G[v][dir] = -1;
						else
							G[v][dir] = v+1;
						break;
					case 2:
						if(v < this._size)                              //at the first row of vertex's
							G[v][dir] = -1;
						else
							G[v][dir] = v - this._size;
						break;
					case 3:
						if(v >= this._boardSize - this._size)           //at the last row of vertex's
							G[v][dir] = -1;
						else
							G[v][dir] = v + this._size;
						break;
					case 4:
						G[v][dir] = 0;                                  //empty vertex
						break;
					case 5:
						G[v][dir] = -1;                                 //No one controls vertex
				}
			}
		}
		return G;
	}

	/**
	 * isValid( r, c, color) checks if move is allowed. Returns True or an error message string
	 */
	isValid(r, c, color) {
		if (!Number.isInteger(r) || !Number.isInteger(c) || !Number.isInteger(color))
			return 'Invalid input';

		var vertex = (r * this._size) + c;
		var lastMove = this.lastMove;

		if(this._Graph[vertex][4] === 0 && this._Graph[vertex][5] === -1)
		{
			console.log("[isValid] Fist if case");
			this._Graph[vertex][5] = 0;
			return true;
		}
		else if(this._Graph[vertex][4] !== 0)
		{
			console.log("[isValid] Already owned, make new move");
			return 'Already owned, make new move';
		}
		else if(this._Graph[vertex][5] === color)
		{
			console.log("[isValid] Secure your already controlled liberty");
			return true;
		}
		else if(this._Graph[vertex][5] === (3^color)  && this.canAttack(vertex,lastMove,color))
		{
			console.log("[isValid] Attacking controlled liberty");
			return true;

		}
		else             //Can get rid of this case, leaving just in case required for territory counting
		{
			console.log("[isValid] ______LAST IF CASE______");
			return 'BLEEP BLOOP';
		}
	}

	/**
	 * Checks all adjacent nodes from vertex
	 * @param vertex -> parent vertex
	 * @param lastMove -> last move made on board
	 * @param color -> opponent
	 * @returns {boolean} -> if player is able to make an attack on the opponent
	 */
	canAttack(vertex,lastMove,color)
	{
		this._Graph[vertex][4] = color;
		for(var dir = 0; dir < 4; dir++)
		{
			if(this._Graph[vertex][dir] != -1 && lastMove.next.V === this._Graph[vertex][dir])
			{
				this._Graph[vertex][4] = 0;
				console.log('Can not make a recursive move');
				return false;
			}
			else if(this._Graph[vertex][dir] != -1 && this.isOwner(this._Graph[vertex][dir],color) === 4 )
			{
				this._turn.captured += 1;
				this._Graph[vertex][4] = 0;
				return true;
			}
		}
		this._Graph[vertex][4] = 0;
		return false;
	}
	/**
	 * Checks if color controls vertex by checking all adjacent nodes
	 * neg and pos are used to in order to insure that all adjacent nodes are owned by color
	 *      -> neg represents out of bounds (boarders)
	 *      -> pos represent adjacent vertexes
	 *      -> If both add up to 4, that means all adjacent vertexes are owned
	 *
	 * @param vertex ->  parent vertex
	 * @param color ->   player
	 * @returns {int} True if player has surrounded the vertex
	 */
	isOwner(vertex,color)
	{
		var adjacent;
		var neg = 0;
		var pos = 0;
		for(var dir = 0; dir < 4; dir++)
		{
			//console.log("[isOwner] Checking adjacent nodes of :"+this._Graph[vertex][dir]);
			if(this._Graph[vertex][dir] != -1) {
				adjacent = this._Graph[vertex][dir];
				if(this._Graph[adjacent][4] === color)
					pos += 1;
			}
			else
				neg +=1;
		}
		//console.log("[isOwner] neg and pos are: ["+neg+","+pos+"] and add up to: "+(neg+pos));
		return (neg + pos); //=== 4;
	}
	/**
	 * Make move
	 * @param c coordinate for colm
	 * @param r coordinate for row
	 * @param player is the player making the move
	 * @return {Boolean|String} returns true if move was made or an error string if it was not
	 */
	makeMove(c, r, player)
	{
		if (player.color !== this.turn.color) {
			return 'It is not that player\'s turn';
		}

		var color = this.turn.color;
		var vertex = (r * this._size) + c;
		var valid = this.isValid(r,c,color);
		if( valid === true )
		{
			var move = {
				player: color,
				oldBoard: this._board,
				next: {
					V: vertex,
					row: r,
					col: c
				}
			};
			this._board[r][c] = color;
			this._Graph[vertex][4] = color;
			//console.log("[makeMove] Before updateGraph");
			this.updateGraph(vertex, color);
			this._turn.playerHistory = move;
			this._boardHistory.push(move);
			this.switchTurn();
			return true;                                    //change to a kind of alert
		} else {
			return valid;
		}
	}
	/**
	 * Update graph according to move made on vertex by color
	 * @param vertex -> where the move is taking place
	 * @param color -> who is making the move
	 */
	updateGraph(vertex,color)
	{
		var adjacent;
		var stack = [];

		for (var dir = 0; dir < 4; dir++)
		{
			if (this._Graph[vertex][dir] != -1) {
				///console.log("[updateGraph] pushing adjacent node onto stack: " + this._Graph[vertex][dir]);
				stack.push(this._Graph[vertex][dir]);
			}
		}

		while (stack.length > 0)
		{
			adjacent = stack.pop();
			var own = this.isOwner(adjacent, color);

			if (this._Graph[adjacent][4] != color && own === 4) {
				//console.log("[updateGraph] fully owned adjacent node off stack is: " + adjacent);
				this._Graph[adjacent][4] = 0;
				this._Graph[adjacent][5] = color;
				this._board[Math.floor(adjacent / this._size)][adjacent % this._size] = 0;
			}
		}
	}

	/**
	 * Implement method for territory tracking...
	 * @param v
	 * @param dir
	 * @param color
	 * @returns {boolean} Can keep going, Return false if dead end. (base case)
	 */
	territory(v,dir,color)
	{
		//Base case
		if(this._board[Math.floor(v / this._size)][v % this._size] !== 0 )
		{
			return false;
		}
		if(this._Graph[v][dir] === -1)
		{
			dir += 1;
		}
		//Move left

		//Move right

		//Move Up

		//Move Down
	}
	/**
	 *Calculates the score and assigns them to players
	 * This method goes down along the last 2 col in graph, each vertex owned or controlled is 1 point
	 */
	calScore()
	{

		for(var v = 0; v < this._boardSize; v++)
		{
			if(this._Graph[v][4] === 1)
				this._playerBlack.score += 1;
			else if(this._Graph[v][4] === 2)
				this._playerWhite.score += 1;
			else {
				if (this._Graph[v][5] === 1)
					this._playerBlack.score += 1;
				else if (this._Graph[v][5] === 2)
					this._playerWhite.score += 1;
			}
		}
		this._playerBlack.score -= this._playerBlack.captured;
		this._playerWhite.score -= this._playerWhite.captured;

		if(this._playerBlack.score > this._playerWhite.score) {
			this._playerBlack.result = 1;
			this._playerWhite.result = 0;
		} else {
			this._playerWhite.result = 1;
			this._playerBlack.result = 0;
		}
	}

	/**
	 * Calculates final Score
	 * Assigns skill level to each player
	 * Skill ratio = (score + captured) * (player time / total time)
	 */
	finishGame()
	{
		this.calScore();
		var totalGameTime = this._playerWhite.playTime + this._playerBlack.playTime;

		if(!this._playerBlack.isAI)
			this._playerBlack.skill = (this._playerBlack.score + this._playerBlack.captured) + (this._playerBlack.playTime / totalGameTime);
		if(!this._playerWhite.isAI)
			this._playerWhite.skill = (this._playerWhite.score + this._playerWhite.captured) + (this._playerWhite.playTime / totalGameTime);
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
		return this._boardHistory.pop();
	}

	get whiteTaken()
	{
		return this._whiteTaken;
	}

	get blackTaken()
	{
		return this._blackTaken;
	}

	get graph()
	{
		return this._Graph;
	}

	get boardSize()
	{
		return this._boardSize;
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


	/**
	 * Prints out the games graph
	 * @returns {string}
	 */
	printGraph()
	{
		var str='';
		for(var v = 0; v< this._boardSize; v++)
		{
			str+=   v+' ->\t[';
			for(var u = 0; u < 6; u++)
			{
				if(u == 4) {
					if(str.length < 15+(v*24))
						str += '  : ' + this._Graph[v][u];
					else
						str += ' : ' + this._Graph[v][u];
				}
				else
					str += this._Graph[v][u];
				if(u < 5 && u != 3)
					str += ',';
			}
			str += ']\n';
		}
		return str;
	}
};
