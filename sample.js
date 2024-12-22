const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const categoryRouter = require('./routes/categoryRouter');
const postRouter = require('./routes/postRouter');
const userRouter = require('./routes/userRouter');
const webhookRouter = require('./routes/webhookRouter');
const { Webhook } = require('svix');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware to parse JSON request bodies
const corsOptions = {
  origin: 'http://localhost:3000', // Set to your frontend origin
  credentials: true, // Allow cookies to be sent
};
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));

app.use('/api/category', categoryRouter);
app.use('/api/post', postRouter);
app.use('/api/user', userRouter);
app.use('/api/webhooks', webhookRouter);


const DB_DIR = path.join(__dirname, 'databases');
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR);
}

// Get list of databases
app.get('/api/databases', (req, res) => {
    fs.readdir(DB_DIR, (err, files) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const databases = files.filter(file => file.endsWith('.db'));
        res.json({ databases });
    });
});

// Create new database
app.post('/api/databases', express.json(),  (req, res) => {
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
});

// Get tables in a database
app.get('/api/databases/:name/tables', (req, res) => {
  const name = req.params.name;
    const dbPath = path.join(DB_DIR, `${name}.db`);
    const db = new sqlite3.Database(dbPath);

    db.all(`
        SELECT * FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `, (err, tables) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ tables });
    });
    db.close();
});

// Create new table
app.post('/api/databases/:name/tables', express.json(), (req, res) => {
    const { tableName, columns } = req.body;
    const name = req.params.name;
    if (!tableName || !columns || !columns.length) {
        res.status(400).json({ error: 'Table name and columns are required' });
        return;
    }

    const dbPath = path.join(DB_DIR, `${name}.db`);
    const db = new sqlite3.Database(dbPath);

    const columnDefinitions = columns.map(col => 
        `${col.name} ${col.type} ${col.primaryKey ? ' PRIMARY KEY' : ''} ${col.notNull ? ' NOT NULL' : ''}`
    ).join(', ');

    //console.log(columnDefinitions)

    const query = `CREATE TABLE ${tableName} (${columnDefinitions})`;

    db.run(query, (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Table created successfully', tableName });
    });
    db.close();
});

// Get tables meta data
app.get('/api/databases/:name/table/metadata', (req, res) => {
  const dbPath = path.join(DB_DIR, `${req.params.name}.db`);
  const db = new sqlite3.Database(dbPath);

  
  // Retrieve table metadata
  db.all(`PRAGMA table_info(users);`, (err, tableInfo) => {
    if (err) {
      res.status(500).json({ error: `Failed to retrieve metadata for table: users` });
      db.close();
      return;
    }

    if (tableInfo.length === 0) {
      res.status(404).json({ error: `Table not found: users` });
    } else {
      res.json({ metadata: tableInfo });
    }

  });

  db.close();
});

// Get data
app.get('/api/databases/:name/tables/:table/data', (req, res) => {
    const dbPath = path.join(DB_DIR, `${req.params.name}.db`);
    const db = new sqlite3.Database(dbPath);

    db.all(`SELECT * FROM ${req.params.table}`, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
    db.close();
});

// Get table metadata
app.get('/api/databases/:dbName/tables/:tableName/metadata', (req, res) => {
  const dbName = req.params.dbName;
  const tableName = req.params.tableName;

  // Build the database file path
  const dbPath = path.join(DB_DIR, `${dbName}.db`);

  // Check if the database exists
  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      res.status(500).json({ error: `Database not found: ${dbName}` });
      return;
    }
  });

  // Retrieve table metadata
  db.all(`PRAGMA table_info(${tableName});`, (err, tableInfo) => {
    if (err) {
      res.status(500).json({ error: `Failed to retrieve metadata for table: ${tableName}` });
      db.close();
      return;
    }

    if (tableInfo.length === 0) {
      res.status(404).json({ error: `Table not found: ${tableName}` });
    } else {
      res.json({ tableName, metadata: tableInfo });
    }

    db.close();
  });
});


app.listen(5000, () => {
  console.log("Server is running on PORT 8000...");
});
