self.addEventListener('message', function(e) {
    const messageType = e.data[0];

    if(messageType == "init"){
        importScripts("algorithm_points.js");
        importScripts("pieceSquareTable.js");
        importScripts("helper.js");
        importScripts("../board/moveSet.js");
        importScripts("../board/board.js");
        return;
    }

    const board = e.data[1];
    const i = e.data[2];
    const i2 = e.data[3];
    const tree = e.data[4];
    const color = e.data[5];
    const maxTreeDepth = e.data[7];
    hasMoved = e.data[6];
    botColor = e.data[8];
    cycleCount = e.data[9];

    let movesTried = 0;

    let allMoves = splitAllMoveSet(getAllMoves(board, invertColor(color)));

    tree[2][i2].push(allMoves, createBranch(board, allMoves, invertColor(color)));

    createTree(board, tree[2][i2], i + 1, invertColor(color));

    self.postMessage([tree[2][i2], movesTried, i2]);

    function createTree(board, tree, i, color){
        if(i == maxTreeDepth){
            return;
        }

        for (let i2 = 0; i2 < tree[1].length; i2++) {
            let newBoard = deepCopyBoard(board);

            executeBotMove(newBoard, tree[1][i2], false);

            let allMoves = splitAllMoveSet(getAllMoves(newBoard, invertColor(color)));

            tree[2][i2].push(allMoves, createBranch(newBoard, allMoves, invertColor(color)));

            createTree(newBoard, tree[2][i2], i + 1, invertColor(color));
        }
    }
    function createBranch(board, allMoves, color){
        let r = [];

        for (let i = 0; i < allMoves.length; i++) {
            const score = valueMove(board, allMoves[i], color, cycleCount);
            movesTried++;
            r.push([score]);
        }

        return r;
    }
}, false)
