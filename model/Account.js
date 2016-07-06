'use strict'

var playerGames = [];
var numWin;
var numLoss;
var overallRatio;
var userBestGame;
var userSkillLevel;

class Accounts{


    constructor(name, password, email )
    {
        this._userName = name;
        this._password = password;
        this._email= email;
    }

    /**
     * setPlayerStats( player )
     * updates User account with game stats stored in player
     * Stores game states in player_Games
     */
    setPlayerStats( player )
    {
        var gameStat={
            gameDate: player.getStartDate(),
            gameResult: player.getResult(),
            gameTime: player.getPlayTime(),
            gameScore: player.getScore(),
            gameCaptured: player.getCaptured(),
            gameMoves: player.getPlayerHistory(),
            gameSkill: player.getSkill()
        };
        if(gameStat.gameResult == 1)
            numWin += 1;
        else
            numLoss += 1;

        overallRatio= numWin/numLoss;
        playerGames.push(gameStat);
        this.calculateBestGame();
    }

    /**
     * returns Overall Ratio
     */
    getOverallRatio()
    {
        return overallRatio;
    }
    /**
     * returns users skill level
     */
    getUserSkillLevel()
    {
        return userSkillLevel;
    }
    /**
     * returns index of users best game
     */
    getUserBestGame()
    {
        return userBestGame;
    }

    /**
     * Finds users best game
     * Updates users skill level
     */
    calculateBestGame()
    {
        var Skill=0;
        userSkillLevel=0;

        for(var i= 0; i< playerGames.length; i++)
        {
            userSkillLevel += playerGames[i].gameSkill;
            if(playerGames[i].gameResult == 0)
                i++;
            else if(Skill < playerGames[i].gameSkill){
                Skill= playerGames[i].gameSkill;
                userBestGame= i;
            }
        }
    }

}
