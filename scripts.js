// Function to fetch posts
async function fetchPosts() {
    try {
        const response = await fetch('/api/posts');
        const posts = await response.json();
        const postList = document.getElementById('post-list');
        postList.innerHTML = ''; // Clear existing posts

        if (response.ok) {
            posts.forEach(post => {
                const postDiv = document.createElement('div');
                postDiv.classList.add('post');
                postDiv.innerHTML = `
                    <h3>${post.title}</h3>
                    <p>${post.content}</p>
                `;
                postList.appendChild(postDiv);
            });
        } else {
            postList.innerHTML = '<p>No posts available.</p>';
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
        document.getElementById('post-list').innerHTML = '<p>Error fetching posts.</p>';
    }
}

// Function to handle user login
async function handleLogin(username, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token); // Store token in local storage
            document.getElementById('message').innerText = 'Login successful!';
            document.getElementById('logout-button').style.display = 'block'; // Show logout button
            document.getElementById('login-form').style.display = 'none'; // Hide login form
            fetchPosts(); // Refresh posts after login
        } else {
            document.getElementById('message').innerText = data.error || 'Login failed.';
        }
    } catch (error) {
        console.error('Error logging in:', error);
        document.getElementById('message').innerText = 'Login failed due to an error.';
    }
}

// Event listener for login button
document.getElementById('login-button').addEventListener('click', () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    handleLogin(username, password);
});

// Event listener for logout button
document.getElementById('logout-button').addEventListener('click', () => {
    localStorage.removeItem('token'); // Remove token from local storage
    document.getElementById('logout-button').style.display = 'none'; // Hide logout button
    document.getElementById('login-form').style.display = 'block'; // Show login form
    document.getElementById('message').innerText = 'Logged out successfully.';
    document.getElementById('post-list').innerHTML = ''; // Clear post list
});

// Fetch posts on initial page load
fetchPosts();
// Function to fetch posts
async function fetchPosts() {
    try {
        const response = await fetch('/api/posts');
        const posts = await response.json();
        const postList = document.getElementById('post-list');
        postList.innerHTML = ''; // Clear existing posts

        if (response.ok) {
            posts.forEach(post => {
                const postDiv = document.createElement('div');
                postDiv.classList.add('post');
                postDiv.innerHTML = `
                    <h3>${post.title}</h3>
                    <p>${post.content}</p>
                `;
                postList.appendChild(postDiv);
            });
        } else {
            postList.innerHTML = '<p>No posts available.</p>';
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
        document.getElementById('post-list').innerHTML = '<p>Error fetching posts.</p>';
    }
}

// Function to handle user login
async function handleLogin(username, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token); // Store token in local storage
            document.getElementById('message').innerText = 'Login successful!';
            document.getElementById('logout-button').style.display = 'block'; // Show logout button
            document.getElementById('login-form').style.display = 'none'; // Hide login form
            fetchPosts(); // Refresh posts after login
        } else {
            document.getElementById('message').innerText = data.error || 'Login failed.';
        }
    } catch (error) {
        console.error('Error logging in:', error);
        document.getElementById('message').innerText = 'Login failed due to an error.';
    }
}

// Event listener for login button
document.getElementById('login-button').addEventListener('click', () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    handleLogin(username, password);
});

// Event listener for logout button
document.getElementById('logout-button').addEventListener('click', () => {
    localStorage.removeItem('token'); // Remove token from local storage
    document.getElementById('logout-button').style.display = 'none'; // Hide logout button
    document.getElementById('login-form').style.display = 'block'; // Show login form
    document.getElementById('message').innerText = 'Logged out successfully.';
    document.getElementById('post-list').innerHTML = ''; // Clear post list
});

// Fetch posts on initial page load
fetchPosts();

