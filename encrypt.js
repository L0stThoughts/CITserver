const bcrypt = require('bcrypt');

const password = "69CrazyAuraChad420";
const saltRounds = 10;

bcrypt.hash(password, saltRounds, function(err, hash) {
    // Store hash in your password DB.
    console.log(hash); // Use this hash in your SQL update statement
});
