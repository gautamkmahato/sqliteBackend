const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, 'databases');
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR);
}

async function getAllDatabase(req, res){
    console.log("hello")
    fs.readdir(DB_DIR, (err, files) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const databases = files.filter(file => file.endsWith('.db'));
        res.json({ databases });
    });
}

async function createNewDatabase(req, res) {
    const { name } = req.body;
    console.log(name)
    if (!name) {
        res.status(400).json({ error: 'Database name is required' });
        return;
    }

    const dbPath = path.join(DB_DIR, `${name}.db`);
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Database created successfully', name });
    });
    db.close();
}


module.exports = { getAllDatabase, createNewDatabase };

  