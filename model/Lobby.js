"use strict";

module.exports = class Lobby{
    constructor(name, creator)
    {
	    var load = typeof name === 'object';

	    this._name = load ? name._name : name;
    	this._users = load ? name._users : [creator];
        this._games = load ? name._games : [];
    }

    get name()
    {
    	return this._name;
    }

    get users()
    {
        return this._users;
    }

    addUser(username)
    {
    	this._users.push(username);
    }

    get games()
    {
        return this._games;
    }
};
