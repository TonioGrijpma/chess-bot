function createUIBoard(){
	let boardEl = document.getElementById("board");
	let captureL = document.getElementById("capture-l");
	let captureR = document.getElementById("capture-r");
	let border = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
	border.setAttribute("width", BOARD_WIDTH);
	border.setAttribute("height", BOARD_WIDTH);
	border.style= "stroke-width: 2px; stroke: black";

	boardEl.appendChild(border);

	for (let col = 0; col < 8; col++) {
		for (let row = 0; row < 8; row++) {
			boardEl.appendChild(createRect(row, col));
		}
	}

    boardEl.addEventListener("mousemove", mousemove);
    boardEl.addEventListener("mouseleave", mouseleave);
    boardEl.addEventListener("click", mouseclick);

	boardEl.style.width = BOARD_WIDTH + "px";
	boardEl.style.height = BOARD_WIDTH + "px";

	captureL.style.height = BOARD_WIDTH + "px";
	captureR.style.height = BOARD_WIDTH + "px";
	captureL.style.width = ((SQUARE_WIDTH / 1.5) * 2) + "px";
	captureR.style.width = ((SQUARE_WIDTH / 1.5) * 2) + "px";
}
function initOptions(){
	let colorsEls = document.querySelectorAll(".toggle-color");
	let autoplayEl = document.getElementById("autoplay");
	let difficultyEl = document.getElementById("difficulty");
	autoplayEl.active = false;

	colorsEls.forEach(function(el){
		el.addEventListener("click", function(){
			colorsEls.forEach(function(el2){
				el2.classList.remove("toggle-active");
			})

			el.classList.toggle("toggle-active");
			playerColor = el.id;
			botColor = invertColor(playerColor);
			flipBoard();
		})
	})
	autoplayEl.addEventListener("click", function(){
		autoplayEl.active = !autoplayEl.active;
		autoplayEl.classList.toggle("toggle-active");
		autoplayEl.innerText = autoplayEl.innerText.replace((autoplayEl.active) ? "(off)" : "(on)", (autoplayEl.active) ? "(on)" : "(off)")
		autoplay = autoplayEl.active;
	})
	difficultyEl.addEventListener("change", function(){
		treeDepth = parseInt(difficultyEl.value)
	})
}
function mousemove(event){
    let {x, y} = getCoordsFromEvent(event);
    let piece = UIboard[x][y];

	if(x == movedCoords.x && y == movedCoords.y){
		return;
	}

	highlightSquare(x, y);

    if(isClicked()){
        return;
    }

	if(isHighlighting){
		removeHighlight(false);
	}

    if(piece.name == null){
        return;
    }
    if(piece.color != playerColor || piece.color != turnColor){
        return;
    }

    highlightPiece(piece);

    highlightMoves(piece);

	movedCoords = {x: x, y: y}
}
function mouseclick(event){
    let {x, y} = getCoordsFromEvent(event);
    let piece = UIboard[x][y];

	// prevent clicking a piece before it is your turn
	if(clickedPiece == null && piece != null && piece.color != turnColor){
		return;
	}

    if(isClicked()){
        if(piece == clickedPiece){
            clickedPiece = null;
			removeHighlight();
            return;
        }

        // check if you can do stuff
        makeMove(clickedPiece, x, y);

        return;
    }else{
        if(piece.name != null && piece.color == playerColor && piece.color == turnColor){
            clickedPiece = piece;
        }
    }

    if(piece.color != null && piece.color != playerColor){
        highlightMoves(piece)
    }
}
function mouseleave(){
	removeSquareHighlight();

    if(!isClicked()){
        removeHighlight(false);
    }
}
function getCoordsFromEvent(event){
    let x = Math.floor((event.offsetY - 3) / SQUARE_WIDTH);
    let y = Math.floor((event.offsetX - 3) / SQUARE_WIDTH);

    x = (x < 0) ? 0 : x
    y = (y < 0) ? 0 : y

    return {x: x, y: y}
}

