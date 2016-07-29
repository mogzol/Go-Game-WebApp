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

	updateFromPlayer(player)
	{
		if (player.result === 1) {
			this._numWin++;
		} else {
			this._numLoss++;
		}

		this._overallRatio = (this._numWin / this._numLoss).toFixed(2);
		this._userSkillLevel = player.skill;

		// We would also add the game ID to the games array, but we aren't saving games atm
	}

    get overallRatio()
    {
        return this._overallRatio;
    }

    get userSkillLevel()
    {
        return this._userSkillLevel;
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
