"use strict"

module.exports = class Lobby{
    constructor(game)
    {
        this._lobby= [];
        this._currentGame = Game;
    }

    get lobby()
    {
        return this.lobby;
    }
    set lobby( game )
    {
        this._lobby.push(game);
    }
    get currentGame()
    {
        return this._currentGame;
    }
    set currentGame( game )
    {
        this._currentGame= game;
    }

}
