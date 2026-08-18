const bcrypt = require('bcrypt');

const plainPassword = 'Admin@123'; // change this if you like

bcrypt.hash(plainPassword, 10).then(hash => {
  console.log('Hashed password:', hash);
});