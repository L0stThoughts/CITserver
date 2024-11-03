const express = require('express');
const mysql = require('mysql2/promise'); // Using promise-based MySQL
const path = require('path');

const app = express();
const port = 3000;

let connection; // Variable to store the database connection

// Middleware to parse JSON requests
app.use(express.json(), express.static(__dirname));

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

    // API route to fetch all blog posts in JSON format
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

    // API route to fetch a single blog post by ID
    app.get('/api/posts/:id', async (req, res) => {
        const { id } = req.params;
        console.log("Fetching post with ID:", id);

        try {
            const query = `
                SELECT posts.id, posts.title, posts.content, authors.name AS author, posts.created_at
                FROM posts
                JOIN authors ON posts.author_id = authors.id
                WHERE posts.id = ?
            `;
            const [results] = await connection.execute(query, [id]);
            console.log("Query results:", results);

            if (results.length === 0) {
                console.log("Post not found for ID:", id);
                return res.status(404).json({ error: 'Post not found' });
            }

            res.json(results[0]);

        } catch (err) {
            console.error('Error fetching post by ID:', err);
            res.status(500).send('Server Error');
        }
    });

    // API route to create a new blog post
    app.post('/api/posts', async (req, res) => {
        const { title, content, author } = req.body;

        if (!title || !content || !author) {
            return res.status(400).json({ error: 'Title, content, and author are required.' });
        }

        try {
            // Check if the author exists
            const [authorRows] = await connection.execute('SELECT id FROM authors WHERE name = ?', [author]);
            let authorId;

            if (authorRows.length > 0) {
                authorId = authorRows[0].id; // Author exists
            } else {
                // Insert new author and get the id
                const [result] = await connection.execute('INSERT INTO authors (name) VALUES (?)', [author]);
                authorId = result.insertId; // Get the newly created author ID
            }

            // Create a new blog post
            const [postResult] = await connection.execute(
                'INSERT INTO posts (title, content, author_id, created_at) VALUES (?, ?, ?, NOW())',
                [title, content, authorId]
            );

            // Return the ID of the newly created post
            res.status(201).json({ id: postResult.insertId });

        } catch (err) {
            console.error('Error creating post:', err);
            res.status(500).send('Server Error');
        }
    });

    // API route to delete a blog post by ID
    app.delete('/api/posts/:id', async (req, res) => {
        const { id } = req.params;

        try {
            const [result] = await connection.execute('DELETE FROM posts WHERE id = ?', [id]);
            console.log("Delete result:", result);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Post not found' });
            }

            res.status(204).send(); // No content
        } catch (err) {
            console.error('Error deleting post:', err);
            res.status(500).send('Server Error');
        }
    });

    // API route to update a blog post by ID
    app.patch('/api/posts/:id', async (req, res) => {
        const { id } = req.params;
        const { title, content } = req.body;

        if (!title && !content) {
            return res.status(400).json({ error: 'At least one of title or content is required to update.' });
        }

        try {
            // Prepare the update query
            const updates = [];
            const params = [];

            if (title) {
                updates.push('title = ?');
                params.push(title);
            }

            if (content) {
                updates.push('content = ?');
                params.push(content);
            }

            // Include the post ID in the parameters
            params.push(id);

            // Execute the update query
            const query = `UPDATE posts SET ${updates.join(', ')} WHERE id = ?`;
            const [result] = await connection.execute(query, params);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Post not found' });
            }

            res.status(200).json({ message: 'Post updated successfully' });

        } catch (err) {
            console.error('Error updating post:', err);
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

