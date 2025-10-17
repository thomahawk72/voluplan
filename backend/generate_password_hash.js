const bcrypt = require('bcryptjs');

const password = 'passord123';
bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  console.log(hash);
});

