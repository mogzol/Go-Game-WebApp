'use strict';

module.exports = class Account
{
    constructor(name, password, email)
    {
    	var load = typeof name === 'object';

        this._username = load ? name._username : name;
        this._password = load ? name._password : password;
        this._email = load ? name._email : email;
	    this._userType = load ? name._userType : 1; // 1 is a basic user, 2 is an admin
        this._userGames = load ? name._userGames : [];
        this._numWin = load ? name._numWin : 0;
	    this._numLoss = load ? name._numLoss : 0;
        this._overallRatio = load ? name._overallRatio : 0;
        this._userBestGame = load ? name._userBestGame : null;
        this._userSkillLevel = load ? name._userSkillLevel : 0;
    }

    get username()
    {
    	return this._username;
    }

    set username(username)
    {
    	this._username = username;
    }

    get password()
    {
    	return this._password;
    }

    set password(password)
    {
    	this._password = password;
    }

    get email()
    {
    	return this._email;
    }

    set email(email)
    {
    	this._email = email;
    }

    get userType()
    {
    	return this._userType;
    }

    set userType(type)
    {
    	this._userType = type;
    }
	get userGames()
	{
		return this._userGames;
	}
	get userWins()
	{
		return this._numWin;
	}
	get userLoss()
	{
		return this._numLoss;
	}

    /**
     * setPlayerStats( player )
     * updates User account with game stats stored in player
     * Stores game states in player_Games
     */
    set playerStats(player)
    {
        var gameStat={
            gameDate: player.startDate(),
            gameResult: player.result(),
            gameTime: player.playTime(),
            gameScore: player.score(),
            gameCaptured: player.captured(),
            gameMoves: player.playerHistory(),
            gameSkill: player.skill()
        };
        if(gameStat.gameResult == 1)
            this._numWin += 1;
        else
            this._numLoss += 1;

        this._overallRatio= this._numWin / this._numLoss;
        this._userGames.push(gameStat);
        this.calculateBestGame();
    }

    get overallRatio()
    {
        return this._overallRatio;
    }

    get userSkillLevel()
    {
        return this._userSkillLevel;
    }

    get userBestGame()
    {
        return this._userBestGame;
    }

	/**
	 * Updates user best game by looking for the game the user
	 * scored the highest skill in.
	 */
	calculateBestGame()
	{
		var Skill=0;
		this._userSkillLevel=0;

		for(var i= 0; i< this._userGames.length; i++)
		{
			this._userSkillLevel += this._userGames[i].gameSkill;
			if(this._userGames[i].gameResult == 0)
				i++;
			else if(Skill < this._userGames[i].gameSkill){
				Skill= this._userGames[i].gameSkill;
				this._userBestGame= i;
			}
		}
	}
};
