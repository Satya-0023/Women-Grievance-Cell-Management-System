import bcrypt from 'bcrypt';
bcrypt.hash('Satya@123', 10).then(h => console.log(h));