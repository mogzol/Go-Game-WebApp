// This is the base server file. All our modules are loaded here and all the different routes are defined.
// Actual page logic happens in the controllers

/*
 * -------- SET UP MODULES/VARS
 */

"use strict";

// Set up express
var express = require('express');
var app = express();

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
	express: app
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

// The port we will run on
var port = 3000;


/*
 * -------- GLOBAL REQUEST LOGIC
 */
app.use(function(request, response, next) {
	env.addGlobal('flashes', request.flash());
	env.addGlobal('routes', routes);
	next();
});


/*
 * -------- SET UP ROUTES
 */

// Serve the static content (libraries, etc.)
app.use(express.static('public'));




// Base route. Right now this is just the base page
app.get(routes.home, csrfProtection, function(request, response) {
	response.render('views/base.html.njk');
});



// Admin page. Right now anyone can access it (bad shit)
app.get(routes.admin, csrfProtection, function(request, response) {
	controllers.Admin.indexAction(request, response, db);
});

// Admin page. Right now anyone can access it (bad shit)
app.post(routes.adminCreateAccount, csrfProtection, function(request, response) {
	controllers.Admin.createAccountAction(request, response, db);
});

// Remove all users POST request
app.post(routes.removeAllAccounts, parseForm, csrfProtection, function(request, response) {
	controllers.Admin.removeUsersAction(request, response, db);
});



// Login page
app.get(routes.login, csrfProtection, function(request, response) {
	controllers.Login.indexAction(request, response, db);
});

// Login POST request
app.post(routes.login, parseForm, csrfProtection, function(request, response) {
	controllers.Login.loginAction(request, response, db);
});

// Add user POST request
app.post(routes.createAccount, parseForm, csrfProtection, function(request, response) {
	controllers.Login.addAccountAction(request, response, db);
});

/*
 * -------- ERROR HANDLING
 */

// Handle bad CSRF token
app.use(function (err, req, res, next) {
	if (err.code !== 'EBADCSRFTOKEN') return next(err);
	res.status(403).send('Invalid form submission attempted! You aren\'t allowed to do whatever you just tried doing!');
});


/*
 * -------- FINALLY WE CAN ACTUALLY LISTEN
 */

// And now that everything is set up, start listening
app.listen(port);
console.log('Listening on port ' + port);