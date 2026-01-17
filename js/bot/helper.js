function getAllMoves(board, color){
    let r = [];

    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            c(x, y);
        }
    }
    function c(x, y){
        const piece = board[x][y];

        if(piece == 6){
            return;
        }

        if(color == "black"){
            if(piece < 9){
                return;
            }
        }else{
            if(piece > 9){
                return;
            }
        }

        if(getKingLocation(false, board) == undefined || getKingLocation(true, board) == undefined){
            // TODO: should not happen
            return;
        }
        const moveSet = getMoveset(board, getTypeFromPieceInt(piece), x, y, true);

        // pawn being promoted
        if(moveSet.length == 0){
            return;
        }

        let hasoptions = false;
        for (let i = 0; i < moveSet.length; i++) {
            if(moveSet[i].length != 0){
                hasoptions = true;
                break;
            }
        }

        if(!hasoptions){
            return;
        }

        r.push({
            x: x, 
            y: y,
            moveSet: moveSet
        })
    }

    return r;
}
function splitAllMoveSet(moveset){
    let r = [];

    for (let i = 0; i < moveset.length; i++) {
        const sub = moveset[i].moveSet;

        for (let i2 = 0; i2 < sub.length; i2++) {
            if(i2 == 4){
                continue;
            }

            const moves = sub[i2];

            for (let i3 = 0; i3 < moves.length; i3++) {
                const move = moves[i3];
                r.push({
                    x: moveset[i].x, 
                    y: moveset[i].y, 
                    toX: move.x, 
                    toY: move.y, 
                    type: i2
                })
            }
        }
    }

    return r;
}
function canDoMove(board, fromX, fromY, toX, toY){
    let newBoard = deepCopyBoard(board);
    let white = newBoard[fromX][fromY] < 9;

    newBoard[toX][toY] = newBoard[fromX][fromY]
    newBoard[fromX][fromY] = 6;

    let checks = getCheckedPieces(newBoard, white)

    return checks.length == 0;
}
function canDoCastle(board, fromX, fromY, toX, toY){
    let newBoard = deepCopyBoard(board);
    let white = newBoard[fromX][fromY] < 9;

    // move the king to the end location so we don't overwrite it
    if(fromY == 0){
        newBoard[toX][toY - 1] = (white) ? 5 : 15
    }else{
        newBoard[toX][toY + 1] = (white) ? 5 : 15
    }

    return canDoMove(newBoard, fromX, fromY, toX, toY)
}
function deepCopyBoard(board){
    // JSON hack is obviously very slow
    // structuredClone also much slower

    const length = board.length,
    copy = new Array(length); // boost in Safari

    // deep copies of 2d arrays only have to be dealt with one level deep:
    // https://stackoverflow.com/a/13756775
    for (let i = 0; i < length; ++i){
        copy[i] = board[i].slice(0);
    }

    return copy;
}
function executeBotMove(board, m, save){
    switch (m.type) {
        case 0:
            move(board, m.x, m.y, m.toX, m.toY, save);
            break;
        case 1:
            capture(board, m.x, m.y, m.toX, m.toY, save);
            break;
        case 2:
            let promoteTo = (botColor == "black") ? 14 : 4
            promote(board, m.x, m.y, m.toX, m.toY, promoteTo, save);
            break;
        case 3:
            castle(board, m.x, m.y, save);
            break;
    }
}
function getTypeFromPieceInt(piece){
    let i = piece;

    if(piece > 9){
        i = piece - 10;
    }

    return i;
}

function desyncCheck(board){
    let visualBoard = minifyUIBoard();

    for (let x = 0; x < 8; x++) {
        for (let y = 0; y <8; y++) {
            if(visualBoard[x][y] != board[x][y]){
                logError(`UIboard desync on x:${x} y:${y}, attempting to resync`);
                board = minifyUIBoard();
            }
        }
    }
}

function pieceValue(board, x, y){
    let piece = board[x][y];
    piece = (piece > 9) ? piece -= 10 : piece;

    return PIECEWORTH[piece];
}

function invertColor(color){
    return (color == "white") ? "black" : "white";
}

function mateCheck(board, white){
    let colorString = (white) ? "white" : "black"
    let state = getState(board, colorString);

    switch (state) {
        case 0:
            return
        case 1:
            check(white, false, true);
            break;
        case 2:
            mate(colorString);
            break;
        case 3:
            mate("sdraw");
            break;
    }
}

// 0 = nothing,  1 = check, 2 = mate, 3 stalemate draw
function getState(board, color){
    let allChecks = getCheckedPieces(board, color == "white");
    let r = 0;

    if(allChecks.length > 0){
        r = 1;

        let allMoves = getAllMoves(board, color);
        
        if(allMoves.length == 0){
            if(allChecks.length == 0){
                r = 3
            }else{
                r = 2
            }
        }
    }
    
    return r;
}

function getCheckedPieces(board, white){
    let r = [];

    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            checkMoves(x, y);
        }
    }

    function checkMoves(x, y){
        const piece = board[x][y];

        if(piece == 6){
            return;
        }

        if(white){
            if(piece < 9){
                return;
            }
        }else{
            if(piece > 9){
                return;
            }
        }

        const moveSet = getMoveset(board, piece, x, y, false);

        // pawn being promoted
        if(moveSet.length == 0){
            return;
        }

        if(moveSet[4].length == 0){
            return;
        }

        r.push({x: x, y: y})
    }

    return r;
}
function getKingLocation(color, b){
    let kingNumber = (color) ? 5 : 15;

    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            if(b[x][y] == kingNumber){
                return [x,y];
            }
        }
    }
}