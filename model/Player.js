"use strict"

var playTime;        //Play Time in Seconds
var gameResult;     //Win or Loss?
var playerHistory;   //Player's Moves
var gameSkillLevel;
class Player{

    constructor(name, color, isAI)
    {
        this._player = name;
        this._startDate= Date.now();
        this._runningDate= Date.now();
        this._color = color;
        this._isAI = isAI || false;
        this._score = -1;
        this._captured = -1;
        this._pass = false;
    }
    getColor()
    {
        return this._color;    
    }
    getName()
    {
        return this._player;   
    }
    getStartDate()
    {
        return this._startDate;
    }
    /**
     * setPlayerTme()
     * Keeps track of the time played
     * Updates the global variable play_Time
     * Updates the attribute this._date to current date
     */
    startTimer()
    {
        var startPoint =  this._runningDate();
        var endPoint = Date.now();

        playTime += (endPoint - startPoint) / 1000;
        this._runningDate = Date.now();
    }

    /**
     * getPlayTime()
     * Returns player tim in seconds
     * @returns {*| integer}
     */
    getPlayTime()
    {
        return playTime;
    }

    /**
     * isAI()
     * Checks player object if AI
     * @returns {*|boolean}
     */
    isAI()
    {
        return this._isAI;
    }

    /**
     * setScore( score )
     * @param score {integer} the score to set
     */
    setScore( score )
    {
        this._score = score;
    }

    /**
     * getScore()
     * @returns {*| integer} Returns player score
     */
    getScore()
    {
        return this._score;
    }

    /**
     * setCaptured( cap )
     * @param cap {token} Updates player captured
     */
    setCaptured( cap )
    {
        this._captured= cap;
    }

    /**
     * getCaptured()
     * @returns {*|token} Returns player captured
     */
    getCaptured()
    {
        return this._captured;
    }

    /**
     *setPass()
     *Updates player object to pass on turn
     */
    setPass()
    {
        this._pass = true;
    }

    /**
     * getPass()
     * @returns {boolean} Checks if player wants to pass on turn
     */
    getPass()
    {
        return this._pass;
    }
    /**
     * stores all the moves the player made
     */
    setPlayerHistory(move)
    {
        playerHistory.push(move);
    }
    getPlayerHistory()
    {
        return playerHistory;
    }

    /**
     * Store end result of game
     */
    setResult( result )
    {
        gameResult = result;
    }

    /**
     * Get end result of game
     */
    getResult()
    {
        return gameResults;
    }
    setSkill(skill)
    {
        gameSkillLevel = skill;
    }
    getSkill()
    {
        return gameSkillLevel;
    }

}