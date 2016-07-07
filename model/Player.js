"use strict"

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
        
        this._playTime = -1;              //play time in seconds
        this._gameResult = -1;      //Win or Loss
        this._playerHistory = [];    //Player's moves
        this._gameSkillLevel = -1;
    }
    /**
     * setPlayerTme()
     * Keeps track of the time played
     * Updates the global variable play_Time
     * Updates the attribute this._date to current date
     */
    startPlayTime()
    {
        var startPoint =  this._runningDate();
        var endPoint = Date.now();

        this._playTime += (endPoint - startPoint) / 1000;
        this._runningDate = Date.now();
    }
	isAI()
	{
		return this._isAI;
	}
    get playTime()
    {
        return this._playTime;
    }
    set score( score )
    {
        this._score = score;
    }
    get score()
    {
        return this._score;
    }
    set captured( cap )
    {
        this._captured= cap;
    }
    get captured()
    {
        return this._captured;
    }
    get color()
    {
        return this._color;
    }
    get player()
    {
        return this._player;
    }
    get startDate()
    {
        return this._startDate;
    }
    set pass()
    {
        this._pass = true;
    }
    get pass()
    {
        return this._pass;
    }
    set playerHistory(move)
    {
        this._playerHistory.push(move);
    }
    get playerHistory()
    {
        return this._playerHistory;
    }
    set result( result )
    {
        this._gameResult = result;
    }
    get result()
    {
        return this._gameResult;
    }
    set skill(skill)
    {
        this._gameSkillLevel = skill;
    }
    get skill()
    {
        return this._gameSkillLevel;
    }

}