//DB SETUP
async function mdb(pool){

    let db = "CREATE DATABASE IF NOT EXISTS fooble;";
    let users = "CREATE TABLE IF NOT EXISTS users (id CHAR(36) PRIMARY KEY, username VARCHAR(20), email VARCHAR(99));";
    let sb = "CREATE TABLE IF NOT EXISTS sb1 (id CHAR(36) PRIMARY KEY, username VARCHAR(20), email VARCHAR(99), day INT, line INT, score INT);";
    let words = "CREATE TABLE IF NOT EXISTS wordb (day INT PRIMARY KEY, word VARCHAR(21), indices INT);";
    //let working = "CREATE INDEX ON fooble.beta_score0 (username);"



    let queries = [ db, users, words, sb ];

    async function executeQueries() {
      let conn;
      try {
        conn = await pool.getConnection();
      } catch(err) {
        console.error('Write error:', err);
      }
      if(conn) for (const query of queries) {
          try {
              await conn.query(query);
              console.log('Data written successfully');
            } catch (err) {
              console.error('Write error:', err);
              console.log('Failed to write data');
          }
      }
      if (conn) conn.release();
    }
    await executeQueries();
}

module.exports = { mdb };


// try {
//     await client.execute(query, params, { prepare: true });
//     res.status(200).send('Data written successfully');
//   } catch (err) {
//     console.error('Write error:', err);
//     res.status(500).send('Failed to write data');
// }
