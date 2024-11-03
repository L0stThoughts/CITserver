const express = require('express');
const mysql = require('mysql2/promise'); // Using promise-based MySQL
const path = require('path');
const jwt = require('jsonwebtoken'); // For JWT authentication
const bcrypt = require('bcrypt'); // For password hashing
require('dotenv').config(); // Load environment variables from .env

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
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Connected to MySQL.');

        // Seed the admin user
        await seedAdminUser();

        // Define API routes only after the database connection is successful
        defineRoutes();

    } catch (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1); // Exit the process if connection fails
    }
})();

// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403); // Forbidden
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401); // Unauthorized
    }
};

// Middleware to authorize admin users
const authorizeAdmin = (req, res, next) => {
    if (req.user.role === 'admin') {
        return next();
    }
    res.sendStatus(403); // Forbidden
};

// Function to seed the admin user
async function seedAdminUser() {
    const adminUsername = 'admin';
    const adminPassword = 'adminpassword'; // Use a secure password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Check if admin exists in the database
    const [existingAdmin] = await connection.execute('SELECT * FROM users WHERE username = ?', [adminUsername]);

    if (existingAdmin.length === 0) {
        // Create the admin user
        await connection.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
            [adminUsername, hashedPassword, 'admin']);
        console.log('Admin user created');
    } else {
        console.log('Admin user already exists');
    }
}

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
    app.post('/api/posts', authenticateJWT, async (req, res) => {
        const { title, content } = req.body;
        const authorId = req.user.id; // Get the author's id from the token

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required.' });
        }

        try {
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
    app.delete('/api/posts/:id', authenticateJWT, async (req, res) => {
        const { id } = req.params;
        const authorId = req.user.id;

        try {
            const [postResult] = await connection.execute('SELECT * FROM posts WHERE id = ?', [id]);
            if (postResult.length === 0) {
                return res.status(404).json({ error: 'Post not found' });
            }

            // Admins can delete any post
            if (postResult[0].author_id !== authorId && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Forbidden: You can only delete your own posts or you must be an admin.' });
            }

            await connection.execute('DELETE FROM posts WHERE id = ?', [id]);
            res.status(204).send(); // No content
        } catch (err) {
            console.error('Error deleting post:', err);
            res.status(500).send('Server Error');
        }
    });

    // API route to update a blog post by ID
    app.patch('/api/posts/:id', authenticateJWT, async (req, res) => {
        const { id } = req.params;
        const { title, content } = req.body;
        const authorId = req.user.id;

        if (!title && !content) {
            return res.status(400).json({ error: 'At least one of title or content is required to update.' });
        }

        try {
            const [postResult] = await connection.execute('SELECT * FROM posts WHERE id = ?', [id]);
            if (postResult.length === 0) {
                return res.status(404).json({ error: 'Post not found' });
            }

            // Admins can edit any post
            if (postResult[0].author_id !== authorId && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Forbidden: You can only edit your own posts or you must be an admin.' });
            }

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

    // API route to log in a user
    app.post('/api/login', async (req, res) => {
        const { username, password } = req.body;

        try {
            const [userRows] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
            if (userRows.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const user = userRows[0];

            // Compare the password with the hash
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Create a JWT token including the user role
            const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({ token });
        } catch (err) {
            console.error('Error logging in:', err);
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

