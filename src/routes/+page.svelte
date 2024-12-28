<script lang="ts">
    import axios from "axios";

    let username:string;

    let promptInput:string;

    let score:number = 0;

    let scoreboard:any[] = [];

    export let daily = "FRIED EGG".split("");

    axios.get('/api/word').then((res) => {
        daily = res.data.split("");;  // If response is a string, x will be the string value
        //console.log(daily);  // Outputs the string, for example: "Test Word"
        //daily = "FRIED EGG".split("");
    })
    .catch((error) => {
        console.error('Error fetching data:', error);
    });

    axios.get('/api/scoreboard').then((res) => {
        scoreboard = res.data;
        //console.log(res.data);  // Outputs the string, for example: "Test Word"
    })
    .catch((error) => {
        console.error('Error fetching scoreboard:', error);
    });

    export let rows = [
        "QWERTYUIOP".split(""),
        "ASDFGHJKL".split(""),
        "ZXCVBNM".split(""),
    ];

    export let nope:string[] = [];

    export let fooble:string[][] = [
        [],
        [],
        [],
        [],
        [],
        [],
    ];
    
    export let line = 0;
    export let playing = true;

    export let onKeyPress = (letter:string) => {
        fooble[line].push(letter);
        //console.log(fooble[line]);
        fooble = fooble;
    };

    export let onDel= () => {
        fooble[line].pop();
        //console.log(fooble);
        fooble = fooble;
    };

    export let onGo = () => {
        let canWin = true;
        daily.forEach((x,i) => {
            if(x != fooble[line][i]) canWin = false;
        });

        fooble[line].forEach((x,i) => {
            if(!daily.includes(x) && !nope.includes(x)) nope.push(x);
        });

        nope = nope;
        //console.log(nope);

        if(canWin){
            console.log("WINNER!")
            score = daily.length*100*(6-line); //INCLUDES BONUS COMPLETION SCORE OF EXTRA LINE
            console.log(score);
            for(let l = 0; l <= line; l++){
                fooble[l].forEach((s,i) =>{
                    if(i >= daily.length){
                        score = score - 100;
                        console.log("-100", l, s, i);
                    }else if(!daily.includes(s)){
                        score = score;
                        console.log("0", l, s, i);
                    }else if(s == daily[i]){
                        score = score + 100;
                        console.log("+100", l, s, i);
                    }else if(checkOthers(s,l,i)){
                        score = score + 50;
                        console.log("+50", l, s, i);
                    }                 
                });
            }
            line = line + 1;
            playing = false;
            let data = {
                "username": username,
                "line": line,
                "score": score,
            }
            axios.post('/api/score', data).then((res) => {
                console.log(res.data);
            })
            .catch((error) => {
                console.error('Error fetching data:', error);
            });
        }else{
            line = line + 1;
            console.log("Try Again");
        };
    };

    function checkOthers(s:string,l:number, i:number):Boolean{
        // Find all indices of 's' in 'daily'
        let indices: number[] = daily.reduce((acc: number[], value: string, index: number) => {
            if (value == s) acc.push(index);
            return acc;
        }, []);

        //let total = indices.length;
        //indices = indices.filter(index => index !== i && index <= fooble[l].length);

        let findices: number[] = fooble[l].reduce((acc: number[], value: string, index: number) => {
            if (value == s) acc.push(index);
            return acc;
        }, []);

        const newind = indices.filter(value => !findices.includes(value));
        const newfind = findices.filter(value => !indices.includes(value));

        if(newind.length <= 0) return false;
        
        let yellow = newfind.slice(0, newind.length);
        
        if(yellow.includes(i)) return true;
        
        // for (const [c, index] of indices.entries()) {
        //     if (c > newind.length) return false;
        //     if (daily[index] !== fooble[l][index]) {
        //         return true;
        //     }
        // }

        return false;
    };

    export let getColor:(l: number, i: number, s: string) => string = (l, i, s) => {
        //console.log(l, i, s);
        if(l >= line) return("cube");
        if(i >= daily.length) return("cube black");
        if(!daily.includes(s)) return("cube grey");
        if(s == daily[i]) return("cube green");
        if(checkOthers(s,l,i)) return("cube yellow");
        return("cube grey")
    };

</script>

