"use strict";

var http = require('http');

const ai_host = process.env.GO_AI_HOST || 'roberts.seng.uvic.ca';
const ai_port = process.env.GO_AI_PORT || '30000';

function getRandomMove(size, board, lastMove, cb, errCb) {
	var options = {
		host: ai_host,
		path: '/ai/random',
		port: ai_port,
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
		host: ai_host,
		path: '/ai/maxLibs',
		port: ai_port,
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
		host: ai_host,
		path: '/ai/attackEnemy',
		port: ai_port,
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
		host: ai_host,
		path: '/ai/formEyes',
		port: ai_port,
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
