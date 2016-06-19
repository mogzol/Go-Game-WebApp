// This is the base server file. All our modules are loaded here and all the different routes are defined.
// Actual page logic happens in the controllers

/*
 * -------- SET UP MODULES/VARS
 */

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
var db = mongojs('localhost:27017/go-app');

// Set up body-parser (for form data reading)
var bodyParser = require('body-parser');
var parseForm = bodyParser.urlencoded({extended: false});

// Load all our controllers
var controllers = require('auto-loader').load(__dirname + '/controllers');

// The port we will run on
var port = 3000;


/*
 * -------- GLOBAL REQUEST LOGIC
 */
app.use(function(request, response, next) {
	env.addGlobal('flashes', request.flash());
	next();
});


/*
 * -------- SET UP ROUTES
 */

// Serve the static content (libraries, etc.)
app.use(express.static('public'));

// Base route. Right now this is a user list
app.get('/', csrfProtection, function(request, response) {
	controllers.User.indexAction(request, response, db);
});

// Add user POST request
app.post('/addUser', parseForm, csrfProtection, function(request, response) {
	controllers.User.addUserAction(request, response, db);
});

// Remove all users POST request
app.post('/removeUsers', parseForm, csrfProtection, function(request, response) {
	controllers.User.removeUsersAction(request, response, db);
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
