// gives each possible move a value based on conditions
// the best moves of each side are substracted, the highest value left will be the best move

// pawn, rook, knight, bishop, queen ,king
const PIECEWORTH = [1, 5, 3, 3, 9, 0]		// capture worth of the pieces
const ST_VALUE_SCALE = 200                  // lower values make more use of ST

// scores for a move
const SCORE_CHECK = 0.2;
const SCORE_MATE = Infinity;
const SCORE_STALEMATE = -10;
const SCORE_PROMOTION = 15;
const SCORE_CASTLE = 5;
const PIECE_CAPTURE_MODIFIER = 1;

// scores for potential moves after we have made a move
const SCORE_POTENTIAL_CHECK = 0.2;
const SCORE_POTENTIAL_PROMOTION = 15;
const SCORE_POTENTIAL_CASTLE = 5;
const POTENTIAL_CAPTURE_MULTIPLIER = 5; // potentialValue = PIECEWORTH / this value

const SCORE_EARLY_PAWN_MULTI = 1;
const SCORE_EARLY_KNIGHT_MULTI = 1;
const SCORE_EARLY_BISHOP_ROOK = 1;
const CLUMP_MODIFIER = -0.05                // this score will be substracted for every one of your own pieces that surround you
const CHECK_POTENTIAL_MOVES = true;         // false = skip the potential moves step
const BOARD_SCORE_OPPONENT_MULIPLIER = 1;
const PERCENTAGE_LOSS_BASE = 1;             // punish a loss more if we have less pieces, higer is more

// move has NOT been executed yet
function valueMove(board, move, color, cycleCount){
    let p = 0;
    let fromX = move.x;
    let fromY = move.y;
    let toX = move.toX;
    let toY = move.toY;

    let newBoard = deepCopyBoard(board);
    executeBotMove(newBoard, move, false);

    // 0 = nothing, 1 = check, 2 = mate, 3 stalemate draw
    let state = getState(newBoard, invertColor(color));

    p += getSTValue(toX, toY, getTypeFromPieceInt(board[fromX][fromY]), color, ST_VALUE_SCALE);
    p += boardClumpScore(newBoard, color) / 5;

    // difference between the two players based on pieceworth
    // a loss from yourself can be punished slightly more to discourage trading
    const pieceScore = totalPieceScore(newBoard);
    if(color == "white"){
        p += (pieceScore[0] - (pieceScore[1] * BOARD_SCORE_OPPONENT_MULIPLIER)) / 5
    }else{
        p += (pieceScore[1] - (pieceScore[0] * BOARD_SCORE_OPPONENT_MULIPLIER)) / 5
    }

    // in early game prioritize knight, bishop & pawns
    if(cycleCount < 8){
        p = calcEarlygamePoints(getTypeFromPieceInt(board[fromX][fromY]), p);
    }

    // 0 = move, 1 = capture, 2 = promotion, 3 = castle, 4 = check;
    switch (move.type) {
        case 0:
            p += CHECK_POTENTIAL_MOVES ? (calcOptions(newBoard, toX, toY) / 20) : 0;
            break;
        case 1:
            const val = pieceValue(board, toX, toY) * PIECE_CAPTURE_MODIFIER;
            const percentage = val / pieceScore[color == "white" ? 0 : 1]
            p += val
            p += PERCENTAGE_LOSS_BASE * percentage
            break;
        case 2: // promotion
            p += SCORE_PROMOTION
            break;
        case 3: // castle
            p += SCORE_CASTLE;
            break;
        case 4: //check
            p += SCORE_CHECK;
            break;
    }

    switch (state) {
        case 1:
            p += SCORE_CHECK
            break;
        case 2:
            p += SCORE_MATE;
            break;
        case 3:
            p += SCORE_STALEMATE;
            break;
    }

    newBoard = null;

    return p
}

function calcOptions(board, x, y){
    let r = 0;
    const allmoves = getMoveset(board, getTypeFromPieceInt(board[x][y]), x, y, false);

    for (let i = 0; i < allmoves.length; i++) {
        const moveSet = allmoves[i];
        for (let i2 = 0; i2 < moveSet.length; i2++) {
            const move = moveSet[i2];
            
            if(i == 1){ // capture
                r += (pieceValue(board, move.x, move.y) / POTENTIAL_CAPTURE_MULTIPLIER);
            }
            if(i == 2){ // promotion
                r += SCORE_POTENTIAL_PROMOTION;
                continue;
            }
            if(i == 3){ // castle
                r += SCORE_POTENTIAL_CASTLE;
                continue;
            }
            if(i == 4){ // check
                r += SCORE_POTENTIAL_CHECK;
                continue;
            }
        }
    }

    return r
}
function calcEarlygamePoints(type, p){
    if(p < 0){
        return p;
    }
    switch (type) {
        case 0: // pawn
            return (p *= SCORE_EARLY_PAWN_MULTI);
        case 2: // knight
            return (p *= SCORE_EARLY_KNIGHT_MULTI);
        case 3: // bishop
            return (p *= SCORE_EARLY_BISHOP_ROOK);
        default:
            return p;
    }
}
function totalPieceScore(board){
    let whiteScore = 0;
    let blackScore = 0;

    for (let i = 0; i < board.length; i++) {
        for (let i2 = 0; i2 < board[i].length; i2++) {
            if(board[i][i2] == 6){
                continue;
            }

            const value = pieceValue(board, i, i2);

            if(board[i][i2] < 6){
                whiteScore += value
            }else{
                blackScore += value
            }
        }
    }

    return [whiteScore, blackScore]
}
function boardClumpScore(board, color){
    const isWhite = color == "white"
    const pawn = isWhite ? 0 : 10;
    const checkMap = [[1, 0], [1, 1], [0, 1], [-1, 0], [-1, -1], [0, -1], [1, -1], [-1, 1]]
    let r = 0;

    for (let i = 0; i < board.length; i++) {
        for (let i2 = 0; i2 < board[i].length; i2++) {
            const piece = board[i][i2];

            if(piece == pawn || piece == 6){
                continue;
            }

            if(i > 0 && i < 7){
                if(i2 > 0 && i2 < 7){
                    if(isWhite){
                        if(i == 6 || i == 7){
                            r += CLUMP_MODIFIER; // move off the starting line
                        }

                        for (let i3 = 0; i3 < checkMap.length; i3++) {
                            const boardPiece = board[i + checkMap[i3][0]][i2 + checkMap[i3][1]];
                            if(boardPiece != 6 && boardPiece < 9 && boardPiece != pawn){
                                r += CLUMP_MODIFIER;
                            }
                        }
                    }else{
                        if(i == 0 || i == 1){
                            r += CLUMP_MODIFIER;
                        }

                        for (let i3 = 0; i3 < checkMap.length; i3++) {
                            const boardPiece = board[i + checkMap[i3][0]][i2 + checkMap[i3][1]];
                            if(boardPiece != 6 && boardPiece > 9 && boardPiece != pawn){
                                r += CLUMP_MODIFIER;
                            }
                        }
                    }
                }
            }
        }
    }

    return r;
}