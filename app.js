const express = require('express');
const mysql = require('mysql2/promise'); // Using promise-based MySQL
const path = require('path');

const app = express();
const port = 3000;

let connection; // Variable to store the database connection

// Function to connect to MySQL
(async () => {
    try {
        // Establish the MySQL connection using RDS credentials
        connection = await mysql.createConnection({
            host: 'database-1.cj8ccskwcppm.eu-central-1.rds.amazonaws.com',
            port: 3306,
            user: 'root',
            password: 'rootroot',
            database: 'blogdb'
        });

        console.log('Connected to MySQL.');

        // Define API routes only after the database connection is successful
        defineRoutes();

    } catch (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1); // Exit the process if connection fails
    }
})();

// Function to define routes (called after successful DB connection)
function defineRoutes() {
    // Serve static files (HTML, CSS, JS)
    app.use(express.static(path.join(__dirname, 'public')));

    // API route to fetch blog posts in JSON format
    app.get('/api/posts', async (req, res) => {
        try {
            const query = `
                SELECT posts.id, posts.title, posts.content, authors.name AS author, posts.created_at
                FROM posts
                JOIN authors ON posts.author_id = authors.id
                ORDER BY posts.created_at DESC
            `;
            const [results] = await connection.execute(query);
            res.json(results); // Send data as JSON to the client
        } catch (err) {
            console.error('Error fetching posts:', err);
            res.status(500).send('Server Error');
        }
    });

    // Root route to serve the homepage
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html')); // Ensure index.html exists in public folder
    });

    // Start the server only after routes are defined
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

