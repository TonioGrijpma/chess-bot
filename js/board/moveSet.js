const MOVE_PATTERN_KNIGHT = [{x: 1, y: 2}, {x: -1, y: 2},{x: 1, y: -2}, {x: -1, y: -2},{x: 2, y: 1}, {x: 2, y: -1},{x: -2, y: 1}, {x: -2, y: -1}];
const MOVE_PATTERN_KING = [{x: 1, y: 0}, {x: 0, y: 1},{x: 1, y: 1}, {x: -1, y: 0},{x: 0, y: -1}, {x: -1, y: -1},{x: -1, y: 1}, {x: 1, y: -1}];

function getMoveset(board, pieceType, x, y, moveCheck){
	const isWhite = board[x][y] < 9;
	
	let openPositions = [];
	let captureMoves = [];
	let promotion = [];
	let castle = [];
	let checks = [];

	pieceType = (pieceType > 9) ? pieceType -= 10 : pieceType;

	switch(pieceType){
		case 0: // pawn specific checks
			let checkX = x + ((isWhite) ? -1 : 1);
			let checkX2 = (isWhite) ? x - 1 : x + 1;

			if(checkX2 > -1 && checkX2 < 8){
				if(board[checkX2][y] == 6){
					// Promotion is mandatory; the pawn cannot remain as a pawn.
					if(checkX == ((isWhite) ? 0 : 7)){
						addToAr(promotion, checkX, y);
					}else{
						addToAr(openPositions, checkX, y);
					}
				}
			}

			if(x == ((isWhite) ? 6 : 1)){
				if(board[(isWhite) ? x - 2 : x + 2][y] == 6 && board[(isWhite) ? x - 1 : x + 1][y] == 6){
					addToAr(openPositions, x + ((isWhite) ? -2 : 2), y);
				}
			}

			// capture & promotion
			let checkY = y + ((isWhite) ? -1 : 1);
			checkX = x + ((isWhite) ? -1 : 1);

			pawnCheck();
			
			checkY = y + ((isWhite) ? 1 : -1);

			pawnCheck();

			function pawnCheck(){
				if(checkX < 0 || checkX > 7 || checkY < 0 || checkY > 7){
					return;
				}
				if(board[checkX][checkY] == 6){
					return;
				}

				if(isWhite){
					if(board[checkX][checkY] < 9){
						return;
					}
				}else{
					if(board[checkX][checkY] > 9){
						return;
					}
				}
				
				if(checkX == ((isWhite) ? 0 : 7)){
					if(isKing(checkX, checkY)){
						addToAr(checks, checkX, checkY);
					}else{
						addToAr(promotion, checkX, checkY);
					}
				}else{
					addToCaptureMoves(checkX, checkY);

					if(checkX == (isWhite) ? 0 : 7){
						addToAr(openPositions, checkX, checkY);
					}
				}
			}
			
			// https://sakkpalota.hu/index.php/en/chess/rules#pawn
			// TODO: check for EN PASSANT
			break;
		case 1: // rook specific checks
			for (let i2 = 1; i2 < 8; i2++) {	// down
				if(checkPath(x + i2, y)){
					break;
				}
			}
			for (let i2 = 1; i2 < 8; i2++) {	// right
				if(checkPath(x, y + i2)){
					if(board[x][y + i2] == 5 || board[x][y + i2] == 15){
						if(isWhite){
							if(hasMoved[0] || hasMoved[1]){
								break;
							}
						}else{
							if(hasMoved[3] || hasMoved[4]){
								break;
							}
						}

						addToAr(castle, (isWhite) ? 7 : 0, 4, true);
					}

					break;
				}
			}
			for (let i2 = 1; i2 < 8; i2++) {	// up
				if(checkPath(x - i2, y)){
					break;
				}
			}
			for (let i2 = 1; i2 < 8; i2++) {	// left
				if(checkPath(x, y - i2)){
					if(board[x][y - i2] == 5 || board[x][y - i2] == 15){
						if(isWhite){
							if(hasMoved[1] || hasMoved[2]){
								break;
							}
						}else{
							if(hasMoved[4] || hasMoved[5]){
								break;
							}
						}

						addToAr(castle, (isWhite) ? 7 : 0, 4, true);
					}

					break;
				}
			}
			break;
		case 2: // knight
			for (let i2 = 0; i2 < MOVE_PATTERN_KNIGHT.length; i2++) {
				checkPath(x + MOVE_PATTERN_KNIGHT[i2].x, y + MOVE_PATTERN_KNIGHT[i2].y)
			}
			break;
		case 3: // bishop
			for (let i2 = 1; i2 < 8; i2++) {
				if(checkPath(x + i2, y + i2)){
					break;
				}
			}
			for (let i2 = 1; i2 < 8; i2++) {
				if(checkPath(x - i2, y - i2)){
					break;
				}
			}
			for (let i2 = 1; i2 < 8; i2++) {
				if(checkPath(x - i2, y + i2)){
					break;
				}
			}
			for (let i2 = 1; i2 < 8; i2++) {
				if(checkPath(x + i2, y - i2)){
					break;
				}
			}
			break;
		case 4:
			for (let i2 = 1; i2 < 8; i2++) {
				if(checkPath(x + i2, y)){
					break;
				}
			}
			for (let i2 = 1; i2 < 8; i2++) {
				if(checkPath(x, y + i2)){
					break;
				}
			}
			for (let i2 = 1; i2 < 8; i2++) {
				if(checkPath(x - i2, y)){
					break;
				}
			}
			for (let i2 = 1; i2 < 8; i2++) {
				if(checkPath(x, y - i2)){
					break;
				}
			}
			for (let i2 = 1; i2 < 8; i2++) {
				if(checkPath(x + i2, y + i2)){
					break;
				}
			}
			for (let i2 = 1; i2 < 8; i2++) {
				if(checkPath(x - i2, y - i2)){
					break;
				}
			}
			for (let i2 = 1; i2 < 8; i2++) {
				if(checkPath(x - i2, y + i2)){
					break;
				}
			}
			for (let i2 = 1; i2 < 8; i2++) {
				if(checkPath(x + i2, y - i2)){
					break;
				}
			}
			break;
		case 5: // king
			let otherKing = getKingLocation(!isWhite, board);

			for (let i2 = 0; i2 < MOVE_PATTERN_KING.length; i2++) {
				if(!collidesWithKing(x + MOVE_PATTERN_KING[i2].x, y + MOVE_PATTERN_KING[i2].y, otherKing)){
					checkPath(x + MOVE_PATTERN_KING[i2].x, y + MOVE_PATTERN_KING[i2].y);
				}
			}

			function collidesWithKing(x, y, king){
				for (let i2 = 0; i2 < MOVE_PATTERN_KING.length; i2++) {
					if(x == (king[0] + MOVE_PATTERN_KING[i2].x) && y == (king[1] + MOVE_PATTERN_KING[i2].y)){
						return true;
					}
				}

				return false;
			}
			break;
	}

	function checkPath(checkX, checkY){
		if(checkX < 0 || checkX > 7 || checkY < 0 || checkY > 7){
			return false;
		}

		if(board[checkX][checkY] == 6){
			addToAr(openPositions, checkX, checkY);
		}else{
			if(isWhite){
				if(board[checkX][checkY] > 9){
					addToCaptureMoves(checkX, checkY);
				}
			}else{
				if(board[checkX][checkY] < 10){
					addToCaptureMoves(checkX, checkY);
				}
			}
			return true;
		}
	}

	function addToCaptureMoves(toX, toY){
		if(isKing(toX, toY)){
			addToAr(checks, toX, toY);
		}else{
			addToAr(captureMoves, toX, toY);
		}
	}
	function addToAr(ar, toX, toY, isCastle = false){
		if(moveCheck){
			if(isCastle){
				if(canDoCastle(board, x, y, toX, toY)){
					ar.push({x: toX, y: toY})
				}
			}else{
				if(canDoMove(board, x, y, toX, toY)){
					ar.push({x: toX, y: toY})
				}
			}
		}else{
			ar.push({x: toX, y: toY})
		}
	}
	function isKing(x, y){
		return board[x][y] == 5 || board[x][y] == 15
	}

	return [openPositions, captureMoves, promotion, castle, checks];
}
function getMovesetFromObject(piece){
	return getMoveset(board, pieceNameToInt(piece.name), piece.row, piece.col, true);
}