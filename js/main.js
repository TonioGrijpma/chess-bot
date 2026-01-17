const VERSION = "2.0.1"

const COLOR_HOVER = "#fbd287"
const COLOR_CAPTURE = "#f36969";
const COLOR_CASTLE = "rgb(209 90 209)";
const COLOR_PROMOTION = "#952495";
const COLOR_CHECK = "rgb(110, 110, 255)"
const COLOR_MATE = "rgb(37, 37, 255)"
const COLOR_PREV_MOVE = "rgb(255, 152, 0)"

const SQUARE_WIDTH = 60;
const BOARD_WIDTH = (SQUARE_WIDTH * 8) + 2;
const BOT_CHECK_DELAY = 100;				// delay at which the program checks if it can make a move
const TIME_UPDATE_DALAY = 250;				// interval in witch the timer will update
const REPLAY_SPEED = 1500;
const MOVE_MEMORY = 50;						// how many moves to remember to avoid repeated moves
const MAX_REPEAT = 1;						// how many times the bot is allowed to repeat the same move within it's memory
const ENDGAME_CYCLE_COUNT = 50;

const BOARD_LAYOUT = [
	["a8","b8","c8","d8","e8","f8","g8","h8"],
	["a7","b7","c7","d7","e7","f7","g7","h7"],
	["a6","b6","c6","d6","e6","f6","g6","h6"],
	["a5","b5","c5","d5","e5","f5","g5","h5"],
	["a4","b4","c4","d4","e4","f4","g4","h4"],
	["a3","b3","c3","d3","e3","f3","g3","h3"],
	["a2","b2","c2","d2","e2","f2","g2","h2"],
	["a1","b1","c1","d1","e1","f1","g1","h1"]
]

let playerColor = "white";
let botColor = "black";

let hasMoved = [false, false, false, false, false, false]	// keep track if the rooks & kings have moved for Castling
let clickedPiece = null;					// what piece has been clicked last
let movedCoords = {x: -1, y: -1};

let UIboard = [];							// grid with information for the UI
let	board = [];								// simplified grid of only numbers
let moveList = [];							// list af all moves made in a game
let cycleCount = 0;							// used to iterate movelist
let captured = [[],[]];						// keep track of captured pieces

let turnColor = "white"					 	// keep track of turns white | black
let finishedPromotion = true;				// keep track of the promotion popup
let promoteTo = "";							// what a piece will be promoted to, if empty the user can choose, bot automaticly selects the queen
let isBotWaiting = false;					// makes sure the robot waits the full move delay
let isHighlighting = false;					// this prevents highlights being cleared multiple times
let startTime = new Date().getTime();
let time = [0, 0];							// time in ms elapsed for each color
let timeInterval = null;					// interval that updates the playtime

let maxWorkerPool = window.navigator.hardwareConcurrency || 4;
let workerPool = new Array(maxWorkerPool);
let tree = [];
let botStartTime;
let workersDone = 0;
let workerBotMove;
let allMoves;
let movesChecked = 0;
let autoplay = false;
let treeDepth = 3;
let threadWork = [];
let lastMoves = [[], []]

document.addEventListener('DOMContentLoaded', init)

function init(){
	createUIBoard();
	initOptions();
	createInternalBoard();

	document.getElementById("threads").addEventListener("change", function(){
		maxWorkerPool = parseInt(this.value);
		if(maxWorkerPool <= 0){
			maxWorkerPool = 1;
			this.value = 1;
		}
		if(maxWorkerPool > 256){
			maxWorkerPool = 256;
			this.value = 256;
		}
		initWorkerPool()
	});

	initWorkerPool()

	if(playerColor == "black"){
		flipBoard();
	}

	createPromotionOverlay();
	colorLegend();
	setInterval(botCheck, BOT_CHECK_DELAY);
	startTimer();
	setVersion();
}

