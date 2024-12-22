// src/server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Directory to store databases
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
app.post('/api/databases', (req, res) => {
    const { name } = req.body;
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
    const dbPath = path.join(DB_DIR, `${req.params.name}.db`);
    const db = new sqlite3.Database(dbPath);

    db.all(`
        SELECT name FROM sqlite_master 
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
app.post('/api/databases/:name/tables', (req, res) => {
    const { tableName, columns } = req.body;
    if (!tableName || !columns || !columns.length) {
        res.status(400).json({ error: 'Table name and columns are required' });
        return;
    }

    const dbPath = path.join(DB_DIR, `${req.params.name}.db`);
    const db = new sqlite3.Database(dbPath);

    const columnDefinitions = columns.map(col => 
        `${col.name} ${col.type}${col.primaryKey ? ' PRIMARY KEY' : ''}${col.notNull ? ' NOT NULL' : ''}`
    ).join(', ');

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

// Get table data
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});