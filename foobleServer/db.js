//DB SETUP
async function sydb(client){

    let keyspace = "CREATE KEYSPACE IF NOT EXISTS fooble WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};";
    let users = "CREATE TABLE IF NOT EXISTS fooble.users (id UUID PRIMARY KEY, username TEXT, email TEXT);";
    let beta_sb = "CREATE TABLE IF NOT EXISTS fooble.beta_sbx (id UUID, username TEXT, email TEXT, day INT, line INT, score INT, PRIMARY KEY (day, score, username, id));";
    let words = "CREATE TABLE IF NOT EXISTS fooble.wordb (day INT PRIMARY KEY, word TEXT, indices INT);";
    //let working = "CREATE INDEX ON fooble.beta_score0 (username);"

    

    let queries = [keyspace, users, words, beta_sb ];
    
    async function executeQueries() {
        for (const query of queries) {
            try {
                await client.execute(query);
                console.log('Data written successfully');
              } catch (err) {
                console.error('Write error:', err);
                console.log('Failed to write data');
            }
        }
    }
    await executeQueries();   
}

module.exports = { sydb };


// try {
//     await client.execute(query, params, { prepare: true });
//     res.status(200).send('Data written successfully');
//   } catch (err) {
//     console.error('Write error:', err);
//     res.status(500).send('Failed to write data');
// }