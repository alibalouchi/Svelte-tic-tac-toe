<script>
	import Square from '../components/Square.svelte';
	import {checkWiner} from '../services/services.js';
	let xTurn = false;
	let board = Array(9).fill(null)

	const handleClick = (event) => {
		let id = event.detail.id;
		if (board[id]) return ;
		board[id] = xTurn ? "X" : "O";
		xTurn = !xTurn
		let winner = checkWiner(board)
		if (winner){
			winner == "D" ? alert("Draw") : alert(`${winner} has won the game`);
			board = Array(9).fill(null)
		}
	}
</script>
<main>
	<div class="row">
		<Square on:clicked={handleClick} id="0" value={board[0] ? board[0] : ""} />
		<Square on:clicked={handleClick} id="1" value={board[1] ? board[1] : ""} />
		<Square on:clicked={handleClick} id="2" value={board[2] ? board[2] : ""} />
	</div>
	<div class="row">
		<Square on:clicked={handleClick} id="3" value={board[3] ? board[3] : ""} />
		<Square on:clicked={handleClick} id="4" value={board[4] ? board[4] : ""} />
		<Square on:clicked={handleClick} id="5" value={board[5] ? board[5] : ""} />
	</div>
	<div class="row">
		<Square on:clicked={handleClick} id="6" value={board[6] ? board[6] : ""} />
		<Square on:clicked={handleClick} id="7" value={board[7] ? board[7] : ""} />
		<Square on:clicked={handleClick} id="8" value={board[8] ? board[8] : ""} />
	</div>
</main>

<style>
	.row {
		display: flex;
		flex-direction: row;
	}
</style>
