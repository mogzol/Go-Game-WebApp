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

	lobbies: '/lobbies',
	createLobby: '/lobbies/create',
	joinLobby: '/lobbies/lobby/:lobby',

	admin: '/admin',
	adminCreateAccount: '/admin/createAccount',
	removeAllAccounts: '/admin/removeUsers',
};
