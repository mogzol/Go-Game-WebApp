"use strict";

module.exports = class Lobby{
    constructor(name, visibility)
    {
	    var load = typeof name === 'object';

	    this._name = load ? name._name : name;
	    this._visibility = load ? name._visibility : visibility;
	    this._locked = load ? name._locked : false;
	    this._owner = load ? name._owner : null;
    	this._users = load ? name._users : [];
	    this._banned = load ? name._banned : [];
        this._games = load ? name._games : [];
	    this._messages = load ? name._messages : [];
	    this._visibility = visibility;
    }

    get name()
    {
    	return this._name;
    }

	get visibility()
	{
		return this._visibility;
	}

	set visibility(visibility)
	{
		this._visibility = visibility;
	}

	get locked()
	{
		return this._locked;
	}

	set locked(locked)
	{
		this._locked = locked;
	}

    get users()
    {
        return this._users;
    }

	/**
	 * @param username The username to add
	 * @throws An error if the user is banned or is already in the lobby
	 */
	addUser(username)
    {
    	// Make sure the user isn't banned
	    if (this._banned.includes(username)) {
	    	throw "User is banned from this lobby";
	    }

    	// Make sure the user isn't already in the list
	    if (!this._users.includes(username)) {
		    this._users.push(username);
		    this.addMessage(null, username + ' has joined the lobby.');
	    } else {
	    	throw "User is already in the lobby";
	    }

	    // If there is no owner set, we will set this user as the owner
	    if (!this.owner) {
		    this.owner = username;
	    }
    }

    removeUser(username, ban, action)
    {
    	action = action || 'left';
    	var index = this._users.indexOf(username);
	    if (index > -1) {
		    this._users.splice(index, 1);
		    this.addMessage(null, username + ' has ' + action + ' the lobby.');

		    if (ban)
		    	this._banned.push(username);

		    // If the removed user was the owner, we will set the new owner to be the first user in the lobby
		    if (this.owner == username) {
		    	this.owner = this.users.length < 1 ? null : this.users[0];
		    }
	    }
    }

    get owner()
    {
    	return this._owner;
    }

    set owner(owner)
    {
    	this._owner = owner;
	    this.addMessage(null, this.owner + ' has been made owner of the lobby.');
    }

    get games()
    {
        return this._games;
    }

    addGame(game)
    {
    	this._games.push(game);
    }

    get messages()
    {
    	return this._messages;
    }

    addMessage(creator, message)
    {
    	this._messages.push({by: creator, msg: message});
    }
};
