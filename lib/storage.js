const { MongoClient, ServerApiVersion } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'arrow_gacha';
const COLLECTION_NAME = 'lib';

let client;
let collection;

async function connect() {
  if (collection) return;

  client = new MongoClient(MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  const db = client.db(DB_NAME);
  collection = db.collection(COLLECTION_NAME);
  await collection.createIndex({ key: 1 }, { unique: true });
}

module.exports = async function handler(req, res) {
  // 🔥 CORS HEADERS (WAJIB)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 🔥 HANDLE PREFLIGHT
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await connect();
    const { action, key, value } = req.body || {};

    if (action === 'get') {
      const doc = await collection.findOne({ key });
      return res.json({ value: doc?.value ?? null });
    }

    if (action === 'set') {
      await collection.updateOne(
        { key },
        { $set: { key, value, updatedAt: new Date() } },
        { upsert: true }
      );
      return res.json({ success: true });
    }

    if (action === 'list') {
      const regex = new RegExp(`^${key || ''}`);
      const docs = await collection.find({ key: { $regex: regex } }).toArray();
      return res.json({ keys: docs.map(d => d.key) });
    }

    if (action === 'delete') {
      await collection.deleteOne({ key });
      return res.json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

