# Go Web Application
Go Web Application for UVIC SENG 299

### Setting Up the Dev Environment
JetBrains IntelliJ (or WebStorm) is recommended for development. You can sign up for a student license for free: https://www.jetbrains.com/student/

SourceTree is a nice GUI for Git if you don't want to use the command line: https://www.sourcetreeapp.com/

Note that we use Nunjucks as our templating engine, which has a syntax similar to Twig (and Jinja), so if your editor supports Twig, make sure you set it to treat `njk` files as `twig` files. In JetBrains IDEs, this can be set in **File** > **Settings** > **Editor** > **File Types** and then find **Twig** in the list and add `*.njk` to the registered patterns. If your editor does not support twig (or Jinja), then just treat `njk` files as `html` files.

To begin setting up your dev environment, clone the repo to your machine: `https://github.com/SENG-299-Group-6-Summer16/Go-WebApp.git`

Now run `npm install` from the project directory, which will download and install all the dependencies specified in `package.json`

Next just make sure you have `mongod` running, and then start the server with `node server.js` (Node 6.2.2 or later is recommended).

### Project Layout/Folder Structure
The `server.js` file is where the server is set up, and all the modules and routes are set up.

The actual logic for the pages is handled by the controllers in the `controllers` folder. Controllers are auto-loaded, so after adding a new controller js file, it should just work without having to do anything in `server.js` (other than setting up the routes).

The pages themselves are located in the `views` folder. As mentioned earlier, these are Nunjuck templates. All of our pages should extend the `base.html.njk` file.  
Nunjuck templates are basically just HTML with some extra features, you can read about how to write them here: https://mozilla.github.io/nunjucks/templating.html.

Any static content (such as javascript/css libraries) is located in the `public` folder.

### Committing
When committing **make sure** you don't commit any files that are not strictly part of this project, such as editor specific files (the JetBrains editor's `.idea` folder has already been added to the gitignore). Also make sure not to commit the `node_modules` folder (again, it has already been added to the gitignore, so it would be pretty hard to do this by accident).

When writing commit messages, please follow the guidelines set here: http://chris.beams.io/posts/git-commit/  
Really, please read that, it's worth it.

### Code Formatting
Indent with tabs not spaces. Class and function declarations should have curly braces on a new line, unless they are being declared inline:

```javascript
function exampleFunc(arg1, arg2)
{
	// function code
}

thingWithCallback(arg, function() {
	// inline function code
});
```

All other blocks should have curly braces on the same line. Blocks with a single line of code in them do not need curly braces, but they should include a line break after the statement and condition:

```javascript
if (condition) {
	// some code
	// some more code
}

while (condition)
	// single line of code
```

Finally, make sure to add a blank line at the end of every file, or else Git diffs will include an annoying 'no blank line' message.

### Dependencies
Here are the links to the pages for all the dependencies we are currently using, use them if you are unsure on how to use something.

**auto-loader**: https://github.com/jwerle/node-auto-loader  
**bcrypt**: https://github.com/dcodeIO/bcrypt.js  
**body-parser**: https://github.com/expressjs/body-parser  
**connect-flash**: https://github.com/jaredhanson/connect-flash  
**csurf**: https://github.com/expressjs/csurf  
**express**: http://expressjs.com/en/4x/api.html  
**express-session**: https://github.com/expressjs/session  
**mongojs**: https://github.com/mafintosh/mongojs  
**nunjucks**: http://mozilla.github.io/nunjucks/  