function initWorkerPool(){
	killWorkerPool();

	const threadsVisualEl = document.getElementById("threads-visual");
	document.getElementById("threads").value = maxWorkerPool;

	workerPool = new Array(maxWorkerPool);

	for (let i = 0; i < maxWorkerPool; i++){
		workerPool[i] = new Worker('js/bot/points_worker.js');

		workerPool[i].addEventListener('message', function(e) {
			const subTree = e.data[0]
			movesChecked += e.data[1]
			const fromMove = e.data[2]
			const treeWidth = tree[1].length;
			
			tree[2][fromMove] = subTree;

			threadWork.splice(threadWork.indexOf(fromMove), 1)

			updateThreadVisual();

			workersDone++;
			if(workersDone == treeWidth){
				minifyTree(tree, 0);

				for (let i = 0; i < treeDepth; i++) {
					traverseTree(tree, null, treeDepth - i, 0);
				}

				if(lastMoves[1].length > MOVE_MEMORY){
					lastMoves = [[],[]];
				}

				const treeIndexPair = tree[1].map((x,i) => [i,x[0]])
				treeIndexPair.sort(function(a,b){ 
					if(a[1] < b[1]){
						return 1;
					}
					if(a[1] > b[1]){
						return -1
					}
					return 0
				})

				// treeIndexPair sorted highest score first
				let countTried = 0;
				workerBotMove = allMoves[treeIndexPair[0][0]];
				checkRepeatedMoves()
				function checkRepeatedMoves(){
					// prevent callstack exception in rare case
					if(countTried > 50){
						workerBotMove = allMoves[Math.floor(Math.random() * allMoves.length)]
						return;
					}
					// the amount of times we have used this move
					const repeatCount = lastMoves[(botColor == "white" ? 0 : 1)].filter(oldMove => 
						oldMove.x == workerBotMove.x && oldMove.y == workerBotMove.y 
						&& oldMove.toX == workerBotMove.toX && oldMove.toY == workerBotMove.toY 
						&& oldMove.type == workerBotMove.type).length;

					// if we used it more then allowed, pick the next best move and check again
					if(repeatCount >= MAX_REPEAT){
						const len = allMoves.length - 1;
						const index = countTried > len ? countTried % len : countTried
						workerBotMove = allMoves[treeIndexPair[index][0]];
						countTried++;
						checkRepeatedMoves();
					}

				}

				lastMoves[(botColor == "white" ? 0 : 1)].push(workerBotMove)

				displaySimStats(movesChecked, performance.now() - botStartTime);

				removeHighlight(true);

				executeBotMove(board, workerBotMove, true)

				syncUI();

				isBotWaiting = false;

				endTurn();
			}
		}, false);
		
		workerPool[i].addEventListener('error', function(e) {
			console.error(e);
		}, false);

		workerPool[i].postMessage(["init"]);

		threadsVisualEl.appendChild(createThreadEl(i));
	}
}
function killWorkerPool(){
	for (let i = 0; i < workerPool.length; i++) {
		if(workerPool[i] != null){
			workerPool[i].terminate();
		}
	}

	workerPool = [];

	const threads = document.getElementById("threads-visual").children;
	while(threads.length != 0){
		threads[0].remove();
	}
}
function updateThreadVisual(){
	const threads = document.getElementById("threads-visual").children;
	for (let i = 0; i < threads.length; i++) {
		const element = threads[i];
		const id = parseInt(element.threadId)
		if(threadWork.includes(id)){
			element.innerHTML = `#${id}${id < 10 ? "&nbsp" : ""} busy`
			element.classList.add("thread-busy");
			element.classList.remove("thread-idle");
		}else{
			element.innerHTML = `#${id}${id < 10 ? "&nbsp" : ""} idle`
			element.classList.add("thread-idle");
			element.classList.remove("thread-busy");
		}
	}
}
function createThreadEl(number){
	let el = document.createElement("span");

	el.innerHTML = `#${number}${number < 10 ? "&nbsp" : ""} idle`
	el.threadId = number;
	el.classList.add("thread-idle");

	return el;
}

function minifyTree(tree, it){
    if(tree[2] == null){
        return;
    }

    for (let i = 0; i < tree[2].length; i++) {
        minifyTree(tree[2][i], it + 1)
    }

    tree.splice(1, 1);
}