function createRect(row, col){
	let square = document.createElementNS("http://www.w3.org/2000/svg", 'rect');

	square.setAttribute("class", "square");
	square.setAttribute("x", (row * SQUARE_WIDTH) + 1);
	square.setAttribute("y", (col * SQUARE_WIDTH) + 1);
	square.setAttribute("width", SQUARE_WIDTH);
	square.setAttribute("height", SQUARE_WIDTH);
	square.setAttribute("fill", ((col + row) % 2) ? "lightgrey" : "white");
	square.setAttribute("id", `${col}-${row}`);

	return square;
}
function createInternalBoard(){
	const PIECE_ORDER = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];
	UIboard = [];
	for (let row = 0; row < 8; row++) {
		UIboard.push([]);
		for (let col = 0; col < 8; col++) {
			UIboard[row].push({});
		}
	}

	for (let i = 0; i < 8; i++) {
		createPiece("black", PIECE_ORDER[i], 0 ,i);
		createPiece("white", PIECE_ORDER[i], 7 ,i);
	}
	for (let i = 0; i < 8; i++) {
		createPiece("black", "pawn",1 ,i);
		createPiece("white", "pawn",6 ,i);
	}

	// castle test config
	// createPiece("white", "rook",7 ,7);
	// createPiece("white", "king",7 ,4);
	// createPiece("white", "rook",7 ,0);
	// createPiece("black", "rook",0 ,0);
	// createPiece("white", "pawn",6 ,0);
	// createPiece("white", "pawn",6 ,7);
	// createPiece("black", "king",0 ,4);
	// createPiece("black", "rook",0 ,7);
	// createPiece("black", "pawn",1 ,0);
	// createPiece("black", "pawn",1 ,7);

	// check & mate test config
	// createPiece("black", "king",0 ,4);
	// createPiece("black", "rook",0 ,0);
	// createPiece("black", "rook",0 ,7);
	// createPiece("white", "king",7 ,4);
	// createPiece("white", "rook",7 ,0);
	// createPiece("white", "rook",7 ,7);

	// promotion test config
	// createPiece("black", "king",0 ,4);
	// createPiece("white", "king",7 ,4);
	// createPiece("black", "pawn",5 ,0);
	// createPiece("white", "pawn",2 ,7);

	// trade test config
	// createPiece("black", "king",0 ,0);
	// createPiece("black", "pawn",5 ,5);
	// createPiece("white", "king",7 ,7);
	// createPiece("white", "pawn",6 ,4);
	// createPiece("white", "rook",7 ,4);

	// tie test config
	// createPiece("black", "king",0 ,0);
	// createPiece("white", "king",0 ,3);
	// createPiece("white", "rook",1 ,3);

	// createPiece("black", "king",0 ,0);
	// createPiece("white", "king",0 ,4);
	// createPiece("white", "queen",1 ,5);

	board = minifyUIBoard();
}
function syncUI(){
	for (let _i; cycleCount < moveList.length; cycleCount++) {
		let move = moveList[cycleCount];
		movePiece(move);

		// highlight previous move
		if(turnColor == botColor){
			highlightPreviousMove(move[0][0], move[0][1])
			highlightPreviousMove(move[1][0], move[1][1])
		}
	}
}
function movePiece(move){
	let from = UIboard[move[0][0]][move[0][1]];
	let to = UIboard[move[1][0]][move[1][1]];

	logMove(move);

	if(!finishedPromotion){
		showOverlay()

		let interval = setInterval(function(){
			if(promoteTo != ""){
				clearInterval(interval);

				board[move[0][0]][move[0][1]] = 6;
				board[move[1][0]][move[1][1]] = pieceNameToInt(promoteTo) + ((from.color == "white") ? 0 : 10);

				// move image
				from.element.setAttribute("x", (move[1][1] * SQUARE_WIDTH) + 1);
				from.element.setAttribute("y", (move[1][0] * SQUARE_WIDTH) + 1);

				from.row = move[1][0];
				from.col = move[1][1];

				if(UIboard[move[1][0]][move[1][1]].name != null){
					UIboard[move[1][0]][move[1][1]].capture();
				}

				UIboard[move[1][0]][move[1][1]] = from;
				UIboard[move[0][0]][move[0][1]] = {};

				from.name = promoteTo;
				from.element.setAttribute('href', `img/${promoteTo}_${(from.color == "white") ? "w" : "b"}.svg`);

				document.getElementById("promotionOverlay").style.display = "none";

				finishedPromotion = true;

				promoteTo = "";

				mateCheck(board, (turnColor == "white"));
			}
		}, 100)
	}else{
		// bot promotion check
		if(from.name != null){
			let pieceInt = board[move[1][0]][move[1][1]];
			pieceInt = (from.color == "black") ? pieceInt - 10 : pieceInt;

			if(pieceNameToInt(from.name) != pieceInt){
				from.name = pieceIntToName(pieceInt);
				from.element.setAttribute('href', `img/${from.name}_${(from.color == "white") ? "w" : "b"}.svg`);
			}
		}

		if(to.color != from.color){
			if(to.name != null && from.name != null){
				to.capture();
			}
		}
		
		
		// move image
		from.element.setAttribute("x", (move[1][1] * SQUARE_WIDTH) + 1);
		from.element.setAttribute("y", (move[1][0] * SQUARE_WIDTH) + 1);

		from.row = move[1][0];
		from.col = move[1][1];

		UIboard[move[1][0]][move[1][1]] = from;
		UIboard[move[0][0]][move[0][1]] = {};
	}
}

