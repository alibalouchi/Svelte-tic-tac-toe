<script>
    import {createEventDispatcher} from 'svelte'
    export let value;
    export let id;
    export let className;

    const dispatch = createEventDispatcher();

    const handleSquareClick = () => {
        dispatch('clicked', {
            id
        });
    }
</script>

<main>
    <div class={className ? "winner" : ""} on:click={handleSquareClick}>{value}</div>
</main>

<style>
    div {
        border: 1px solid black;
        width: 100px;
        height: 100px;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 45px;
    }

    div:hover {
        background-color: grey;
    }

    .winner {
        background-color: green;
    }
</style>