{#if username === undefined}
    <div class="fullscreen-prompt">
        <div class="prompt-content">
            <h1 class="prompt-text">Your Username</h1>
            <input
                type="text"
                maxlength="16"
                placeholder="INPUT NAME HERE"
                bind:value={promptInput}
                class="prompt-input"
            />
            <button disabled={promptInput == undefined || promptInput.length < 3} class="prompt-input" on:click={() => username = promptInput}>
                ENTER
            </button>
        </div>
    </div>
{/if}


<h1>FOOBLE BETA</h1>

{#if username != undefined}
    <div class="body">
        <h2>Good Luck {username}!</h2>
    </div>
{/if}

<div class="entries">
    {#each fooble as foob, index}
        <div class="line">
            {#each Array(10).fill(0).map((_, i) => i) as i}
                <div class={(foob[i] ? getColor(index, i, foob[i]) : "cube")} >
                    {(foob[i] ? foob[i]: null)}
                </div>
            {/each}
        </div>
    {/each}
</div>

{#if !playing}
    <h1>You Did it! Score:{score}</h1>
{/if}

<div class="keyboard">
    {#each rows as row}
        <div class="row">
            {#each row as letter}
                <button class="key" disabled={!playing || nope.includes(letter)} on:click={() => onKeyPress(letter)}>
                    {letter}
                </button>
            {/each}
        </div>
    {/each}
        <div class="row overgap">
            <button class="key grow" disabled={!playing} on:click={() => onDel()}>Delete</button>
            <button class="key grow" disabled={!playing || nope.includes(" ")} on:click={() => onKeyPress(" ")}>Space</button>
            <button class="key grow" disabled={!playing} on:click={() => onGo()}>Submit</button>
        </div>
</div>

<p>
    Rules: Find the Food of the Day! Spelling is not Checked, Squares turn black taking away points when your guess is longer than the Answer, and Spaces may be necessary.
</p>

<h2>Daily High Scores</h2>
<div>
    <div class='scoreTile underline'>
        <div class="username">Player</div>
        <div class="score">Try</div>
        <div class="score">Score</div>  
    </div>
    {#each scoreboard as sc}
        <div class='scoreTile'>
            <div class="username">{sc.username}</div>
            <div class="score">{sc.line}</div>
            <div class="score">{sc.score}</div>  
        </div>
    {/each}
</div>


<style>

    h1,h2,p, .scoreTile{
        font-family: "Roboto", sans-serif;
        text-align: center;
        color: white;
    }

    .keyboard {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .row {
        display: flex;
        justify-content: center;
        gap: 6px;
    }
    .key {
        height: 9vw;
        width: 9vw;
        padding: 2vw;
        border: 1px solid #ccc;
        border-radius: .5vw;
        text-align: center;
        cursor: pointer;
        user-select: none;
        font-size: 5vw;
        display: flex;
        justify-content: center; /* Horizontal alignment */
        align-items: center; 
        font-family: "Roboto", sans-serif;
    }
    .entries{
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 5vh;
    }
    .line {
        display: flex;
        justify-content: center;
        gap: 2px;
    }
    .grow {
        flex-grow: 1;
    }
    .cube {
        height: 9vw;
        width: 9vw;
        background-color: #eeeeee75;
        border: 2px solid #ccc;
        cursor: pointer;
        user-select: none;
        display: flex;
        justify-content: center; /* Horizontal alignment */
        align-items: center; 
        font-family: "Roboto", sans-serif;
        font-weight: 900;
        font-size: 5vw;
    }
    .scoreTile {
        display: flex;
        flex-direction: row;
        width: 80vw;
        max-width: 12em;
        justify-self: center;
    }
    .score {
        flex-grow: 1;
        text-align: right;
    }
    .username {
        flex-grow: 3;
        text-align: left;
    }
    .underline {
        border-bottom: 2px solid #ccc;
    }
    .key:hover {
        background-color: #ccc;
    }
    .grey {
        background-color: grey;
    }
    .black {
        background-color: black;
    }
    .green {
        background-color: green;
    }
    .yellow {
        background-color: yellow;
    }

    .fullscreen-prompt {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.7); /* Semi-transparent background */
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000; /* Ensure it's on top of other elements */
    }

    .prompt-content {
        background: white;
        width: 80vw;
        padding: 2rem;
        border-radius: 10px;
        text-align: center;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .prompt-text {
        color: rgb(55, 83, 124);
    }

    .prompt-input {
        color: rgb(55, 83, 124);
        border:1px solid rgb(55, 83, 124);
        margin-bottom: 1rem;
        padding: 0.5rem 1rem;
        border-radius: 5px;
        cursor: pointer;
        min-width: 50vw;
    }

    .overgap {
        padding-top: 2rem;
    }

</style>




