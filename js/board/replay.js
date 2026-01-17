function replayMatch(){
    let el = document.getElementById("winner");
    let isDone = false;

	el.style.display = "none";

    isBotWaiting = true;

    clearStats();
    clearMoves();
    removeImages();
	createInternalBoard();
    removeHighlight(true);
    toggleReplay(false);
    toggleResign(false);
    clearCaptures();

    turnColor = "white";

	if(playerColor == "black"){
		flipBoard();
	}

    for (let i = 0; i < moveList.length; i++) {
        const move = moveList[i];
        setTimeout(function() {
            if(move == "resign"){
                resign();
                isDone = true;
                return;
            }

            board[move[1][0]][move[1][1]] = board[move[0][0]][move[0][1]]
            board[move[0][0]][move[0][1]] = 6;

            movePiece(move);
            removeHighlight(true);
            mateCheck(board, (turnColor == "black"));

            if(i == moveList.length - 1){
                isDone = true;
                return;
            }

            if(moveList[i + 1] == "resign"){
                return
            }

            let newColor = (board[moveList[i + 1][0][0]][moveList[i + 1][0][1]] < 9) ? "white" : "black";
            turnColor = newColor;
        }, (i * REPLAY_SPEED) + REPLAY_SPEED);
    }

    let interval = setInterval(function(){
        if(isDone){
            clearInterval(interval);
            toggleReplay(true);
        }
    }, 500)
}
function removeImages(){
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            const p = UIboard[x][y];
            if(p.element != null){
                p.element.remove();
            }
        }
    }
}