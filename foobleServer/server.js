const express = require("express");
const mariadb = require("mariadb");
const { v4: uuidv4 } = require('uuid');

const { words } = require('./words');
const { mdb } = require('./db');

//const filterStringsByLength = require('./words');

const app = express();
const port = 3000;

let dailyWord = "PLACEHOLD";
let pScore = [];

app.use(express.static('dist'));
app.use(express.json());

require('dotenv').config();
const dbn = process.env.FDB || 'fooble';

const pool = mariadb.createPool({
  host: process.env.DBH,	
  user: process.env.DBU || 'root',
  password: process.env.DBP,
  connectionLimit: 5
});

function getDay(add) {
  const date = new Date();
  date.setDate(date.getDate() + add);
  const year = date.getFullYear() % 100; // Get the last two digits of the year
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, pad to 2 digits
  const day = String(date.getDate()).padStart(2, '0'); // Pad day to 2 digits

  return parseInt(`${year}${month}${day}`, 10); // Concatenate and convert to a number
}

async function getWord(date) {
  let conn;
  let words = [];
  try{
    conn = await pool.getConnection();
    const query = `SELECT * FROM ${dbn}.wordb WHERE day = ?`;
    const params = [date];
    //const options = {hints: ['int']};

    let rows = await conn.query(query, params);
    words = rows;
    console.log(words);
  } catch (err) {
    console.error("Database error:", err);
  } finally {
    if (conn) conn.release(); // use release() when using a pool
    return words;
  }
}

function getRandomNumber(excludedNumbers, max) {
  const excludedSet = new Set(excludedNumbers);
  let randNum;

  do {
    randNum = Math.floor(Math.random() * max);
  } while (excludedSet.has(randNum));

  return randNum;
}

async function makeWord(date) {
  let conn;
  try{
    conn = await pool.getConnection();
    const eXquery = `SELECT indices FROM ${dbn}.wordb;`;
    let rows = await conn.query(eXquery);
    let usedWords = rows.map(row => row.indices);

    let randNum = getRandomNumber(usedWords, words.length);  //Math.floor(Math.random() * words.length);
    let w = words[randNum];
    let ind = randNum;
    const query = `INSERT INTO ${dbn}.wordb(day, word, indices) VALUES(?,?,?);`;
    const params = [date, w, ind];
    //const options = {hints: ['int', 'text', 'int']};

    await conn.query(query, params);
  } catch (err) {
    console.error("Database error:", err);
  } finally {
    if (conn) conn.release(); // use release() when using a pool
  }
}

async function initWord() {
  let word = await getWord(getDay(0));
  if(!word[0]) {
    await makeWord(getDay(0));
    word = await getWord(getDay(0));
  }

  let word1 = await getWord(getDay(1));
  if(!word1[0]) await makeWord(getDay(1));

  dailyWord = word[0].word;
  console.log(dailyWord);
};

async function prevScore(){
  let conn;
  let day = getDay(-1);
  let query = `SELECT * FROM ${dbn}.sb1 WHERE day = ? ORDER BY score DESC LIMIT 10;`;
  let params = [day];
  //let options = {hints: ['int']};
  try {
    conn = await pool.getConnection();
    let rows = await conn.query(query, params);
    pScore = rows;
  } catch (err) {
    console.error('Prev Score Error:', err);
  } finally {
    if (conn) conn.release();
  }
}

async function initServer(){
  await mdb(pool,dbn);

  initWord();
  prevScore();
}

initServer();

//DetermineDailyWord
setInterval(() => {
  initWord();
  prevScore();
}, 60 * 60 * 1000);


app.get("/", (req, res) => {
    res.sendFile(path.resolve(__dirname, "dist", "index.html"));
});

app.get("/function", async (req, res) => {
    res.send(filterStringsByLength());
});

app.get("/api/word", (req, res) => {
    res.send(dailyWord);
});

app.get("/api/scoreboard", async (req, res) => {
    let conn;
    let day = getDay(0);
    let query = `SELECT * FROM ${dbn}.sb1 WHERE day = ? ORDER BY score DESC LIMIT 10;`;
    let params = [day];
    //let options = {hints: ['int']};
    try {
      conn = await pool.getConnection();
      let rows = await conn.query(query, params);
      //console.log(rows);
      let data = {
        'today': rows,
        'prev': pScore,
      }
      res.json(data);
    } catch (err) {
      console.error('Write error:', err);
      console.log('Failed to write data');
      res.status(500).send("Failed to retrieve data: " + err.message);
    } finally {
      if (conn) conn.release();
    }
});

app.post("/api/score", async (req, res) => {
  let conn;
  const { username, line, score } = req.body;
  const id = uuidv4();
  console.log(username, line, score);
  let day = getDay(0);
  let query = `INSERT INTO ${dbn}.sb1(id, username, email, day, line, score) VALUES(?,?,?,?,?,?);`;
  let params = [id, username, "NA", day, line, score];
  //let options = { hints: ['uuid', 'text', 'text', 'int', 'int', 'int'] };
  try {
    conn = await pool.getConnection();
    await conn.query(query, params);
    console.log('Score written successfully');
  } catch (err) {
    console.error('Write error:', err);
    console.log('Failed to write data');
  } finally {
    if (conn) conn.release();
    res.send("Score Recorded");
  }
});

/*
app.get("/api/test", async (req, res) => {
  try {
    const query = "SELECT release_version FROM system.local";
    const result = await client.execute(query);
    res.send(`ScyllaDB version: ${result.rows[0].release_version}`);
  } catch (err) {
    res.status(500).send(`Error querying ScyllaDB: ${err.message}`);
  }
});
*/

app.listen(port, () => {
  console.log(`App running at http://localhost:${port}`);
});
