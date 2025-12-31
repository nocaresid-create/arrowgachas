// Clean, single-implementation storage API (FIXED)

const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'arrow_gacha';
const COLLECTION = process.env.MONGODB_COLLECTION || 'storage';

// Global cache (penting untuk Vercel / serverless)
let cached = global._mongo;
if (!cached) {
  cached = global._mongo = { conn: null, promise: null };
}

function escapeRegex(s) {
  return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

    cached.promise = client.connect().then((client) => {
      const collection = client.db(DB_NAME).collection(COLLECTION);
      collection.createIndex({ key: 1 }).catch(() => {});
      return { client, collection };
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = async function handler(req, res) {
  // Minimal CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!uri) {
    return res.status(500).json({
      error: 'MONGODB_URI missing — set environment variable',
    });
  }

  try {
    const { collection } = await connect();
    const body = req.body || {};
    const action = String(body.action || '');

    if (!action) {
      return res.status(400).json({ error: 'action required' });
    }

    // =========================
    // ACTION: LIST
    // =========================
    if (action === 'list') {
      const prefix = body.key || body.prefix || '';
      const regex = new RegExp('^' + escapeRegex(prefix));
      const docs = await collection.find({ key: { $regex: regex } }).toArray();
      return res.status(200).json({
        keys: docs.map((d) => d.key),
      });
    }

    // =========================
    // ACTION: GET
    // =========================
    if (action === 'get') {
      const key = body.key;
      if (!key) {
        return res.status(400).json({ error: 'key required for get' });
      }
      const doc = await collection.findOne({ key });
      return res.status(200).json({
        key,
        value: doc ? doc.value : null,
      });
    }

    // =========================
    // ACTION: SET
    // =========================
    if (action === 'set') {
      const { key, value } = body;
      if (!key) {
        return res.status(400).json({ error: 'key required for set' });
      }

      await collection.updateOne(
        { key },
        { $set: { key, value, updatedAt: new Date() } },
        { upsert: true }
      );

      return res.status(200).json({ success: true });
    }

    // =========================
    // ACTION: DELETE
    // =========================
    if (action === 'delete') {
      const key = body.key;
      if (!key) {
        return res.status(400).json({ error: 'key required for delete' });
      }

      await collection.deleteOne({ key });
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    console.error('API ERROR:', err);
    return res.status(500).json({
      error: err.message || String(err),
    });
  }
};
