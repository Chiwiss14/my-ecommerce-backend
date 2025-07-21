const mongoose = require('mongoose');
const User = require('./models/usersModel'); // Adjust path if needed
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.mongo_uri);
    const result = await User.updateOne(
      { email: 'nsirimconfidence@yahoo.com' },
      { role: 'admin' }
    );
    console.log('✅ User promoted:', result);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
