<?php
// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Execute the deployment script
    exec('sudo /usr/local/bin/deploy.sh', $output, $return_var);

    // Log output
    file_put_contents('/var/log/webhook.log', implode("\n", $output), FILE_APPEND);
    
    // Return a success response
    http_response_code(200);
    echo "Deployment triggered successfully.";
} else {
    // Invalid request
    http_response_code(403);
    echo "Access forbidden.";
}
?>