function createPiece(color, name, row, col){
	let boardEl = document.getElementById("board")

	UIboard[row][col] = {
		color: color,
		name: name,
		capture: k,
		row: row,
		col: col
	}

	let piece = document.createElementNS("http://www.w3.org/2000/svg", 'image');

	piece.setAttribute("class", "piece");

	piece.setAttribute("x", (col * SQUARE_WIDTH) + 1);
	piece.setAttribute("y", (row * SQUARE_WIDTH) + 1);
	piece.setAttribute("height", SQUARE_WIDTH);
	piece.setAttribute("width", SQUARE_WIDTH);

	piece.setAttribute("href", `img/${name}_${(color == "white") ? "w" : "b"}.svg`);

	if(color != playerColor){
		piece.setAttribute("style", "pointer-events: none");
	}

	boardEl.appendChild(piece);

	UIboard[row][col].element = piece;

	function k(){
		let captureL = document.getElementById("capture-l");
		let captureR = document.getElementById("capture-r");
		let x = 0;
		let y = 0;
		let width = SQUARE_WIDTH / 1.5;

		this.element.style.width = `${width}px`;
		this.element.style.height = `${width}px`;
		this.element.style.cursor = "default";
		this.element.classList.remove("flip-piece");

		if(this.color == "white"){
			x = (captured[0].length % 2 == false) ? width : 0
			y = width * Math.floor(captured[0].length / 2)
			captured[0].push(pieceNameToInt(this.name))
			captureL.appendChild(this.element);
		}else{
			x = (captured[1].length % 2 == false) ? width : 0
			y = width * Math.floor(captured[1].length / 2)
			captured[1].push(pieceNameToInt(this.name))
			captureR.appendChild(this.element);
		}
		
		this.element.setAttribute("x", x);
		this.element.setAttribute("y", y);
	}
}
function highlightPiece(piece){
	isHighlighting = true;

	let el = document.getElementById(`${piece.row}-${piece.col}`);

	if(!isCheckHighlight(el)){
		el.style.fill = COLOR_HOVER;
	}
}
function removeHighlight(removeCheck){
    let squares = document.querySelectorAll(".square");
	let loc = getKingLocation(turnColor == "white", board);

    for (let i = 0; i < squares.length; i++) {
        if(squares[i].style.fill != ""){
			if(!removeCheck){
				let id = squares[i].id.split("-");
				let x = parseInt(id[0]);
				let y = parseInt(id[1]);

				if(!(x == loc[0] && y == loc[1])){
					if(!isCheckHighlight(squares[i])){
						squares[i].style.fill = "";
					}
				}
				if(!isCheckHighlight(squares[i])){
					squares[i].style.fill = "";
				}
			}else{
				squares[i].style.fill = "";
			}
        }
		if(removeCheck){
			if(squares[i].style.stroke != ""){
				squares[i].style.stroke = "";
			}
		}
    }

	isHighlighting = false;
	movedCoords = {x: -1, y: -1}
}
function isCheckHighlight(square){
	let r = (square.style.fill == COLOR_MATE || square.style.fill == COLOR_CHECK)
	return r;
}

