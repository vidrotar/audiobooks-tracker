const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = process.env.DB_PATH || './data/audiobooks.db';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize SQLite database
let db;
try {
    db = new Database(DB_PATH);
    console.log('Connected to SQLite database');
} catch (err) {
    console.error('Error opening database:', err);
    process.exit(1);
}

// Create audiobooks table
db.exec(`
    CREATE TABLE IF NOT EXISTS audiobooks (
                                              id INTEGER PRIMARY KEY AUTOINCREMENT,
                                              title TEXT NOT NULL,
                                              author TEXT,
                                              narrator TEXT,
                                              duration TEXT,
                                              genre TEXT,
                                              description TEXT,
                                              cover_url TEXT,
                                              goodreads_url TEXT,
                                              rating REAL,
                                              date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
                                              date_started_listening DATETIME,
                                              date_end_listened DATETIME,
                                              notes TEXT,
                                              status TEXT DEFAULT 'to_listen'
    )
`);

// Function to search for book info using Open Library API
async function searchBookInfo(title, author) {
    try {
        const searchQuery = `${title} ${author || ''}`.trim();
        const response = await axios.get(`https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=5`);

        if (response.data.docs && response.data.docs.length > 0) {
            const book = response.data.docs[0];
            return {
                title: book.title,
                author: book.author_name ? book.author_name[0] : author,
                description: book.first_sentence ? book.first_sentence[0] : null,
                cover_url: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : null,
                isbn: book.isbn ? book.isbn[0] : null
            };
        }
    } catch (error) {
        console.error('Error fetching book info:', error);
    }
    return null;
}

// Routes
app.get('/api/audiobooks', (req, res) => {
    try {
        const stmt = db.prepare(`
      SELECT * FROM audiobooks 
      ORDER BY date_added DESC
    `);
        const rows = stmt.all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/audiobooks', async (req, res) => {
    const {
        title,
        author,
        narrator,
        duration,
        genre,
        description,
        date_started_listening,
        date_end_listened,
        notes,
        status
    } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    try {
        // Try to fetch additional book information
        const bookInfo = await searchBookInfo(title, author);

        const stmt = db.prepare(`
      INSERT INTO audiobooks (
        title, author, narrator, duration, genre, description, 
        cover_url, date_started_listening, date_end_listened, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        const values = [
            title,
            author || (bookInfo ? bookInfo.author : null),
            narrator,
            duration,
            genre,
            description || (bookInfo ? bookInfo.description : null),
            bookInfo ? bookInfo.cover_url : null,
            date_started_listening,
            date_end_listened,
            notes,
            status || 'completed'
        ];

        const result = stmt.run(...values);

        // Return the created audiobook
        const getStmt = db.prepare('SELECT * FROM audiobooks WHERE id = ?');
        const row = getStmt.get(result.lastInsertRowid);
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/audiobooks/:id', (req, res) => {
    const { id } = req.params;
    const {
        title,
        author,
        narrator,
        duration,
        genre,
        description,
        date_started_listening,
        date_end_listened,
        notes,
        status,
        rating
    } = req.body;

    try {
        const stmt = db.prepare(`
      UPDATE audiobooks SET 
        title = ?, author = ?, narrator = ?, duration = ?, 
        genre = ?, description = ?, date_started_listening = ?,
        date_end_listened = ?,
        notes = ?, status = ?, rating = ?
      WHERE id = ?
    `);

        const values = [
            title, author, narrator, duration, genre,
            description, date_started_listening, date_end_listened, notes, status, rating, id
        ];

        const result = stmt.run(...values);

        if (result.changes === 0) {
            res.status(404).json({ error: 'Audiobook not found' });
            return;
        }

        // Return updated audiobook
        const getStmt = db.prepare('SELECT * FROM audiobooks WHERE id = ?');
        const row = getStmt.get(id);
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/audiobooks/:id', (req, res) => {
    const { id } = req.params;

    try {
        const stmt = db.prepare('DELETE FROM audiobooks WHERE id = ?');
        const result = stmt.run(id);

        if (result.changes === 0) {
            res.status(404).json({ error: 'Audiobook not found' });
            return;
        }

        res.json({ message: 'Audiobook deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get statistics
app.get('/api/stats', (req, res) => {
    try {
        const totalStmt = db.prepare("SELECT COUNT(*) as count FROM audiobooks");
        const completedStmt = db.prepare("SELECT COUNT(*) as count FROM audiobooks WHERE status = 'completed'");
        const listeningStmt = db.prepare("SELECT COUNT(*) as count FROM audiobooks WHERE status = 'listening'");
        const toListenStmt = db.prepare("SELECT COUNT(*) as count FROM audiobooks WHERE status = 'to_listen'");

        const stats = {
            total: totalStmt.get().count,
            completed: completedStmt.get().count,
            listening: listeningStmt.get().count,
            to_listen: toListenStmt.get().count
        };

        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all listened audiobooks, ordered by date_started_listening
app.get('/api/audiobooks/listened', (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT * FROM audiobooks
            WHERE status = 'completed'
            ORDER BY date_started_listening
        `);
        const rows = stmt.all();
        // Add numbering
        const numbered = rows.map((row, idx) => ({ number: idx + 1, ...row }));
        res.json(numbered);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve React app for any other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    if (db) {
        db.close();
        console.log('Database connection closed');
    }
    process.exit(0);
});