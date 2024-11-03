// Function to fetch and display posts
async function fetchPosts() {
    try {
        const response = await fetch('/api/posts');
        if (!response.ok) throw new Error('Error fetching posts');
        
        const posts = await response.json();
        const postsContainer = document.getElementById('posts-container');
        postsContainer.innerHTML = ''; // Clear existing posts

        if (posts.length > 0) {
            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.classList.add('post');
                postElement.innerHTML = `
                    <h3>${post.title}</h3>
                    <p>By ${post.author} on ${new Date(post.created_at).toLocaleString()}</p>
                    <p>${post.content}</p>
                    <button onclick="deletePost(${post.id})">Delete Post</button>
                    <button onclick="editPost(${post.id}, '${post.title}', '${post.content}')">Edit Post</button>
                    <hr>
                `;
                postsContainer.appendChild(postElement);
            });
        } else {
            postsContainer.innerHTML = '<p>No blog posts available.</p>';
        }
    } catch (error) {
        console.error(error);
        document.getElementById('posts-container').innerHTML = '<p>Error loading posts.</p>';
    }
}

// Function to create a new blog post
document.getElementById('create-post-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const author = document.getElementById('author-name').value;

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content, author })
        });
        if (!response.ok) throw new Error('Error creating post');
        
        const data = await response.json();
        console.log('Post created:', data);
        displayMessage('Post created successfully!', 'success');
        fetchPosts(); // Refresh the posts list
        document.getElementById('create-post-form').reset(); // Clear the form
    } catch (error) {
        console.error(error);
        displayMessage('Error creating post', 'error');
    }
});

// Function to delete a blog post
async function deletePost(id) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
        const response = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Error deleting post');
        
        console.log('Post deleted');
        displayMessage('Post deleted successfully!', 'success');
        fetchPosts(); // Refresh the posts list
    } catch (error) {
        console.error(error);
        displayMessage('Error deleting post', 'error');
    }
}

// Function to edit a blog post
function editPost(id, title, content) {
    const newTitle = prompt('Edit Title:', title);
    const newContent = prompt('Edit Content:', content);
    if (newTitle !== null && newContent !== null) {
        updatePost(id, newTitle, newContent);
    }
}

// Function to update a blog post
async function updatePost(id, title, content) {
    try {
        const response = await fetch(`/api/posts/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content })
        });
        if (!response.ok) throw new Error('Error updating post');
        
        displayMessage('Post updated successfully!', 'success');
        fetchPosts(); // Refresh the posts list
    } catch (error) {
        console.error(error);
        displayMessage('Error updating post', 'error');
    }
}

// Function to display a message to the user
function displayMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = type; // Add class based on message type (success or error)

    // Clear message after 3 seconds
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = '';
    }, 3000);
}

// Initial fetch of posts when page loads
fetchPosts();

