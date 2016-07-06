/**
 * Created by Mychael Lepur on 2016-07-05.
 */
"use strict"

var boardHistory =[];

class Game{

    constructor(playerOne, playerTwo, size)
    {
        this._playerBlack = playerOne;
        this._playerWhite = playerTwo;
        this._turn = this._playerBlack;
        this._board = this.createBoard(size);
        this._remainingMoves= size*size;
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
        var c = this._turn.getColor();
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
        var color = this.getTurn().getColor();

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
            this.getTurn().setPlayerHistory(move);
            boardHistory.push(move);
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
    getTurn()
    {
        return this._turn();
    }
    /**
     * returns current board state
     */
    getBoard()
    {
        return this._board;
    }
    /**
     * returns entire game history
     */
    getAllHistory()
    {
        return boardHistory;
    }
    /**
     * returns most recent move
     */
    getLastHistory()
    {
        return boardHistory.pop();
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

        var totalGameTime= this._playerWhite.getPlayTime()+this._playerBlack.getPlayTime();

        if(this._playerBlack.isAI == false)
        {
            this._playerBlack.setScore( 1000 );
            this._playerBlack.setResult(1); //won
            var skillBlack= (this._playerBlack.getScore() + this._playerBlack.getCaptured()) * (this._playerBlack.getPlayTime() / totalGameTime);
            this._playerBlack.setSkill(skillBlack);
        }
        if(this._playerWhite.isAI == false)
        {
            this._playerWhite.setScore( 400 );
            this._playerWhite.setResult(0); //lost
            var skillWhite= (this._playerWhite.getScore() + this._playerWhite.getCaptured()) * (this._playerWhite.getPlayTime() / totalGameTime + );
            this._playerWhite.setSkill(skillWhite);
        }
    }
}


