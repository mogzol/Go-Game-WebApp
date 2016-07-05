/**
 * Created by Mychael Lepur on 2016-07-05.
 */
'use strict'

var player_Games = [];
var num_Win;
var num_Loss;

class Accounts{


    constructor(name, password )
    {
        this._userName = name;
        this._password = password;
    }

    /**
     * setPlayerStats( player )
     * updates User account with game stats stored in player
     * Stores game states in player_Games
     */
    setPlayerStats( player )
    {
        var gameStat={
            game_Date: player.getStartDate(),
            game_Result: player.getResults(),
            game_Time: player.getPlayTime(),
            game_Score: player.getScore(),
            game_Captured: player.getCaptured(),
            game_Moves: player.getMoves()
        };
        if(gameStat.game_Results == true)
            num_Win += 1;
        else
            num_Loss += 1;

        player_Games.push(gameStat);
    }

    getOverallRation()
    {
        return num_Win/num_Loss;
    }
    getGameRatio( dates )
    {
        var win, loss;

        for( var i=0; i<= player_Games.length; i++)
        {
            if(player_Games[i].game_Date == dates[i])
            {

            }

        }
    }
    calculateBestGame()
    {
        var time, captured, score, number_Moves;

    }

}
