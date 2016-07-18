"use strict"

module.exports= class Player{

    constructor(name, color, isAI)
    {
        this._player = name;            //Name of player
        this._startDate= Date.now();    //Date player was created
        this._runningDate= {            //JSON variable to count play time
            'startTime': null,
            'playTime': null
        };
        this._color = color;            //Player color (Black/White)
        this._isAI = isAI || false;     //Is the Player an AI
        this._score = 0;               //Player Score
        this._captured = 0;            //Amount of armies captured
        this._pass = false;             //Does player pass turn
        this._gameResult = -1;          //Win or Loss
        this._playerHistory = [];       //Player's moves
        this._gameSkillLevel = -1;      //Player's Skill level
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
    set pass( flag ) {
        this._pass = flag;
    }
    get pass() {
        return this._pass;
    }
    set playerHistory(move) {
        this._playerHistory.push(move);
    }
    get playerHistory() {
        return this._playerHistory;
    }
}
