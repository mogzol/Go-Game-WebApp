var userDb = 'user';

module.exports = class User
{
	/**
	 * Handles rendering the base user page
	 */
	static indexAction(request, response, db)
	{
		var users = db.collection(userDb);
		users.find({}).toArray(function(err, users) {
			// And now we'll render the page for the user
			response.render('views/users.html.njk', {
				header: "Users",
				users: users,
				csrfToken: request.csrfToken()
			});
		});
	}

	static addUserAction(request, response, db)
	{
		var username = request.body.username;
		var password = request.body.password;

		if (!username || !password) {
			request.flash('danger', 'Please specify a username and password');
			response.redirect('/');
			return;
		}

		var users = db.collection(userDb);
		users.insert({username: username, password: password}, {upsert: true}, function() {
			request.flash('success', 'User added to the database!');
			response.redirect('/');
		});
	}

	static removeUsersAction(request, response, db)
	{
		var users = db.collection(userDb);
		users.remove({}, function() {
			request.flash('success', 'All users removed from the database!');
			response.redirect('/');
		});
	}
};