function traverseTree(tree, node, target, it){
    if(target == 0){
        return;
    }

    if(it == target){
        node[1] = highest(node[1])
        node[0] = node[0] - node[1];
        node.splice(1,1);

        return;
    }

    if(node == null){
        node = tree;
    }
    for (let i = 0; i < node[1].length; i++) {
        if(node == null){
            traverseTree(tree, tree[1][i], target, it + 1)
        }else{
            traverseTree(tree, node[1][i], target, it + 1)
        }
    }
}
function highest(arr){
    let r = 0;

    for (let i = 0; i < arr.length; i++) {
        if(arr[i][0] > r){
            r = arr[i][0];
        }
    }

    return r;
}
function botCheck(){
	if(turnColor != botColor && !autoplay) return;

	if(isBotWaiting) return;

	if(!finishedPromotion) return;

	isBotWaiting = true;

	// if the endgame has begun assign the endgame PST to the king
	if(cycleCount > ENDGAME_CYCLE_COUNT){
		PST_B[5] = kie;
	}

	if(autoplay){
		botColor = invertColor(botColor);
	}else{
		botColor = invertColor(playerColor);
	}

	tree = [0];
	botStartTime = performance.now();
	allMoves = splitAllMoveSet(getAllMoves(board, botColor));

	if(allMoves.length == 0){
		return;
	}

	tree.push(allMoves, createBranch(board, allMoves, botColor));

	createTreeMulti(board, tree, botColor);
}
function createBranch(board, allMoves, color){
    let r = [];

    for (let i = 0; i < allMoves.length; i++) {
        let points = valueMove(board, allMoves[i], color, cycleCount);
        movesChecked++;
        r.push([points]);
    }

    return r;
}
function createTreeMulti(board, tree, color){
    for (let i2 = 0; i2 < tree[1].length; i2++) {
        const worker = workerPool[i2 % maxWorkerPool];

		threadWork.push(i2 % maxWorkerPool);

		let newBoard = deepCopyBoard(board);
		executeBotMove(newBoard, tree[1][i2], false);

        worker.postMessage(["buildTree", newBoard, 0, i2, tree, color, hasMoved, treeDepth, botColor, cycleCount]);
    }

	updateThreadVisual();
}
function endTurn(){
	syncUI(board);

	mateCheck(board, (turnColor == "black"));

	desyncCheck(board);

	updateTime();

	tree = [];
	botStartTime;
	workersDone = 0;
	workerBotMove = null;
	allMoves = null;
	movesChecked = 0;

	turnColor = (turnColor == "white") ? "black" : "white";
}
function startTimer(){
	timeInterval = setInterval(updateTime, TIME_UPDATE_DALAY);
}
function updateTime(){
	let curTime = new Date().getTime();

	time[(turnColor == "white") ? 0 : 1] += curTime - startTime;
	
	startTime = curTime;

	updateTimeEl();
}
function updateTimeEl(){
	let t = (turnColor == "white") ? "W" : "B";
	let timeInMs  = time[(turnColor == "white") ? 0 : 1];
	let ms = timeInMs % 1000;
	let sec = Math.floor((timeInMs / 1000) % 60);
	let min = Math.floor((timeInMs / (60 * 1000)) % 60);

	document.getElementById(`time${t}`).innerText = `${padNumber(min)}:${padNumber(sec)}:${padMiliseconds(ms)}`;
}
function padNumber(t){
	return (t < 10) ? "0" + t : t
}
function padMiliseconds(t){
	if(t < 10){
		return "00" + t
	}else if(t < 100){
		return "0" + t
	}

	return t;
}

function colorLegend(){
	let classes = [
		["color-move", COLOR_HOVER],
		["color-capture", COLOR_CAPTURE],
		["color-castle", COLOR_CASTLE],
		["color-promotion", COLOR_PROMOTION],
		["color-check", COLOR_CHECK],
		["color-mate", COLOR_MATE],
	];

	for (let i = 0; i < classes.length; i++) {
		let els = document.getElementsByClassName(classes[i][0]);

		for (let i2 = 0; i2 < els.length; i2++) {
			els[i2].style.color = classes[i][1];
			els[i2].style.borderColor = classes[i][1];
		}
	}
}
function flipBoard(){
	document.getElementById("board").classList.toggle("flip");

	let x = document.querySelectorAll(".piece");

	for (let i = 0; i < x.length; i++) {
		x[i].classList.toggle("flip-piece");
	}
}
function setVersion(){
	document.getElementById("footer").innerText += (` (js: ${VERSION})`)
}
function resign(){
	winner("resign");
	highlightKing((botColor == "black"), true, board);
	toggleResign(false);

	if(!moveList.includes("resign")){
		moveList.push("resign")
	}
}