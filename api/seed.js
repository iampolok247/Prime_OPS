import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import { hashPassword } from './utils/hash.js';

dotenv.config();

const users = [
  // Super Admin
  { name: 'Ikhtiar Rahman', email: 'ikhtiar@primeacademy.org', role: 'SuperAdmin', department: 'Management', designation: 'CEO' },
  { name: 'Kazi Sazzad Hossain', email: 'kazi@primeacademy.org', role: 'SuperAdmin', department: 'Marketing', designation: 'Head of Marketing' },
  { name: 'Raj Pahal', email: 'raj@primeacademy.org', role: 'SuperAdmin', department: 'Partnership', designation: 'Director, Partnership' },

  // Admin
  { name: 'Shahidul Islam', email: 'shahidul@primecademy.org', role: 'Admin', department: 'Academic', designation: 'Director, Academic' },
  { name: 'Rafsaniyat Binte Mustafiz', email: 'rafsaniyat@primeacademy.org', role: 'Admin', department: 'Operations', designation: 'Manager, Operations' },

  // Accountant
  { name: 'Md. Mahbub Rahman', email: 'mahbub@primeacademy.org', role: 'Accountant', department: 'Finance', designation: 'Assistant Manager' },

  // Recruitment
  { name: 'Md. Tanvir Alin', email: 'alin@primeacademy.org', role: 'Recruitment', department: 'Recruitment', designation: 'Business Development Manager' },

  // Admission
  { name: 'Sajrin Bashar', email: 'sajrin@primeacademy.org', role: 'Admission', department: 'Admission', designation: 'Business Development Support' },

  // Digital Marketing
  { name: 'J. R. Polok', email: 'polok@primeacademy.org', role: 'DigitalMarketing', department: 'Marketing', designation: 'Digital Marketing Executive' },

  // Motion Graphics
  { name: 'Shuvo Kumar Das', email: 'shuvo@primeacademy.org', role: 'MotionGraphics', department: 'Creative', designation: 'Motion Graphics Designer' }
];

(async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    await User.deleteMany({});
    const pwd = await hashPassword('password123'); // default password
    const docs = await User.insertMany(users.map(u => ({ ...u, password: pwd })));
    console.log(`✅ Seeded ${docs.length} users. Default password: password123`);
    process.exit(0);
  } catch (e) {
    console.error('❌ Seed error:', e.message);
    process.exit(1);
  }
})();
