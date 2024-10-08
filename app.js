const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const port = 3000;

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'MySecureP@ssw0rd!',
    database: 'blogdb'
});

// Test MySQL connection
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL.');
});

// API route to fetch blog posts in JSON format
app.get('/api/posts', (req, res) => {
    const query = `
        SELECT posts.id, posts.title, posts.content, authors.name AS author, posts.created_at
        FROM posts
        JOIN authors ON posts.author_id = authors.id
        ORDER BY posts.created_at DESC
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching posts:', err);
            return res.status(500).send('Server Error');
        }
        res.json(results); // Send data as JSON to the client
    });
});

// **Add this route for the root path**
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Ensure you have an index.html file in the public folder
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

