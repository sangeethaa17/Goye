const mongoose = require('../Backend/node_modules/mongoose');
require('../Backend/node_modules/dotenv').config({ path: './Backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/goyee');
  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  
  // Make ps@gmail.com, uj@gmail.com and pp@gmail.com active subscribed users
  await mongoose.connection.db.collection('users').updateMany(
    { email: { $in: ['ps@gmail.com', 'uj@gmail.com', 'pp@gmail.com', 'naresh@gmail.com'] } },
    { $set: { isSubscribed: true, subscriptionPlan: 'One Month', subscriptionStartedAt: new Date(), subscriptionExpiresAt: futureDate, credits: 99999 } }
  );

  const list = await mongoose.connection.db.collection('users').find({ isSubscribed: true }).toArray();
  console.log('ACTIVE SUBSCRIBED USERS:', list.map(u => ({ email: u.email, isSubscribed: u.isSubscribed, expiresAt: u.subscriptionExpiresAt })));
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