function highlightMoves(piece){
	let moves = getMovesetFromObject(piece);

	isHighlighting = true;
    
	for(let i = 0; i < moves.length; i++){
		subArray = moves[i];

		if(i == 0){	// locations
			for (let i2 = 0; i2 < subArray.length; i2++) {
				let el = document.getElementById(`${subArray[i2].x}-${subArray[i2].y}`);
				el.style.fill = getStyleColor(i);
			}
		}
		if(i == 1){	// capture moves
			for (let i2 = 0; i2 < subArray.length; i2++) {
				let el = document.getElementById(`${subArray[i2].x}-${subArray[i2].y}`);
				el.style.fill = getStyleColor(i);
			}
		}
		if(i == 2){	// promotion
			for (let i2 = 0; i2 < subArray.length; i2++) {
				let el = document.getElementById(`${subArray[i2].x}-${subArray[i2].y}`);
				el.style.fill = getStyleColor(i);
			}
		}
		if(i == 3){	// castle
			for (let i2 = 0; i2 < subArray.length; i2++) {
                let el = document.getElementById(`${(piece.color == "white") ? 7 : 0}-${4}`);
                el.style.fill = getStyleColor(i);
			}
		}
	}
}
function getStyleColor(i){
    switch (i) {
        case 0:
            return COLOR_HOVER;
        case 1:
            return COLOR_CAPTURE;
        case 2:
            return COLOR_PROMOTION;
        case 3:
            return COLOR_CASTLE;
    }
}
function logError(msg){
	console.log(`error: ${msg}`);
	// document.getElementById("error").innerText = msg;
}
function isClicked(){
    return (clickedPiece != null && clickedPiece.name != null)
}
function createPromotionOverlay(){
	let el = document.getElementById("promotionContainer");
	let names = ["queen", "rook", "bishop", "knight"]

	for (let i = 0; i < 4; i++) {
		let container = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
		container.setAttribute("class", "promotion-item");
		container.addEventListener("click", function(){
			promoteTo = names[i];
		});

		let image = new Image();
		image.className = "promotion-image";
		image.src = `img/${names[i]}_${(playerColor == "white") ? "w" : "b"}.svg`;

		container.append(image);
		el.append(container);
	}
}
function showOverlay(){
	document.getElementById("promotionOverlay").style.display = "block";
}
function logMove(move){
	// TODO: proper chess notation https://www.ichess.net/blog/chess-notation/
	let from = BOARD_LAYOUT[move[0][0]][move[0][1]];
	let to = BOARD_LAYOUT[move[1][0]][move[1][1]];

	addElToMoves(turnColor, `${from}${to}`);
}
function logMoveDebug(board, move){
	let from = BOARD_LAYOUT[move[0][0]][move[0][1]];
	let to = BOARD_LAYOUT[move[1][0]][move[1][1]];
	let color = (board[move[0][0]][move[0][1]] < 9) ? "white" : "black"

	addElToMoves(color, `${from}${to}`);
}
function check(color){
	highlightKing(color, false, board);
}
function mate(color){
    if(color != "sdraw"){
        highlightKing((color == "white"), true, board);
    }
	
    winner(invertColor(color))
}
function highlightPreviousMove(x, y){
	document.getElementById(`${x}-${y}`).style.stroke = COLOR_PREV_MOVE;
}
function highlightKing(color, isMate, board){
    let loc = getKingLocation(color, board);

    document.getElementById(`${loc[0]}-${loc[1]}`).style.fill = (isMate) ? COLOR_MATE : COLOR_CHECK;
}
function winner(color){
	let el = document.getElementById("winner");

	if(color == "sdraw"){
		addElToMoves(color, `stalemate draw`);
		el.innerText = `Stalemate draw`;
	}else if(color == "resign"){
		addElToMoves(botColor, `Winner by resign: ${botColor}`);
		el.innerText = `Winner by resign: ${botColor}`;
	}else{
		addElToMoves(invertColor(color), `Winner: ${color}`);
		el.innerText = `Winner: ${color}`;
	}
	
	el.style.display = "block";

	clearInterval(timeInterval);

	toggleReplay(true);
}
function addElToMoves(color, text){
	let el = document.createElement("div");
	el.classList.add(color);
	el.classList.add("move-item");
	el.innerText = text;

	document.getElementById("moves").appendChild(el);
}
function clearMoves(){
	document.getElementById("moves").innerHTML = "";
}
function displaySimStats(movesChecked, ms){
	displayStats(`Simulated ${movesChecked} moves in ${(ms / 1000).toFixed(2)}s (${Math.round(movesChecked / (Math.floor(ms) / 1000))}/sec)`);
}
function displayStats(str){
	document.getElementById("stats").innerText = str;
}
function clearStats(){
	document.getElementById("stats").innerText = "";
}
function highlightSquare(x, y){
	removeSquareHighlight();

	let boardEl = document.getElementById("board");
	let text = document.createElementNS("http://www.w3.org/2000/svg", 'text');

	if(playerColor == "black"){
		text.classList.add("flip-piece");
	}

	text.classList.add("coord-text");
	text.setAttribute("id", "coordText");
	text.setAttribute("x", (y * SQUARE_WIDTH) + 2);
	text.setAttribute("y", (x * SQUARE_WIDTH) + 12);
	text.innerHTML = BOARD_LAYOUT[x][y];

	boardEl.appendChild(text);
}
function removeSquareHighlight(){
	let prevEl = document.getElementById("coordText");

	if(prevEl != null){
		prevEl.remove();
	}
}
function toggleReplay(v){
	// TODO: don't have the layout shift
	document.getElementById("replayContainer").style.display = (v) ? "flex" : "none";
}
function toggleResign(v){
	document.getElementById("resignContainer").style.display = (v) ? "flex" : "none";
}
function clearCaptures(){
	const ids = ["capture-l","capture-r"];

	for (let i = 0; i < ids.length; i++) {
		const id = ids[i]
		let els = document.getElementById(id).children;

		while (els.length != 0) {
			els[0].remove();
		}
	}

	captured = [[],[]];
}