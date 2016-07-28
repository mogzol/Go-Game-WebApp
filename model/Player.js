"use strict";

module.exports= class Player{

    constructor(name, color, isAI, aiMode)
    {
	    var load = typeof name === 'object';

        this._player = load ? name._name : name;             //Name of player
        this._startDate =  load ? name._startDate : Date.now();    //Date player was created
        this._runningDate = load ? name._runningDate : {            //JSON variable to count play time
            'startTime': null,
            'playTime': null
        };
        this._color = load ? name._color : color;            //Player color (1 = Black, 2 = White)
        this._isAI = load ? name._isAI : isAI || false;     //Is the Player an AI
	    this._aiMode = load ? name._aiMode : aiMode || null; // The AI mode
        this._score = load ? name._score : 0;                //Player Score
        this._captured = load ? name._captured : 0;             //Amount of armies captured
        this._gameResult = load ? name._gameResult : -1;          //Win or Loss
        this._playerHistory = load ? name._playerHistory : [];       //Player's moves
        this._gameSkillLevel = load ? name._gameSkillLevel : 100;
	    this._aiMode = aiMode;      //Player's Skill level
    }
    /**
     * setPlayerTme()
     * Keeps track of the time played
     * Updates the global variable play_Time
     * Updates the attribute this._date to current date
     */
    start()
    {
        this._runningDate.startTime= Date.now();
    }
    end()
    {
        this._runningDate.playTime += (Date.now()-this._runningDate.startTime) / 1000;
    }
    get playTime()
    {
        return Math.floor(this._runningDate.playTime).toString();
    }
    get isAI()
    {
        return this._isAI;
    }

	get aiMode() {
		return this._aiMode;
	}

	set aiMode(value) {
		this._aiMode = value;
	}

	set score( score ) {
        this._score = score;
    }
    get score() {
        return this._score;
    }
    set captured( cap ) {
        this._captured= cap;
    }

    get captured() {
        return this._captured;
    }
    set result( result ) {
        this._gameResult = result;
    }
    get result() {
        return this._gameResult;
    }
    set skill(skill)
    {
        this._gameSkillLevel = skill;
    }
    get skill() {
        return this._gameSkillLevel;
    }
    get color() {
        return this._color;
    }
    get player() {
        return this._player;
    }
    get startDate()
    {
        return this._startDate;
    }
    set playerHistory(move) {
        this._playerHistory.push(move);
    }
    get playerHistory() {
        return this._playerHistory;
    }
};
