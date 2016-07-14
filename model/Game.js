"use strict";


module.exports= class Game{

	constructor(playerOne, playerTwo, size)
	{
		this._playerBlack = playerOne;
		this._playerWhite = playerTwo;
		this._turn = this._playerBlack;
		this._board = this.createBoard(size);
		this._boardSize= size*size;
		this._size= size;
		this._boardHistory = [];
		this._Graph= this.createGraph();
		this._blackTaken = 0;
		this._whiteTaken = 0;
	}
	/**
	 * Creates new board of size N
	 * @param n board size
	 * @returns {Array} Board [n][n]
	 */
	createBoard(n)
	{
		var board = new Array(n);               //Create N Rows
		for(var i=0; i<n ; i++)
		{
			board[i] = new Array(n);            //Create N Cols
			for(var j=0; j<n ; j++)
				board[i][j] = 0;                //Initialize all 0
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

		var G= new Array(this._boardSize);
		for(var v=0; v < this._boardSize; v++)
		{
			G[v]= new Array(6);
			for(var dir=0; dir<6; dir++)
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
						if(v < this._size)                               //at the first row of vertex's
							G[v][dir] = -1;
						else
							G[v][dir] = v-this._size;
						break;
					case 3:
						if(v >= this._boardSize-this._size)              //at the last row of vertex's
							G[v][dir] = -1;
						else
							G[v][dir] = v+this._size;
						break;
					case 4:
						G[v][dir] = 0;                                 //empty vertex
						break;
					case 5:
						G[v][dir] = -1;                                 //No one controls vertex
				}
			}
		}
		return G;
	}
	/**
	 * isValid( r, c, color) checks for valid move
	 *
	 * NOTE TO SELF: 	implement que for last test case then call isOwner while ques is not empty, to reduce code,
	 * 					also break up updateGraph with a separate DFS method...
	 */
	isValid(r,c, color) {

		var vertex = (r*this._size)+c;

		if(this._Graph[vertex][4] === 0 && this._Graph[vertex][5] === -1) {       //Not owned or controlled
			return true;
		}else if(this._Graph[vertex][4] !== 0) {                                  //Already owned
			console.log("Already owned, make new move");
			return false;
		}else if(this._Graph[vertex][5] === (color)){                            //Already controlled by player
			console.log("Secure your already controlled liberty");
			return true;
		}else{                                                                  //Controlled by opponent
			var parentV;
			var flag=false;
			this._Graph[vertex][4]= color;

			for(var dir=0; dir<4; dir++){                                       //Checks neighbouring vertex
				parentV= this._Graph[vertex][dir];
				if(parentV != -1 && this.isOwner(parentV,color)) {

					if (this._Graph[parentV][4] === 1)
						this._blackTaken += 1;                                    //Black token taken
					else
						this._whiteTaken += 1;                                    //White token taken

					switch(dir){
						case 0:
							this._board[r][c-1] = 0;
							break;
						case 1:
							this._board[r][c+1] = 0;
							break;
						case 2:
							this._board[r-1][c] = 0;
							break;
						case 3:
							this._board[r+1][c] = 0;
							break;
					}
					this._Graph[parentV][4] = 0;                                 //Reset parent owner
					this._Graph[parentV][5] = color;                             //Change who controls
					flag = true;
				}
			}
			if(flag)
				this._Graph[vertex][5]= 0;
			this._Graph[vertex][4]= 0;
			return flag;
		}
	}

	/**
	 * Checks if color controls vertex by checking its children
	 * neg and pos are used to in order to insure that all children are owned by color
	 * @param v ->      parent vertex
	 * @param color->   player
	 * @returns {boolean} True if opponent does not already own one of the children or is neutral
	 */
	isOwner(v,color)
	{
		var child;
		var neg = 0;
		var pos = 0;
		for(var dir=0; dir< 4; dir++)
		{
			console.log(this._Graph[v][dir]);
			if(this._Graph[v][dir] != -1)
			{
				child = this._Graph[v][dir];
				if(this._Graph[child][4] === color)
					pos += 1;
			}else
				neg +=1;

		}
		return neg + pos === 4;
	}


	/**
	 * Make move
	 * @param c coordinate for colm
	 * @param r coordinate for row
	 * @param player is the player making the move
	 * @return {*| Boolean} returns if it made the move
	 */
	makeMove(r,c)
	{
		var color = this.turn.color;
		var vertex= (r*this._size)+c;
		if( this.isValid(r,c,color) ) {
			var move = {
				player: color,
				oldBoard: this._board,
				next: {
					V: vertex,
					row: r,
					col: c
				}
			}
			this._board[r][c] = color;
			this._Graph[vertex][4] = color;
			this.updateGraph(vertex, color);
			this._turn.playerHistory = move;
			this._boardHistory.push(move);
			this.switchTurn();
			return true;            //change to a kind of alert
		}else
			return false;           //change to a kind of alert
	}

	/**
	 * Update graph according to move made on vertex by color
	 * @param v -> where the move is taking place
	 * @param color -> who is making the move
	 */
	updateGraph(v,color)
	{
		var parent;
		var stack=[];

		for(var dir =0; dir<4; dir++){
			if(this._Graph[v][dir] != -1){
				stack.push(this._Graph[v][dir]);
			}
		}

		while(stack.length > 0){
			parent= stack.pop();
			console.log('parent is:'+parent);
			if(this._Graph[parent][4] != color  && this.isOwner(parent,color))
			{
				this._Graph[parent][4] = 0;
				this._Graph[parent][5] = color;
				this._board[Math.floor(parent / this._size)][parent % this._size]= 0;
			}
		}
	}
	/**
	 *Calculates the score and assigns them to player
	 * This method goes down along the last 2 col in graph, each vertex owned or controlled is 1 point
	 */
	calScore()
	{
		var blackScore = 0;
		var whiteScore = 0;

		for(var v=0; v< this._boardSize; v++)
		{
			if(this._Graph[v][4] === 1)
				blackScore +=1;
			else if(this._Graph[v][4] === 2)
				whiteScore +=1;
			else{
				if (this._Graph[v][5] === 1)
					blackScore += 1;
				else if (this._Graph[v][5] === 2)
					whiteScore += 1;
			}
		}
		this._playerBlack.score = blackScore - this._blackTaken;
		this._playerWhite.score = whiteScore - this._whiteTaken;

		this._playerBlack.captured= this._whiteTaken;
		this._playerWhite.captured= this._blackTaken;

		if(this._playerBlack.score > this._playerWhite.score) {
			this._playerBlack.result = 1;
			this._playerWhite.result = 0;
		}else{
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

		var totalGameTime= this._playerWhite.playTime+this._playerBlack.playTime;

		if(this._playerBlack.isAI == false)
		{
			var skillBlack= (this._playerBlack.score + this._playerBlack.captured) * (this._playerBlack.playTime / totalGameTime);
			this._playerBlack.skill(skillBlack);
		}
		if(this._playerWhite.isAI == false)
		{
			var skillWhite= (this._playerWhite.score + this._playerWhite.captured) * (this._playerWhite.playTime/ totalGameTime);
			this._playerWhite.skill(skillWhite);
		}
	}
	switchTurn()
	{
		if( this._turn === this._playerBlack) {
			this._playerBlack.end();
			this._turn = this._playerWhite;
			this._playerWhite.start();
		}else {
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
	printGraph()
	{
		var str='';
		var ins='';
		for(var v=0; v< this._boardSize; v++)
		{
			str+=   v+' ->\t[';
			for(var u=0; u< 6; u++)
			{
				if(u == 4) {
					if(str.length < 15+(v*24))
						str += '  : ' + this._Graph[v][u];
					else
						str += ' : ' + this._Graph[v][u];
				}
				else
					str+= this._Graph[v][u];
				if(u<5 && u != 3)
					str +=',';
			}
			str+=']\n';
		}
		return str;
	}

}