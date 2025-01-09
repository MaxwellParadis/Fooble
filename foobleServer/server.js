const express = require("express");
const cassandra = require("cassandra-driver");
const { v4: uuidv4 } = require('uuid');

const { words } = require('./words');
const { sydb } = require('./db');

//const filterStringsByLength = require('./words');

const app = express();
const port = 3000;

app.use(express.static('dist'));
app.use(express.json());

// ScyllaDB configuration
const client = new cassandra.Client({
  contactPoints: [process.env.SCYLLA_HOST || "localhost"],
  localDataCenter: "datacenter1" // Replace with your data center name
});

async function connectToScylla() {
  try {
    await client.connect();
    console.log("Connected to ScyllaDB");
    sydb(client);
  } catch (err) {
    console.error("Failed to connect to ScyllaDB", err);
  }
}

connectToScylla();


function getDay(add) {
  const date = new Date();
  date.setDate(date.getDate() + add);
  const year = date.getFullYear() % 100; // Get the last two digits of the year
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, pad to 2 digits
  const day = String(date.getDate()).padStart(2, '0'); // Pad day to 2 digits

  return parseInt(`${year}${month}${day}`, 10); // Concatenate and convert to a number
}

async function getWord(date) {
  const query = "SELECT * FROM fooble.wordb WHERE day = ?";
  const params = [date];
  const options = {hints: ['int']};

  let {rows} = await client.execute(query, params, options);

  return rows;
}

async function makeWord(date) {
  let randNum = Math.floor(Math.random() * words.length);
  let w = words[randNum];
  let ind = randNum;
  const query = "INSERT INTO fooble.wordb(day, word, indices) VALUES(?,?,?);";
  const params = [date, w, ind];
  const options = {hints: ['int', 'text', 'int']};

  await client.execute(query, params, options);
}

let dailyWord = "PLACEHOLD";
let pScore = [];

async function initWord() {
  let word = await getWord(getDay(0));
  if(!word[0]) makeWord(getDay(0));
  
  let word1 = await getWord(getDay(1));
  if(!word1[0]) makeWord(getDay(1));
    
  dailyWord = word[0].word;
  console.log(dailyWord);
};

async function prevScore(){
  let day = getDay(-1);
  let query = "SELECT * FROM fooble.beta_sbx WHERE day = ? ORDER BY score DESC LIMIT 10;";
  let params = [day];
  let options = {hints: ['int']};
  try {
    let {rows} = await client.execute(query, params, options);
    pScore = rows;
  } catch (err) {
    console.error('Prev Score Error:', err);
  }
} 


function wait(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}
async function waiting() {
  await wait(4);
  initWord();
}

waiting();

initWord();
prevScore();

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
    let day = getDay(0);
    let query = "SELECT * FROM fooble.beta_sbx WHERE day = ? ORDER BY score DESC LIMIT 10;";
    let params = [day];
    let options = {hints: ['int']};
    try {
      let {rows} = await client.execute(query, params, options);
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
    }
});

app.post("/api/score", async (req, res) => {
    const { username, line, score } = req.body;
    const id = uuidv4();
    console.log(username, line, score);
    let day = getDay(0);
    let query = "INSERT INTO fooble.beta_sbx(id, username, email, day, line, score) VALUES(?,?,?,?,?,?)";
    let params = [id, username, "NA", day, line, score];
    let options = { hints: ['uuid', 'text', 'text', 'int', 'int', 'int'] };
    try {
      await client.execute(query, params, options);
      console.log('Score written successfully');
    } catch (err) {
      console.error('Write error:', err);
      console.log('Failed to write data');
    }
    res.send("Score Recorded");
});

app.get("/api/test", async (req, res) => {
  try {
    const query = "SELECT release_version FROM system.local";
    const result = await client.execute(query);
    res.send(`ScyllaDB version: ${result.rows[0].release_version}`);
  } catch (err) {
    res.status(500).send(`Error querying ScyllaDB: ${err.message}`);
  }
});

app.listen(port, () => {
  console.log(`App running at http://localhost:${port}`);
});