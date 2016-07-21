"use strict";

// These are regex patterns that control who has access to certain pages. If a page doesn/t match any of these, then
// anyone will be able to access it
module.exports = {

	// If a page matches any of these, then users will have to log in before being able to access the page
	user: [
		/^\/lobbies$/,
		/^\/lobbies\/.*/,
		/^\/account$/,
		/^\/game\/(?!hotseat|ai).*/
	],


	// If a page matches any of these, then only admin users will be able to access them.
	admin: [
		/\/admin/,
		/\/admin\/.*/,
	]
};
