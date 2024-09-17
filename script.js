document.addEventListener('DOMContentLoaded', () => {
    const postForm = document.getElementById('postForm');
    const postsDiv = document.getElementById('posts');

    // Simulating existing blog posts from the "database"
    const blogPosts = [
        {
            title: "First Blog Post",
            content: "This is the content of the first blog post."
        },
        {
            title: "Another Post",
            content: "Here's some more content."
        }
    ];

    // Function to render blog posts
    function renderPosts() {
        postsDiv.innerHTML = ''; // Clear the posts div
        blogPosts.forEach((post) => {
            const postDiv = document.createElement('div');
            postDiv.classList.add('post');
            postDiv.innerHTML = `
                <h3>${post.title}</h3>
                <p>${post.content}</p>
            `;
            postsDiv.appendChild(postDiv);
        });
    }

    // Initial rendering of posts
    renderPosts();

    // Handle form submission
    postForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const newPost = {
            title: postForm.title.value,
            content: postForm.content.value
        };

        // In a real application, here you would send this data to the backend (e.g., using fetch API)
        blogPosts.push(newPost);

        // Re-render the posts after adding the new post
        renderPosts();

        // Reset the form
        postForm.reset();
    });
});
