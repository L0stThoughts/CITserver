// Ensure the DOM elements are loaded
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const postForm = document.getElementById("post-form");
    const logoutButton = document.getElementById("logout-button");
    const usernameDisplay = document.getElementById("username-display");
    const currentUsernameDisplay = document.getElementById("current-username");
    const postList = document.getElementById("post-list"); // Updated ID
    const postsContainer = document.getElementById("posts-container");
    const loginButton = document.getElementById("login-button");
    const registerButton = document.getElementById("register-button");
    const postListElement = document.getElementById("post-list-ul");
    const externalDataSection = document.getElementById("external-data");

    // Ensure these elements exist
    if (!postsContainer || !postList) {
        console.error('Required DOM elements are missing');
        return;
    }

    // Helper functions to manage token storage
    function setToken(token) {
        localStorage.setItem("token", token);
    }

    function getToken() {
        return localStorage.getItem('token'); // Adjust based on how you're storing it
    }

    function removeToken() {
        localStorage.removeItem("token");
    }

    function setUsername(username) {
        localStorage.setItem("username", username);
    }

    function getUsername() {
        return localStorage.getItem("username");
    }

    function clearUserData() {
        removeToken();
        localStorage.removeItem("username");
    }

    // Update UI on login
    function updateUIForLoggedInUser(username) {
        usernameDisplay.style.display = "block";
        currentUsernameDisplay.textContent = username;
        logoutButton.style.display = "block";
        loginForm.style.display = "none";
        postList.style.display = "block"; // Show post list section
        fetchPosts(); // Fetch posts on login
    }

    // Update UI on logout
    function updateUIForLoggedOutUser() {
        usernameDisplay.style.display = "none";
        logoutButton.style.display = "none";
        loginForm.style.display = "block";
        postList.style.display = "none"; // Hide post list section
        postsContainer.innerHTML = ""; // Clear posts when logged out
    }
// Function to fetch and display external data from all four APIs
async function fetchExternalData() {
    try {
        const response = await fetch("/api/datas");

        if (!response.ok) {
            throw new Error("Failed to fetch external data.");
        }

        const data = await response.json();

        externalDataSection.innerHTML = `
            <h3>Data from API 1:</h3>
            <pre>${JSON.stringify(data.api1, null, 2)}</pre>
            <h3>Data from API 2:</h3>
            <pre>${JSON.stringify(data.api2, null, 2)}</pre>
            <h3>Data from API 3:</h3>
            <pre>${JSON.stringify(data.api3, null, 2)}</pre>
            <h3>Data from API 4:</h3>
            <pre>${JSON.stringify(data.api4, null, 2)}</pre>
        `;
    } catch (error) {
        console.error("Error fetching external data:", error);
        externalDataSection.innerHTML = `
            <h3>Error:</h3>
            <p>We encountered an issue while trying to fetch the data. Please try again later.</p>
            <pre>${error.message}</pre>
        `;
    }
}

