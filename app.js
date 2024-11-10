const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 3000;

let connection;

app.use(express.json(), express.static(__dirname));

(async () => {
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Connected to MySQL.');

        await seedAdminUser(); // Seed the admin user

        defineRoutes(); // Define API routes after connection

    } catch (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1);
    }
})();

// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (token) {
        console.log('JWT Token:', token);  // Log token for debugging

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                console.log('JWT Error:', err);  // Log the error for debugging
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({ error: 'Token expired' });
                }
                return res.sendStatus(403); // Forbidden
            }

            // Make sure user object contains necessary data (e.g., user.id)
            if (!user || !user.id) {
                return res.status(400).json({ error: 'Invalid token' });
            }

            req.user = user;
            next();
        });
    } else {
        console.log('No token provided');  // Log when no token is provided
        return res.sendStatus(401); // Unauthorized
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
    const adminPassword = '69CrazyAuraChad420'; // Use a secure password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Check if admin exists in the database
    const [existingAdmin] = await connection.execute('SELECT * FROM users WHERE username = ?', [adminUsername]);

    if (existingAdmin.length === 0) {
        // Create the admin user
        await connection.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [adminUsername, hashedPassword, 'admin']);
        console.log('Admin user created');
    } else {
        console.log('Admin user already exists');
    }
}


async function filterRestrictedPosts(user, posts) {
    const postIds = posts.map(post => post.id);

    // Fetch restricted post IDs for the given user
    const [restrictedPosts] = await connection.execute(
        'SELECT post_id FROM post_visibility WHERE restricted_user = ?',
        [user.username]
    );

    const restrictedPostIds = new Set(restrictedPosts.map(r => r.post_id));
    console.log('Restricted posts for user:', restrictedPostIds); // Log restricted post IDs

    // Filter out restricted posts from the posts array
    return posts.filter(post => !restrictedPostIds.has(post.id));
}
function defineRoutes() {
    app.use(express.static(path.join(__dirname)));

    // Registration route for new users
    app.post('/api/register', async (req, res) => {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        try {
            const [existingUser] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
            if (existingUser.length > 0) {
                return res.status(400).json({ error: 'Username already exists.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            await connection.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
                [username, hashedPassword, 'user']);
            res.status(201).json({ message: 'User registered successfully' });

        } catch (err) {
            console.error('Error registering user:', err);
            res.status(500).send('Server Error');
        }
    });

    app.post('/api/login', async (req, res) => {
        const { username, password } = req.body;

        try {
            const [userRows] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
            if (userRows.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const user = userRows[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({ token, username: user.username });
        } catch (err) {
            console.error('Error logging in:', err);
            res.status(500).send('Server Error');
        }
    });

    app.get('/api/posts', async (req, res) => {
        try {
            // Fetch posts with author username
            const [posts] = await connection.execute(`
                SELECT posts.*, users.username AS author
                FROM posts
                LEFT JOIN users ON posts.author_id = users.id
                ORDER BY posts.created_at DESC
            `);
    
            if (req.user) {
                // Filter posts for authenticated user
                const visiblePosts = await filterRestrictedPosts(req.user, posts);
                return res.status(200).json(visiblePosts);
            } else {
                // Return all posts for unauthenticated users
                return res.status(200).json(posts);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
            res.status(500).json({ error: 'Server error' });
        }
    });

app.post('/api/posts', authenticateJWT, async (req, res) => {
    const { title, content } = req.body;
    const authorId = req.user.id;  // Ensure this is valid
    const createdAt = new Date();

    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required.' });
    }

    try {
        const [result] = await connection.execute(
            'INSERT INTO posts (title, content, author_id, created_at) VALUES (?, ?, ?, ?)',
            [title, content, authorId, createdAt]
        );

        res.status(201).json({
            id: result.insertId,
            title,
            content,
            author_id: authorId,
            created_at: createdAt
        });
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(500).json({ error: 'Server error. Could not create post.', details: err.message });
    }
});


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

            if (postResult[0].author !== req.user.username && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Forbidden: You can only edit your own posts or you must be an admin.' });
            }

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

            params.push(id);

            const query = `UPDATE posts SET ${updates.join(', ')} WHERE id = ?`;

            const [result] = await connection.execute(query, params);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Post not found' });
            }

            res.status(200).json({ message: 'Post updated successfully' });
        } catch (err) {
            console.error('Error updating post:', err);
            res.status(500).json({ error: 'Server Error' });
        }
    });

    app.delete('/api/posts/:id', authenticateJWT, async (req, res) => {
        const { id } = req.params;

        try {
            const [postRows] = await connection.execute('SELECT * FROM posts WHERE id = ?', [id]);
            if (postRows.length === 0) return res.status(404).json({ error: 'Post not found' });

            const post = postRows[0];
            if (post.author !== req.user.username && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Permission denied' });
            }

            await connection.execute('DELETE FROM posts WHERE id = ?', [id]);
            res.status(200).json({ message: 'Post deleted successfully' });
        } catch (error) {
            console.error('Error deleting post:', error);
            res.status(500).json({ error: 'Server error' });
        }
    });

    app.post('/api/posts/:id/restrict', authenticateJWT, async (req, res) => {
        const { id } = req.params;
        const { restrictedUser } = req.body;

        try {
            const [postRows] = await connection.execute('SELECT * FROM posts WHERE id = ?', [id]);
            if (postRows.length === 0) return res.status(404).json({ error: 'Post not found' });

            const post = postRows[0];

            if (post.author !== req.user.username && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Permission denied' });
            }

            await connection.execute(
                'INSERT INTO post_visibility (post_id, restricted_user) VALUES (?, ?)',
                [id, restrictedUser]
            );

            res.status(200).json({ message: 'User restricted from viewing post' });
        } catch (error) {
            console.error('Error managing post visibility:', error);
            res.status(500).json({ error: 'Server error' });
        }
    });
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
