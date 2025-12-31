const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const DB_NAME = 'arrow_gacha';
const COLLECTION = 'storage';

let client;
let collection;

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!uri) {
      return res.status(500).json({ error: 'MONGODB_URI missing' });
    }

    if (!client) {
      client = new MongoClient(uri);
      await client.connect();
      collection = client.db(DB_NAME).collection(COLLECTION);
      await collection.createIndex({ key: 1 }, { unique: true });
    }

    const { action, key, value } = req.body || {};

    if (action === 'list') {
      const regex = new RegExp(`^${key || ''}`);
      const docs = await collection.find({ key: { $regex: regex } }).toArray();
      return res.status(200).json({ keys: docs.map(d => d.key) });
    }

    if (action === 'get') {
      const doc = await collection.findOne({ key });
      return res.status(200).json({ value: doc?.value ?? null });
    }

    if (action === 'set') {
      await collection.updateOne(
        { key },
        { $set: { key, value, updatedAt: new Date() } },
        { upsert: true }
      );
      return res.status(200).json({ success: true });
    }

    if (action === 'delete') {
      await collection.deleteOne({ key });
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
