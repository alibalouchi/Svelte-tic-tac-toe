<script>
    import {createEventDispatcher} from 'svelte'
    export let value;
    export let id;

    const dispatch = createEventDispatcher();

    const handleSquareClick = () => {
        dispatch('clicked', {
            id
        })
    }
</script>

<main>
    <div on:click={handleSquareClick}>{value}</div>
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
</style>