"use strict";

module.exports = class Lobby
{

	/**
	 * Generates an ID for private lobbies (so that public lobbies can be created with the same name)
	 */
	generatePrivateId()
	{
		var nanotime = process.hrtime();
		return String(nanotime[0]) + nanotime[1] + '-' + this.name;
	}

    constructor(name, visibility)
    {
	    var load = typeof name === 'object';

	    this._name = load ? name._name : name;
	    this._visibility = load ? name._visibility : visibility;
	    this._id = load ? name._id : (this.visibility === 'private' ? this.generatePrivateId() : this.name);
	    this._starting = load ? name._starting : false;
	    this._owner = load ? name._owner : null;
    	this._users = load ? name._users : [];
	    this._banned = load ? name._banned : [];
        this._games = load ? name._games : [];
	    this._messages = load ? name._messages : [];
    }

    get id()
    {
    	return this._id;
    }

	get name()
    {
    	return this._name;
    }

	get visibility()
	{
		return this._visibility;
	}

	/**
	 * Changes the lobbies visibility, and optionally updates the ID
	 *
	 * @param {string}  visibility
	 * @param {boolean} updateId   Whether or not to update the ID. Defaults to false. If true, and a public lobby is
	 *                             made private, the ID will be changed to a private style ID. If true and a private
	 *                             lobby is made public, the ID will be changed to a public style ID.
	 */
	changeVisibility(visibility, updateId)
	{
		this._visibility = visibility;

		this.addMessage(null, 'Lobby has been made ' + visibility);

		if (updateId) {
			if (visibility === 'private')
				this._id = this.generatePrivateId();
			else
				this._id = this._name;
		}
	}

	get starting()
	{
		return this._starting;
	}

	set starting(starting)
	{
		this._starting = starting;
	}

    get users()
    {
        return this._users;
    }

	/**
	 * Verifies that a user is allowed to join the lobby.
	 *
	 * @returns {boolean|string} True if the user is allowed to join, or a descriptive error string directed at the user
	 *                           if they are not allowed to join
	 */
	verifyAllowedToJoin(username)
	{
		// Make sure the lobby is not in the process of starting games
		if (this.starting) {
			return "This lobby is closed";
		}

    	// Check if user is already in the lobby
	    if (this.users.includes(username)) {
		    return "You are already in that lobby";
	    }

	    // Check if they are banned
	    if (this._banned.includes(username)) {
		    return "You are banned from that lobby";
	    }

	    // If the lobby has games, make sure the user is a winner of one of the lobby's games
	    if (this.games.length) {
		    var allow = false;
		    for (var game of this.games) {
			    if (game.winner && game.winner._player === username) {
				    allow = true;
				    break;
			    }
		    }

		    if (!allow)
			    return "You are not allowed in that lobby";
	    }

	    // User can join
	    return true;
    }

	/**
	 * @param username The username to add
	 * @throws An error string directed at the user if they are not allowed to join
	 */
	addUser(username)
    {
    	// Make sure the user is allowed to join
	    var allowed = this.verifyAllowedToJoin(username);
	    if (allowed === true) {
		    this._users.push(username);
		    this.addMessage(null, username + ' has joined the lobby.');
	    } else {
	    	throw allowed;
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

	    if (this.owner !== null)
	        this.addMessage(null, this.owner + ' has been made owner of the lobby.');
    }

    get games()
    {
        return this._games;
    }

    set games(games)
    {
    	this._games = games;
    }

    addGame(game)
    {
    	this._games.push(game);
    }

	/**
	 * Checks the lobby's games to see if they are all finished.
	 *
	 * @returns {boolean} True if the games are all finished, or false if they are not
	 */
	gamesFinished()
	{
		for (var game of this.games) {
			if (!game.winner) // If a game does not have a winner, then it is not finished
				return false;
		}

		return true;
	}

	/**
	 * The amount of time, in milliseconds, since the last finished game in the lobby
	 *
	 * @return {boolean|number} False if no games are finished.
	 */
	lastFinished()
	{
		var latest = 0;
		for (var game of this.games) {
			if (game.winner && game.endTime > latest)
				latest = game.endTime;
		}

		if (latest === 0)
			return false;
		else
			return Date.now() - latest;
	}

	removeGame(id)
	{
		var index = this.games.findIndex(function (game) { return game.id === id });
		if (index > -1)
			this.games.splice(index, 1);
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
