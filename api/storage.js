const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;
const DB_NAME = 'arrow_gacha';
const COLLECTION = 'storage';

let cached = global._mongo;
if (!cached) {
  cached = global._mongo = { conn: null, promise: null };
}

async function connect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    cached.promise = client.connect().then(client => {
      return {
        client,
        collection: client.db(DB_NAME).collection(COLLECTION),
      };
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!uri) {
      return res.status(500).json({ error: 'MONGODB_URI missing' });
    }

    const { collection } = await connect();
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
    console.error('API ERROR:', err);
    return res.status(500).json({ error: err.message });
  }
};
