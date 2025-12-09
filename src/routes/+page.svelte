<script lang="ts">
    import { onMount } from 'svelte';
    import axios from "axios";

    let authAPI = "https://authserver.paradisbend.com"

    let username:string = '';

    let userAuth = {hasAuth: false};

    let anonymous = true; 
    let signup = false;
    let help = false;

    let endKnown = false;

    let checkGo = false;

    let showRules = false;

    let start:boolean = false;

    let promptInput:string = "";
    let password:string = "";
    let message:string;
    let vpass:string = "";
    let email:string = "";

    let score:number = 0;
    let streak:number = 0;

    let scoreboard:any[] = [];
    let pscoreboard:any[] = [];

    export let daily = "FRIED EGG".split("");

    async function gameSetup(){
        await axios.get('/api/word').then((res) => {
            daily = res.data.split("");;  // If response is a string, x will be the string value
            //console.log(daily);  // Outputs the string, for example: "Test Word"
            //daily = "FRIED EGG".split("");
        })
        .catch((error) => {
            if(error.code != 'ERR_INVALID_URL') console.error('Error fetching data:', error);
        });

        let cacheData = localStorage.getItem('gameState');
        let cacheGame = cacheData ? JSON.parse(cacheData) : { 
            daily: ['N','A'],
        };
        if(cacheGame.daily.join('') == daily.join('') ){
            fooble = cacheGame.fooble;
            line = cacheGame.line;
            playing = cacheGame.playing;
            win = cacheGame.win;
            nope = cacheGame.nope;
            if(!playing) score = cacheGame.score;
        };
        //console.log(cacheGame.daily.join(''), daily.join(''));
    }


     async function onSignup(uname) {
        username = uname
        try {
        const res = await axios.post(`${authAPI}/signup`, {
            username,
            email,
            password
        });
        signup = false;
        message = res.data.message;
        } catch (err) {
        message = err.response?.data?.error || "Signup failed";
        }
    }
    
    async function onLogin(uname) {
        username = uname
        try {
            const res = await axios.post(`${authAPI}/login`, {
                username,
                password
            });

            // Save tokens
            localStorage.setItem("accessToken", res.data.accessToken);
            localStorage.setItem("refreshToken", res.data.refreshToken);

            userAuth.accessToken = res.data.accessToken;
            userAuth.hasAuth = true;

            message = "Logged in!";

            const streakRes = await axios.post('/api/streak', { username }, {
                validateStatus: () => true
            });

            if (streakRes.status === 200) streak = Number(streakRes.data.streak);

            onEnter(username)
        } catch (err) {
            message =  err.response?.data?.error || "Login failed";
        }
    }

   async function authCheck(setup = false) {
        // 1. Protected request (never throws for HTTP errors)
        const res = await axios.get(`${authAPI}/protected`, {
            headers: { Authorization: "Bearer " + userAuth.accessToken },
            validateStatus: () => true
        });

        //console.log(res);
        let success = (res.status === 200);

        if (res.status === 401 || res.status === 403) {
            const refresh = await axios.post(`${authAPI}/refresh`, {token: localStorage.getItem("refreshToken")}, {
                validateStatus: () => true
            });

            if (refresh.status === 200) {
                const newAccess = refresh.data.accessToken;
                localStorage.setItem("accessToken", newAccess);
                userAuth.accessToken = newAccess;
                success = true
            }else{
                message = 'Session Expired!'
                onLogout();
                console.log(refresh);
            }
        }

        if(success){
            console.log(res.data)
            userAuth.username = res.data.user?.username || '';
            userAuth.hasAuth = true;
            username = userAuth.username;

            const streakRes = await axios.post('/api/streak', { username }, {
                validateStatus: () => true
            });

            if (streakRes.status === 200) streak = Number(streakRes.data.streak);
        }

        if (setup) gameSetup();
    }

    async function onReVer() {
        try {
        const res = await axios.post(`${authAPI}/reverify`, {
            email,
        });
        message = res.data.message;
        } catch (err) {
        message = err.response?.data?.error || "Verification failed";
        }
    }

    async function onNewPass() {
        try {
        let newPassword = password
        const res = await axios.post(`${authAPI}/request-reset`, {
            email,
            newPassword
        });
        message = res.data.message;
        } catch (err) {
        message = err.response?.data?.error || "Password Reset failed";
        }
    }

    function onLogout(){
        localStorage.setItem("accessToken", null);
        localStorage.setItem("refreshToken", null);
        userAuth = {}
        userAuth.hasAuth = false;
        username = ''
        promptInput = username;
    }

    axios.get('/api/scoreboard').then((res) => {
        scoreboard = res.data.today;
        pscoreboard = res.data.prev;
        //console.log(res.data);  // Outputs the string, for example: "Test Word"
    })
    .catch((error) => {
        if(error.code != 'ERR_INVALID_URL') console.error('Error fetching scoreboard:', error);
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
    export let win = true;

    let onEnter = (pI:string) => {
        username = pI;
        localStorage.setItem('username', username);
        start = true;
    };

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

    export let goCheck = () =>{
        if(fooble[line].length == daily.length) {
            onGo();
        }else{
            checkGo = true;
        }
    };

    export let okayGo = () =>{
        checkGo = false;
        onGo();
    }

    export let onGo = () => {
        let gameOver = true;
        daily.forEach((x,i) => {
            if(x != fooble[line][i]) gameOver = false;
        });

        fooble[line].forEach((x,i) => {
            if(!daily.includes(x) && !nope.includes(x)) nope.push(x);
        });

        nope = nope;
        //console.log(nope);
        if(line == 5 && !gameOver) {
            gameOver = true;
            win = false;
        }

        if(gameOver){
            
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
            if(win) score = Math.round(score*(1+((5*(6-line))/100)));
            if(win) streak = streak + 1;
            score = score + streak;
            line = line + 1;
            playing = false;
            let data = {
                "username": username,
                "line": win ? line : null,
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
        let gameState = {
            'fooble': fooble,
            'line': line,
            'playing': playing,
            'daily': daily,
            'nope' : nope,
            'win' : win,
            'score' : score
        } 
        localStorage.setItem('gameState', JSON.stringify(gameState));
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
        if(i >= daily.length) {
            endKnown = true;
            return("cube black");
        }
        if(!daily.includes(s)) return("cube grey");
        if(s == daily[i]) return("cube green");
        if(checkOthers(s,l,i)) return("cube yellow");
        return("cube grey")
    };

    onMount(() => { 
        username = localStorage.getItem('username') || '';
        userAuth.accessToken = localStorage.getItem('accessToken') || null;

        if(userAuth.accessToken !== null && userAuth.accessToken.length > 4) {
            authCheck(true);
        } else {
            if(username.length > 2) promptInput = username;
            gameSetup();
        }
    });

</script>

{#if start === false}
    <div class="fullscreen-prompt">
        <div class="prompt-content">
            <div class="footer">
                <img style="height: 1.5em; margin: 1.7em 2px 2px 2px" src="/PBS_LOGO_NT.svg" alt="LOGO"/>
                <h1 class="prompt-text">FOOBLE</h1>
            </div>

            <p class="prompt-text">
           	Welcome! And Happy Holidays! This is a Foo-Bar Wordle-like game. Through the holiday season there will be a pool of Christmas themed words. Feel free to share and challenge your friends to beat your score each day!  Create an account and login to build streak bonus points!
	     </p>

            <button class="prompt-input" on:click={()=> showRules = !showRules}>
                {#if showRules} 
                    <p class="prompt-text">
                        Rules: Solve the daily puzzle! Spelling is not checked. Squares turn black resulting in lost points when your guess is longer than the answer.  Spaces may be necessary.<br>
                        Green: +100<br>
                        Yellow: +50<br>
                        Black: -100<br>
                        Grey: 0 <br>
                        Streak Bonus Points: Get bonus points equal to the length of your current streak!
                    </p>
                {:else}
                    <div class="prompt-text">Touch Here to See Rules</div>
                {/if}
                </button>

            {#if !userAuth.hasAuth}
                <button class='prompt-input' on:click={()=> anonymous = !anonymous}>
                    <h1 class="prompt-text">{anonymous ? 'Click for Login' : 'Play with #Username'}</h1>
                </button>
            {/if}

            {#if anonymous && !userAuth.hasAuth}
                <input
                    type="text"
                    maxlength="12"
                    placeholder="INPUT NAME HERE"
                    bind:value={promptInput}
                    class="prompt-input"
                />
                <button disabled={promptInput == undefined || promptInput.length < 3} class="prompt-input prompt-button" on:click={() => onEnter('#' + promptInput.replace(/[^A-Za-z0-9]/g, ""))}>
                    ENTER
                </button>
            {:else if userAuth.hasAuth}
                <button class="prompt-input prompt-button" on:click={() => onLogout()}>
                    Logout
                </button>
                <button class="prompt-input prompt-button" on:click={() => onEnter(userAuth.username)}>
                    Play as {userAuth.username}
                </button>
                <h4 style="color: rgb(40,60,80)">{streak > 0 ? `${streak} Day Streak!`: null}</h4>
            {:else}
                <button class='prompt-input' on:click={() => {signup = !signup; help = false}}>
                    <b style="color: rgb(40,60,80)">{ signup ? 'Go to Login!' : 'Sign Up!'}</b>
                </button>

                <input
                    type="text"
                    maxlength="12"
                    placeholder="INPUT USERNAME"
                    bind:value={promptInput}
                    class="prompt-input"
                />
                <input
                    type="password"
                    maxlength="24"
                    placeholder="PASSWORD"
                    bind:value={password}
                    class="prompt-input"
                />
                {#if signup}
                    <input
                        type="password"
                        maxlength="24"
                        placeholder="CONFIRM PASSWORD"
                        bind:value={vpass}
                        class={password == vpass ? "prompt-input" : "rborder prompt-input"}
                    />
                    <input
                        type="text"
                        maxlength="254"
                        placeholder="INPUT EMAIL"
                        bind:value={email}
                        class="prompt-input"
                    />
                {/if}
                {#if !help}
                    <button disabled={promptInput.length < 3 || (vpass !== password && signup) || password == 0 || (email < 4 && signup)} class="prompt-input prompt-button" on:click={() => (signup ? onSignup : onLogin)(promptInput.replace(/[^A-Za-z0-9]/g, ""))}>
                        { signup ? 'SUBMIT' : 'LOGIN'}
                    </button>
                {/if}
                <button class='prompt-input' on:click={() => {help = !help; signup = true;}}>
                    <b style="color: rgb(40,60,80);">{help ? 'Hide' : 'Show'} Sign up & Login help!</b>
                </button>

                {#if help && signup}
                    <b style="color: rgb(40,60,80)">Please Enter your email above to request a new Verification Link.</b>
                    <br>
                    <button disabled={email < 4} class='prompt-input prompt-button' on:click={onReVer}>
                        <b>Resend Verification Email</b>
                    </button>
                    <b style="color: rgb(40,60,80)">To Update your Password, Please complete fields above and approve the change in the following email verification</b>
                    <br>
                    <button disabled={(vpass !== password) || password == 0 || (email < 4)} class='prompt-input prompt-button' on:click={onNewPass} >
                        <b>Update Password</b>
                    </button>
                {/if}

            {/if}
            <h4 style="color: rgb(40,60,80)">
            {message} <br>
            {message == 'User created' ? `Click the Verification link sent to ${email} then login!` : null}
            </h4>

            <a href="https://studio.paradisbend.com" class="footer">
                <img style="height: 3em" src="/XMAS.svg" alt="LOGO"/>
                <p class="prompt-text">Created By Paradis Bend Studio</p>
                <img style="height: 3em" src="/XMAS.svg" alt="LOGO"/>
            </a>
        </div>
    </div>
{/if}

{#if checkGo === true}
    <div class="fullscreen-prompt">
        <div class="prompt-content">
            <h1 class="prompt-text">Are You Sure?</h1>

            <p class="prompt-text">
                You have not used all squares that you know are required to get the correct word.
            </p>

            <button class="prompt-input prompt-button" on:click={() => {checkGo = false}}>
                GO BACK
            </button>

            <button class="prompt-input prompt-button" on:click={() => okayGo()}>
                CONFIRM
            </button>
        </div>
    </div>
{/if}

{#if username != undefined || start == false}
    <div class="header" style="text-align: center">
        <div class="footer">
            <img style="height: 2.9em; margin: 1em 2px 0px 0px;" src="/PBS_LOGO_NT.svg" alt="LOGO"/>
            <h1 style="transform: scaleY(2); display: inline-block;">FOOBLE</h1>
        </div>
        <h3 style="margin: .5em">Good Luck {username}!</h3>
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
    <h1>{win ? "You Did it!" : "Better Luck Next Time!"} Score:{score}</h1>
{/if}
{#if !playing && !win}
    <h1>{daily.join("")}</h1>
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
            <button class="key grow" disabled={!playing || fooble[line].length < 1} on:click={() => (endKnown ? goCheck() : onGo()) }>Submit</button>
        </div>
</div>

{#if userAuth && userAuth.hasAuth == true}
    <h2>{username}'s Current Streak: {streak}</h2>
{/if}

<div class='scores'>
    <div class="fifty">
        <h2>Todays Top 10</h2>
        <div>
            <div class='scoreTile underline'>
                <div class="username">Player</div>
                <div class="score">Try</div>
                <div class="score">{playing ? 'Hidden' : 'Score'}</div>  
            </div>
            {#each scoreboard as sc}
                <div class='scoreTile'>
                    <div class="username">{sc.username}</div>
                    <div class="score">{sc.line}</div>
                    <div class="score">{playing ? null : sc.score}</div>  
                </div>
            {/each}
        </div>
    </div>

    <div class="fifty">
        <h2>Last Top 10</h2>
        <div>
            <div class='scoreTile underline'>
                <div class="username">Player</div>
                <div class="score">Try</div>
                <div class="score">Score</div>  
            </div>
            {#each pscoreboard as sc}
                <div class='scoreTile'>
                    <div class="username">{sc.username}</div>
                    <div class="score">{sc.line}</div>
                    <div class="score">{sc.score}</div>  
                </div>
            {/each}
        </div>
    </div>
</div>

<div class="footer">
    <img style="height: 1rem; margin: 1rem 2px 2px 2px" src="/PBS_LOGO_NT.svg" alt="LOGO"/>
    <a href="https://studio.paradisbend.com">
        <p>
            Paradis Bend Studio | Fooble
        </p>
    </a>
</div>

<style>

    h1,h2,h3,h4,b,p, .scoreTile{
        font-family: "Roboto", sans-serif;
        text-align: center;
        color: white;
    }



    .header{
        background-color: rgba(0,0,0,.5);
        border:1px solid rgba(0,0,0,.5);
        margin-bottom: 4px;
    }

    .footer{
        display: flex;
        justify-content: center;
    }

    .scores {
        display: flex;
        flex-direction: row;
        flex-basis: auto;
        width: 100%;
        padding-bottom: 5em;
        margin-bottom: 5em;
        justify-content: space-around;
    }

    .fifty {
        display: flex;
        flex-direction: column;
        text-align: center;
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
    }
    .score {
        
        text-align: right;
        width: 30%;
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
        z-index: 1000; /* Ensure it's on top of other elements */
    }

    .prompt-content {
        display: flex;
        flex-direction: column;
        background: white;
        width: 80vw;
        padding: 2rem;
        margin: 1rem;
        margin-bottom: auto;
        border-radius: 10px;
        text-align: center;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        max-height: 70vh;
        overflow-y: scroll;
    }

    .prompt-text {
        color: rgb(40, 60, 80);
    }

    .prompt-input {
        color:rgb(40, 60, 80);
        border:1px solid rgb(55, 83, 124);
        margin-bottom: 1rem;
        padding: 0.5rem 1rem;
        border-radius: 5px;
        cursor: pointer;
        min-width: 50vw;
    }

    .prompt-button {
        background-color: rgb(40, 60, 80);
        color: white;
    }

    .prompt-button:disabled {
        background-color: grey;
    }

    .overgap {
        padding-top: 2rem;
    }
    .rborder {
        border:1px solid red;
        color: red
    }

</style>




