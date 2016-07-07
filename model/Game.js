"use strict"


class Game{

    constructor(playerOne, playerTwo, size)
    {
        this._playerBlack = playerOne;
        this._playerWhite = playerTwo;
        this._turn = this._playerBlack;
        this._board = this.createBoard(size);
        this._remainingMoves= size*size;
        this._boardHistory = [];
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
    /**
     * isValid( x, y) checks for valid move
     * Should change and/or rethink this method into a recursive call
     * Super slow currently, too many checks
     * Think we can implement a graph with a BFS search to calculate free spaces
     */
    isValid(x,y) {
        var free = false;
        var c = this._turn.color;
        this._board[x][y] = c;

             //    is empty or owned             OR      surrounded
        if ((this._board[x][y + 1] ===  0 || c) || this.isValidHelper(c, x, y + 1))
            free= true;
        else if((this._board[x+1] && this._board[x+1][y] === 0 || c) || this.isValidHelper(c, x+1, y) )
            free = true;
        else if((this._board[x][y-1] === 0 || c) || this.isValidHelper(c, x, y - 1))
            free = true;
        else if((this._board[x-1] && this._board[x-1][y] === 0 || c) || this.isValidHelper(c, x-1, y))
            free = true;

        this._board[x][y] =0;
        return free;
    }

    /**
     * Checks if player is surrounded
     */
    isValidHelper(c,x,y)
    {
        var exc= 0;
        if(this._board[x][y+1] === c)                               //right
            exc++;
        else if(this._board[x+1] && this._board[x+1][y] === c)      //down
            exc++;
        else if(this._board[x][y-1] === c)                           //up
            exc++;
        else if(this._board[x-1] && this._board[x-1][y] === c)      //left
            exc++;
        return exc === 4;
    }
    /**
     * Make move
     * @param x coordinate 
     * @param y coordinate
     * @param player is the player making the move
     * @return {*| Boolean} returns if it made teh move
     */
    makeMove(x,y)
    {
        var color = this.turn.color;

        if( this.isValid(x,y) ) {
            var move = {
                player: color,
                oldBoard: this._board,
                next: {
                    x: x,
                    y: y
                }
            }
            this._board[x][y] = color;
            this._remainingMoves--;
            this._turn.playerHistory(move);
            this._boardHistory.push(move);
            this.switchTurn();
            
            return true;            //change to a kind of alert?
        }else
            return false;           //change to a kind of alert?
    }

    /**
     * switch player turn after move is made
     */
    switchTurn()
    {
        if( this._turn === this._playerBlack)
            this._turn= this._playerWhite;
        else
            this._turn= this._playerBlack;
    }

    /**
     * returns current players turn
     */
    get turn()
    {
        return this._turn();
    }
    /**
     * returns current board state
     */
    get board()
    {
        return this._board;
    }
    /**
     * returns entire game history
     */
    get boardHistory()
    {
        return this._boardHistory;
    }
    /**
     * returns most recent move
     */
    get lastMove()
    {
        return this._boardHistory.pop();
    }
    /**
     * Calculates final Score
     * Assigns skill level to each player
     * Skill ratio = (score + captured) * (player time / total time)
     */
    finishGame()
    {
        //needs to be implemented
        //Calculate score then set to player objects if not AI

        var totalGameTime= this._playerWhite.playTime+this._playerBlack.playTime;

        if(this._playerBlack.isAI == false)
        {
            this._playerBlack.score( 1000 );
            this._playerBlack.result(1); //won
            var skillBlack= (this._playerBlack.score + this._playerBlack.captured) * (this._playerBlack.playTime / totalGameTime);
            this._playerBlack.skill(skillBlack);
        }
        if(this._playerWhite.isAI == false)
        {
            this._playerWhite.score( 400 );
            this._playerWhite.result(0); //lost
            var skillWhite= (this._playerWhite.score + this._playerWhite.captured) * (this._playerWhite.playTime/ totalGameTime);
            this._playerWhite.skill(skillWhite);
        }
    }
}


