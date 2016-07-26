"use strict";

module.exports = {
	home: '/',

	login: '/login',
	logout: '/logout',
	createAccount: '/createAccount',
	account: '/account',

	quickGame: '/quick',

	hotseatGame: '/game/hotseat',
	joinHotseatGame: '/game/hotseat/:id',

	aiGame: '/game/ai',
	joinAiGame: '/game/ai/:id',

	joinGame: '/game/:id',

	lobbies: '/lobbies',
	createLobby: '/lobbies/create',
	joinLobby: '/lobbies/lobby/:lobby',

	admin: '/admin',
	adminCreateAccount: '/admin/createAccount',
	removeAllAccounts: '/admin/removeUsers',
};
