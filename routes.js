"use strict";

module.exports = {
	home: '/',

	login: '/login',
	logout: '/logout',
	createAccount: '/createAccount',
	account: '/account',
	updateAccount: '/account/update',

	quickGame: '/quick',

	hotseatGame: '/game/hotseat',
	joinHotseatGame: '/game/hotseat/:id',

	aiGame: '/game/ai',
	joinAiGame: '/game/ai/:id',

	joinGame: '/game/:id',

	lobbies: '/lobbies',
	createLobby: '/lobbies/create',
	joinLobby: '/lobbies/lobby/:lobby',
	
	rules: '/rules',
	leaderboards: '/leaderboards',

	admin: '/admin',
	adminCreateAccount: '/admin/createAccount',
	removeAllAccounts: '/admin/removeUsers',
};