window.onload = () => {
    fetchExternalData();
    fetchPosts();
};
// Ensure the DOM is ready and then fetch the data
document.addEventListener("DOMContentLoaded", () => {
    fetchExternalData(); // Fetch external data when the page loads
});
    // Fetch posts function
    async function fetchPosts() {
        try {
            const response = await fetch("/api/posts", {
                headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {}
            });

            if (!response.ok) {
                throw new Error("Failed to fetch posts. Status: " + response.status);
            }

            const posts = await response.json();
            console.log("Fetched posts:", posts);
            renderPosts(posts);
        } catch (error) {
            console.error("Error fetching posts:", error);
            document.getElementById("post-message").textContent = "Error loading posts.";
        }
    }

    // Render posts in the UI
    function renderPosts(posts) {
        if (!postListElement) {
            console.error("The post list UL element is missing from the DOM");
            return;
        }

        postListElement.innerHTML = ""; // Clear existing posts

        if (posts.length === 0) {
            postListElement.innerHTML = "<li>No posts available.</li>"; // Message if no posts
            return;
        }

        posts.forEach((post) => {
            const postItem = document.createElement("li");
            postItem.className = "post"; // Use the existing class for styling
            postItem.innerHTML = `
                <h3>${post.title}</h3>
                <div class="post-metadata">
                    <span>By: ${post.author || 'Unknown'}</span>
                    <span class="post-date">${new Date(post.created_at).toLocaleString()}</span>
                </div>
                <p>${post.content}</p>
                <div class="post-actions">
                    ${getUsername() === post.author || getUsername() === "admin" ? 
                        `
                        <button class="edit-post" data-id="${post.id}">Edit</button>
                        <button class="delete-post" data-id="${post.id}">Delete</button>
                        ` : ''
                    }
                </div>
            `;

            // Add event listeners for edit and delete buttons if they exist
            const editButton = postItem.querySelector(".edit-post");
            const deleteButton = postItem.querySelector(".delete-post");

            if (editButton) {
                editButton.addEventListener("click", () => editPost(post));
            }

            if (deleteButton) {
                deleteButton.addEventListener("click", () => deletePost(post.id));
            }

            postListElement.appendChild(postItem);
        });
    }

    // Handle login
    async function handleLogin() {
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const messageDisplay = document.getElementById("message");

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                setToken(data.token);
                setUsername(data.username);
                updateUIForLoggedInUser(data.username);
                messageDisplay.textContent = "Login successful!";
                messageDisplay.style.color = "green";
            } else {
                messageDisplay.textContent = data.error || "Login failed.";
                messageDisplay.style.color = "red";
            }
        } catch (error) {
            console.error("Error logging in:", error);
            messageDisplay.textContent = "An error occurred during login.";
            messageDisplay.style.color = "red";
        }
    }

    // Handle registration
    async function handleRegister() {
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const messageDisplay = document.getElementById("message");

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                messageDisplay.textContent = "Registration successful! You can now log in.";
                messageDisplay.style.color = "green";
            } else {
                messageDisplay.textContent = data.error || "Registration failed.";
                messageDisplay.style.color = "red";
            }
        } catch (error) {
            console.error("Error registering:", error);
            messageDisplay.textContent = "An error occurred during registration.";
            messageDisplay.style.color = "red";
        }
    }

    // Handle post creation
    async function handleCreatePost(event) {
        event.preventDefault();
        const title = document.getElementById("title").value;
        const content = document.getElementById("content").value;
        const postMessage = document.getElementById("post-message");

        // Clear previous messages
        postMessage.textContent = "";

        try {
            const response = await fetch("/api/posts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}` // Include token for authorization
                },
                body: JSON.stringify({ title, content })
            });

            // Debugging response status and data
            console.log('Response Status:', response.status);
            const data = await response.json();
            console.log('Response Data:', data);

            if (response.ok) {
                postMessage.textContent = "Post created successfully!";
                postMessage.style.color = "green";
                fetchPosts(); // Refresh the list of posts
            } else {
                postMessage.textContent = data.error || "Failed to create post.";
                postMessage.style.color = "red";
            }
        } catch (error) {
            console.error("Error creating post:", error);
            postMessage.textContent = "An error occurred while creating the post.";
            postMessage.style.color = "red";
        }
    }

    // Handle logout
    function handleLogout() {
        clearUserData();
        updateUIForLoggedOutUser();
        document.getElementById("message").textContent = "Logged out successfully.";
    }

    // Handle post editing
    async function editPost(post) {
        const title = prompt("Edit post title", post.title);
        const content = prompt("Edit post content", post.content);

        if (title && content) {
            try {
                const response = await fetch(`/api/posts/${post.id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getToken()}`
                    },
                    body: JSON.stringify({ title, content })
                });

                if (response.ok) {
                    fetchPosts(); // Reload posts
                    alert("Post updated successfully.");
                } else {
                    alert("Failed to update post.");
                }
            } catch (error) {
                console.error("Error updating post:", error);
                alert("Error updating post.");
            }
        }
    }

    // Handle post deletion
    async function deletePost(postId) {
        const confirmDelete = confirm("Are you sure you want to delete this post?");
        if (confirmDelete) {
            try {
                const response = await fetch(`/api/posts/${postId}`, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${getToken()}`
                    }
                });

                if (response.ok) {
                    fetchPosts(); // Reload posts
                    alert("Post deleted successfully.");
                } else {
                    alert("Failed to delete post.");
                }
            } catch (error) {
                console.error("Error deleting post:", error);
                alert("Error deleting post.");
            }
        }
    }

    // Event listeners for login, registration, post creation, and logout
    loginButton.addEventListener("click", handleLogin);
    registerButton.addEventListener("click", handleRegister);
    postForm.addEventListener("submit", handleCreatePost);
    logoutButton.addEventListener("click", handleLogout);

    // Check if user is already logged in (on page load)
    if (getToken() && getUsername()) {
        updateUIForLoggedInUser(getUsername());
    } else {
        updateUIForLoggedOutUser();
    }
});
