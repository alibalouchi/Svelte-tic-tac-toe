<script>
	import Square from '../components/Square.svelte';
	import {checkWinner} from '../services/services.js';
	let xTurn = false;
	let board = Array(9).fill(null)
	let indexes = checkWinner(board)
	let winColor = Array(9).fill(false)

	const handleClick = (event) => {
		let id = event.detail.id;
		if (board[id]) return ;
		if (winColor.find(item => item == true)) return;
		board[id] = xTurn ? "X" : "O";
		xTurn = !xTurn
		indexes = checkWinner(board)
		indexes.map(item => winColor[item] = true)
	}

	const handleReset = () => {
		board = Array(9).fill(null);
		winColor = Array(9).fill(false);
	}
</script>
<main>
<div class="container">
	<div class="row">
		<Square className={winColor[0]} on:clicked={handleClick} id="0" value={board[0] ? board[0] : ""} />
		<Square className={winColor[1]} on:clicked={handleClick} id="1" value={board[1] ? board[1] : ""} />
		<Square className={winColor[2]} on:clicked={handleClick} id="2" value={board[2] ? board[2] : ""} />
	</div>
	<div class="row">
		<Square className={winColor[3]} on:clicked={handleClick} id="3" value={board[3] ? board[3] : ""} />
		<Square className={winColor[4]} on:clicked={handleClick} id="4" value={board[4] ? board[4] : ""} />
		<Square className={winColor[5]} on:clicked={handleClick} id="5" value={board[5] ? board[5] : ""} />
	</div>
	<div class="row">
		<Square className={winColor[6]} on:clicked={handleClick} id="6" value={board[6] ? board[6] : ""} />
		<Square className={winColor[7]} on:clicked={handleClick} id="7" value={board[7] ? board[7] : ""} />
		<Square className={winColor[8]} on:clicked={handleClick} id="8" value={board[8] ? board[8] : ""} />
	</div>
	<button on:click={handleReset}>Reset The Game</button>
	</div>
</main>

<style>
	.row {
		display: flex;
		flex-direction: row;
	}

	.winner {
		background-color: green;
	}

	button {
		margin: 50px;
	}

	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
</style>
