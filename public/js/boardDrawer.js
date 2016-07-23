function boardDrawer() {}

boardDrawer.currentBoard = [];

boardDrawer.getColor = function(boardVal, currentTurn) {
	if (boardVal === 1) {
		return '#333';
	} else if (boardVal === 2) {
		return '#FFF';
	} else {
		// If there is no token there, return the color for the current turn
		return boardDrawer.getColor(currentTurn);
	}
};

boardDrawer.makeJqToken = function(x, y, r, color, real, xCoord, yCoord) {
	return $('<circle ' + (real ? '' : 'class="token" ') + 'cx="' + x + '" cy="' + y + '" r="' + r + '" stroke="black" stroke-width="3" ' +
		'fill="'+ color + '" opacity="' + (real ? '1' : '0') + '" data-x="' + xCoord + '" data-y="' + yCoord + '" />');
};

boardDrawer.makeJqLine = function(x1, y1, x2, y2) {
	return $('<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="black" stroke-width="3" />');
};

boardDrawer.makeJqSquare = function(x, y, l) {
	return $('<rect x="' + x + '" y="' + y + '" width="' + l + '" height="' + l + '" stroke="black" stroke-width="3" fill="none" />');
};

boardDrawer.drawBoard = function(board, $board, currentTurn) {
	var size = board.length;

	var drawSize = 1000;

	var cellSize = drawSize / size;
	var cellCenter = cellSize / 2;

	var $newBoard = $('<svg>');

	// Draw border
	$newBoard.append(boardDrawer.makeJqSquare(cellCenter, cellCenter, cellSize * (size - 1)));

	// Draw the lines
	for (var i = 1; i < size - 1; i++) {
		// Vertical line
		$newBoard.append(boardDrawer.makeJqLine(cellCenter + cellSize * i, cellCenter, cellCenter + cellSize * i, drawSize - cellCenter));

		// Horizontal line
		$newBoard.append(boardDrawer.makeJqLine(cellCenter, cellCenter + cellSize * i, drawSize - cellCenter, cellCenter + cellSize * i));
	}

	// Draw a token at each spot on the board, if there shouldn't be a token there, use the current turn color and make
	// it 0 opacity, so that on hover we can show it. If currentTurn is null, do not draw the blank tokens.
	for (var y = 0; y < size; y++) {
		for (var x = 0; x < size; x++) {
			var real = Boolean(board[y][x]);

			if (real || currentTurn !== null) {
				var color = boardDrawer.getColor(board[y][x], currentTurn);
				$newBoard.append(boardDrawer.makeJqToken(cellCenter + cellSize * x, cellCenter + cellSize * y, cellSize / 2.2, color, real, x, y));
			}
		}
	}

	boardDrawer.currentBoard = board;
	$board.html($newBoard.html()); // Refresh the board display
};

boardDrawer.redraw = function ($board, currentTurn) {
	if (boardDrawer.currentBoard)
		boardDrawer.drawBoard(boardDrawer.currentBoard, $board, currentTurn);
};

boardDrawer.registerEvents = function($board, tokenClickCb) {
	$board.on('mouseenter', '.token', function () {
		var $this = $(this);
		$this.data('orig-opacity', $this.attr('opacity')).attr('opacity', 0.5);
	}).on('mouseleave', '.token', function () {
		var $this = $(this);
		$this.attr('opacity', $this.data('orig-opacity'));
	}).on('click', '.token', function() {
		var $this = $(this);
		tokenClickCb($this.data('x'), $this.data('y'));
	});
};
