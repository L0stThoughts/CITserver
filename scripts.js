// Ensure the DOM elements are loaded
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const postForm = document.getElementById("post-form");
    const logoutButton = document.getElementById("logout-button");
    const usernameDisplay = document.getElementById("username-display");
    const currentUsernameDisplay = document.getElementById("current-username");
    const postList = document.getElementById("post-list");
    const postsContainer = document.getElementById("posts-container");
    const loginButton = document.getElementById("login-button");
    const registerButton = document.getElementById("register-button");

    // Helper functions to manage token storage
    function setToken(token) {
        localStorage.setItem("token", token);
    }

    function getToken() {
        return localStorage.getItem("token");
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
        postsContainer.style.display = "block";
        fetchPosts(); // Fetch posts on login
    }

    // Update UI on logout
    function updateUIForLoggedOutUser() {
        usernameDisplay.style.display = "none";
        logoutButton.style.display = "none";
        loginForm.style.display = "block";
        postsContainer.style.display = "none";
    }

    // Fetch posts function
    async function fetchPosts() {
        try {
            const response = await fetch("/api/posts", {
                headers: {
                    Authorization: `Bearer ${getToken()}`
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch posts.");
            }

            const posts = await response.json();
            displayPosts(posts);
        } catch (error) {
            console.error("Error fetching posts:", error);
            document.getElementById("post-message").textContent = "Error loading posts.";
        }
    }

    // Display posts in the UI
    function displayPosts(posts) {
        const postListElement = document.getElementById("post-list");
        postListElement.innerHTML = ""; // Clear existing posts

        posts.forEach((post) => {
            const postItem = document.createElement("li");
            postItem.className = "post-item";
            postItem.innerHTML = `<h3>${post.title}</h3><p>${post.content}</p>`;
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

        try {
            const response = await fetch("/api/posts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`
                },
                body: JSON.stringify({ title, content })
            });

            if (response.ok) {
                postMessage.textContent = "Post created successfully!";
                postMessage.style.color = "green";
                fetchPosts(); // Refresh the list of posts
            } else {
                const data = await response.json();
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

