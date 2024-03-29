let checkedSquare = null;

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