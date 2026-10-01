const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../Backend/.env') });

async function cleanup() {
  console.log("🧹 Starting stale contacts cleanup...");

  // 1. Delete all contacts.json files on disk
  const backendDir = path.join(__dirname, '../Backend');
  const items = fs.readdirSync(backendDir);
  let filesDeleted = 0;

  for (const item of items) {
    if (item.startsWith('auth_info_')) {
      const contactFile = path.join(backendDir, item, 'contacts.json');
      if (fs.existsSync(contactFile)) {
        try {
          fs.unlinkSync(contactFile);
          console.log(`🗑️ Deleted disk cache: ${item}/contacts.json`);
          filesDeleted++;
        } catch (e) {
          console.warn(`Could not delete ${contactFile}:`, e.message);
        }
      }
    }
  }
  console.log(`✅ Deleted ${filesDeleted} contacts.json files from disk.`);

  // 2. Clear MongoDB WhatsAppContact collection
  if (process.env.MONGO_URI) {
    try {
      console.log("Connecting to MongoDB Atlas...");
      await mongoose.connect(process.env.MONGO_URI);
      const collections = await mongoose.connection.db.listCollections().toArray();
      const colNames = collections.map(c => c.name);
      console.log("Collections:", colNames.filter(n => n.toLowerCase().includes('contact')));

      const whatsappContactCollection = mongoose.connection.collection('whatsappcontacts');
      const count = await whatsappContactCollection.countDocuments();
      console.log(`Found ${count} records in whatsappcontacts.`);

      if (count > 0) {
        const delRes = await whatsappContactCollection.deleteMany({});
        console.log(`✅ Cleared ${delRes.deletedCount} old WhatsApp contact records from MongoDB.`);
      }

      await mongoose.disconnect();
    } catch (err) {
      console.error("MongoDB cleanup error:", err.message);
    }
  }

  console.log("🎉 Stale contacts cleanup complete!");
}

cleanup();
