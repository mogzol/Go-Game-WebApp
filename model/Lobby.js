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
	 * @param username
	 * @returns {boolean} False if user was already in the lobby, or true if they were added
	 */
	addUser(username)
    {
    	// Make sure the user isn't already in the list
	    if (!this._users.includes(username)) {
		    this._users.push(username);
		    this.addMessage(null, username + ' has joined the lobby.');
	    } else {
	    	return false;
	    }

	    // If there is no owner set, we will set this user as the owner
	    if (!this.owner) {
		    this.owner = username;
		    this.addMessage(null, this.owner + ' has been made owner of the lobby.');
	    }

	    return true;
    }

    removeUser(username)
    {
    	var index = this._users.indexOf(username);
	    if (index > -1) {
		    this._users.splice(index, 1);
		    this.addMessage(null, username + ' has left the lobby.');

		    // If the removed user was the owner, we will set the new owner to be the first user in the lobby
		    if (this.owner == username) {
		    	this.owner = this.users.length < 1 ? null : this.users[0];
			    this.addMessage(null, this.owner + ' has been made owner of the lobby.');
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
    }

    get games()
    {
        return this._games;
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
