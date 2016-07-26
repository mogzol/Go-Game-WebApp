"use strict";

var http = require('http');

function getRandomMove(size, board, lastMove, cb, errCb) {
	var options = {
		host: 'roberts.seng.uvic.ca',
		path: '/ai/random',
		port: '30000',
		method: 'POST',
		headers: {
			"content-type": "application/json"
		}
	};

	var callback = function (response) {
		var str = "";
		response.on('data', function (chunk) {
			str += (chunk.toString());
		});

		response.on('end', function () {
			try {
				var json = JSON.parse(str);
			} catch (err) {
				console.log('AI response not JSON: ' + str);
				errCb()
			}

			if (json)
				cb(json);
		});
	};

	var req = http.request(options, callback);

	req.on('error', errCb);

	var postData = {
		size: size,
		board: board,
		last: lastMove
	};

	req.end(JSON.stringify(postData));
}

function findMaxLibs(size, board, lastMove, cb, errCb) {
	var options = {
		host: 'roberts.seng.uvic.ca',
		path: '/ai/maxLibs',
		port: '30000',
		method: 'POST',
		headers: {
			"content-type": "application/json"
		}
	};

	var callback = function (response) {
		var str = "";
		response.on('data', function (chunk) {
			str += (chunk.toString());
		});

		response.on('end', function () {
			try {
				var json = JSON.parse(str);
			} catch (err) {
				console.log('AI response not JSON: ' + str);
				errCb()
			}

			if (json)
				cb(json);
		});
	};

	var req = http.request(options, callback);

	req.on('error', errCb);

	var postData = {
		size: size,
		board: board,
		last: lastMove
	};

	req.end(JSON.stringify(postData));
}

function attackEnemy(size, board, lastMove, cb, errCb) {
	var options = {
		host: 'roberts.seng.uvic.ca',
		path: '/ai/attackEnemy',
		port: '30000',
		method: 'POST',
		headers: {
			"content-type": "application/json"
		}
	};

	var callback = function (response) {
		var str = "";
		response.on('data', function (chunk) {
			str += (chunk.toString());
		});

		response.on('end', function () {
			try {
				var json = JSON.parse(str);
			} catch (err) {
				console.log('AI response not JSON: ' + str);
				errCb()
			}

			if (json)
				cb(json);
		});
	};

	var req = http.request(options, callback);

	req.on('error', errCb);

	var postData = {
		size: size,
		board: board,
		last: lastMove
	};

	req.end(JSON.stringify(postData));
}

function formEyes(size, board, lastMove, cb, errCb) {
	var options = {
		host: 'roberts.seng.uvic.ca',
		path: '/ai/formEyes',
		port: '30000',
		method: 'POST',
		headers: {
			"content-type": "application/json"
		}
	};

	var callback = function (response) {
		var str = "";
		response.on('data', function (chunk) {
			str += (chunk.toString());
		});

		response.on('end', function () {
			try {
				var json = JSON.parse(str);
			} catch (err) {
				console.log('AI response not JSON: ' + str);
				errCb()
			}

			if (json)
				cb(json);
		});
	};

	var req = http.request(options, callback);

	req.on('error', errCb);

	var postData = {
		size: size,
		board: board,
		last: lastMove
	};

	req.end(JSON.stringify(postData));
}

module.exports = {
	getRandomMove: getRandomMove,
	findMaxLibs: findMaxLibs,
	attackEnemy: attackEnemy,
	formEyes: formEyes
};
