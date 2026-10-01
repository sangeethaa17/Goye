const mongoose = require('../Backend/node_modules/mongoose');
require('../Backend/node_modules/dotenv').config({ path: 'Backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const offset = new Date().getTimezoneOffset() * 60000;
  const today = new Date(Date.now() - offset).toISOString().split('T')[0];
  
  await mongoose.connection.collection('freeusers').updateOne(
    { email: 'sri@gmail.com' },
    { $set: { credits: 6, freeCredits: 6, totalSent: 8, freeTotalSent: 8, lastDailyRewardDate: today } }
  );
  await mongoose.connection.collection('users').updateOne(
    { email: 'sri@gmail.com' },
    { $set: { credits: 6, freeCredits: 6, totalSent: 8, freeTotalSent: 8, lastDailyRewardDate: today } }
  );
  console.log('RESTORED_SRI_SUCCESS');
  process.exit(0);
}

run().catch(console.error);
