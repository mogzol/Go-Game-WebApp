// This is the base server file. All our modules are loaded here and all the different routes are defined.
// Actual page logic happens in the controllers

/*
 * -------- SET UP MODULES/VARS
 */

"use strict";

// Set up express
var express = require('express');
var app = express();

// Set up websockets
var expressWs = require('express-ws')(app);

// Set up session handler
var session = require('express-session');
app.use(session({
	secret: 'NotSoSecretKey',
	maxAge: 3600000, // 1 hour
	resave: false,
	saveUninitialized: false
}));

// Set up connect-flash (for flash messages)
var flash = require('connect-flash');
app.use(flash());

// Set up csurf (for csrf protection)
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: false });

// Set up nunjucks (templating engine)
var nunjucks = require('nunjucks');
var env = nunjucks.configure({
	autoescape: true,
	express: app,
	watch: true // Watch templates for changes. Useful for dev, remove for production though
});
env.addFilter('empty', function(object) { // Needed a way to check if an object was empty
	return Object.keys(object).length === 0;
});

// Set up mongojs (like mongodb but cleaner code)
var mongojs = require('mongojs');
var db = mongojs('localhost:27017/goApp');

// Set up body-parser (for form data reading)
var bodyParser = require('body-parser');
var parseForm = bodyParser.urlencoded({extended: false});

// Load all our controllers
var controllers = require('auto-loader').load(__dirname + '/controllers');

// Load our routes
var routes = require('./routes.js');

// Access control
var access = require('./access.js');
function requiresUser(url) {
	for (var pattern of access.user)
		if (url.match(pattern))
			return true;
}
function requiresAdmin(url) {
	for (var pattern of access.admin)
		if (url.match(pattern))
			return true;
}

// The port we will run on
var port = 3000;


/*
 * -------- GLOBAL REQUEST LOGIC
 */
app.use(function(request, response, next) {
	// Handle access control
	var url = request.url;

	if (!request.session.userType && (requiresUser(url) || requiresAdmin(url))) {
		if (request.ws) { // if this is a websocket request, just send a 403
			response.status(403).send('You don\'t have permission to access that page');
			return;
		}

		// Otherwise, redirect to login
		request.session.redirectOnLogin = url;
		request.flash('info', 'Please log in to access that page');
		response.redirect(routes.login);
		return;
	} else if (request.session.userType < 2 && requiresAdmin(url)) {
		response.status(403).send('You don\'t have permission to access that page');
		return;
	}

	env.addGlobal('url', request.url);
	env.addGlobal('flashes', request.flash());
	env.addGlobal('routes', routes);
	env.addGlobal('session', request.session);
	next();
});

// Our express-ws package interfere with routes that have params due to the fact that it adds .websocket to the end of
// URLs. This causes matches on URLs that shouldn't match, so we want to avoid this.
//
// !!!!! Make sure you add this as the first middle-ware function to any routes that have params (including ws routes).
function hasParams(req, res, next) {
	for (var param in req.params) {
		if (!req.params.hasOwnProperty(param))
			continue; // skip loop if the property is from prototype

		if (req.params[param] === '.websocket') {
			next('route');
			return;
		}
	}
	next();
}

/*
 * -------- SET UP TASKS THAT RUN PERIODICALLY
 */

// Cleanup lobbies & games every 60 seconds
setInterval(function () {
	controllers.LobbyController.cleanupLobbies();
}, 60000);


/*
 * -------- SET UP ROUTES
 */

// Serve the static content (libraries, etc.)
app.use(express.static('public'));



// Base route. Right now this is just the base page
app.get(routes.home, csrfProtection, function(request, response) {
	response.render('views/base.html.njk');
});



///////////////// Admin pages disabled since they're outdated and we never bothered to update them
//// Admin page.
//app.get(routes.admin, csrfProtection, function(request, response) {
//	controllers.AdminController.indexAction(request, response, db);
//});
//
//// Admin page.
//app.post(routes.adminCreateAccount, csrfProtection, function(request, response) {
//	controllers.AdminController.createAccountAction(request, response, db);
//});
//
//// Remove all users POST request
//app.post(routes.removeAllAccounts, parseForm, csrfProtection, function(request, response) {
//	controllers.AdminController.removeUsersAction(request, response, db);
//});



// Login page
app.get(routes.login, csrfProtection, function(request, response) {
	controllers.LoginController.indexAction(request, response, db);
});

// Login POST request
app.post(routes.login, parseForm, csrfProtection, function(request, response) {
	controllers.LoginController.loginAction(request, response, db);
});

// Logout GET request
app.get(routes.logout, function(request, response) {
	controllers.LoginController.logoutAction(request, response);
});

// Add user POST request
app.post(routes.createAccount, parseForm, csrfProtection, function(request, response) {
	controllers.LoginController.addAccountAction(request, response, db);
});

// Account page
app.get(routes.account, csrfProtection, function(request,response){
	controllers.AccountController.indexAction(request, response, db);
});

// Update account details
app.post(routes.updateAccount, parseForm, csrfProtection, function(request, response) {
	controllers.AccountController.updateAction(request, response, db);
});



// Lobbies
app.get(routes.lobbies, csrfProtection, function(request, response) {
	controllers.LobbyController.indexAction(request, response);
});

// Create lobby
app.post(routes.createLobby, parseForm, csrfProtection, function(request, response) {
	controllers.LobbyController.addAction(request, response);
});

// Join lobby
app.get(routes.joinLobby, hasParams, csrfProtection, function(request, response) {
	controllers.LobbyController.joinAction(request, response);
});

// Lobby websocket request
app.ws(routes.joinLobby, hasParams, function(ws, request) {
	controllers.LobbyController.wsAction(ws, request, db);
});



// Quick Game
app.get(routes.quickGame, csrfProtection, function(request, response) {
	controllers.QuickGameController.indexAction(request, response);
});



// Hotseat game start
app.post(routes.hotseatGame, parseForm, csrfProtection, function(request, response) {
	controllers.GameController.hotseatGameAction(request, response);
});

// Hotseat game websocket request
app.ws(routes.joinHotseatGame, hasParams, function(ws, request) {
	controllers.GameController.hotseatWsAction(ws, request);
});



// AI game start
app.post(routes.aiGame, parseForm, csrfProtection, function(request, response) {
	controllers.GameController.aiGameAction(request, response);
});

// AI game websocket request
app.ws(routes.joinAiGame, hasParams, function(ws, request) {
	controllers.GameController.wsAction(ws, request);
});



// Lobby game start
app.get(routes.joinGame, hasParams, function (request, response) {
	controllers.GameController.lobbyGameAction(request, response);
});

// Lobby game websocket
app.ws(routes.joinGame, hasParams, function (ws, request) {
	controllers.GameController.wsAction(ws, request, db);
});



// Rules
app.get(routes.rules, function(request, response) {
	response.render('views/rules.html.njk');
});



// The leaderboards controller
app.get(routes.leaderboards, function(request, response) {
	controllers.LeaderboardController.indexAction(request, response, db);
});

/*
 * -------- ERROR HANDLING
 */

// Handle bad CSRF token
app.use(function (err, req, res, next) {
	if (err.code !== 'EBADCSRFTOKEN')
		return next(err);

	res.status(403).send('Invalid form submission attempted! You aren\'t allowed to do whatever you just tried doing!');
});


/*
 * -------- FINALLY WE CAN ACTUALLY LISTEN
 */

// And now that everything is set up, start listening
app.listen(port);
console.log('Listening on port ' + port);
