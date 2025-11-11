
/*
Run `npm run seed` to create an initial admin user.
Edit .env or set MONGO_URI and JWT_SECRET as needed.
*/
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/taskmanager';

async function seed() {
  await mongoose.connect(MONGO);
  const email = 'admin@taskapp.local';
  let user = await User.findOne({ email });
  if (user) {
    console.log('Admin user already exists:', email);
    process.exit(0);
  }
  const password = 'Admin@123'; // change after first login
  const hashed = await bcrypt.hash(password, 10);
  user = new User({ name: 'Admin', email, password: hashed, role: 'admin' });
  await user.save();
  console.log('Admin created:', email, 'password:', password);
  process.exit(0);
}
seed();
