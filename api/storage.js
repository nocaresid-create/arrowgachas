const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'arrow_gacha';
const COLLECTION = process.env.MONGODB_COLLECTION || 'storage';

let cached = global._mongo;
if (!cached) cached = global._mongo = { conn: null, promise: null };

function escapeRegex(s){ return String(s || '').replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'); }

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
      const collection = client.db(DB_NAME).collection(COLLECTION);
      collection.createIndex({ key: 1 }).catch(() => {});
      return { client, collection };
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = async function handler(req, res) {
  // Allow simple CORS for browser testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    if (!uri) {
      console.error('MONGODB_URI missing');
      return res.status(500).json({ error: 'MONGODB_URI missing — set environment variable' });
    }

    let conn;
    try { conn = await connect(); } catch (e) {
      console.error('Mongo connect error', e && e.message ? e.message : e);
      return res.status(500).json({ error: 'Failed to connect to MongoDB: ' + (e && e.message ? e.message : String(e)) });
    }

    const { collection } = conn;
    const { action } = req.body || {};

    if (!action) return res.status(400).json({ error: 'action required' });

    if (action === 'list') {
      const prefix = req.body.key || '';
      const regex = new RegExp('^' + escapeRegex(prefix));
      const docs = await collection.find({ key: { $regex: regex } }).toArray();
      return res.status(200).json({ keys: docs.map(d => d.key) });
    }

    if (action === 'get') {
      const key = req.body.key;
      if (!key) return res.status(400).json({ error: 'key required for get' });
      const doc = await collection.findOne({ key });
      return res.status(200).json({ value: doc?.value ?? null, key: doc?.key });
    }

    if (action === 'set') {
      const key = req.body.key;
      const value = req.body.value;
      if (!key) return res.status(400).json({ error: 'key required for set' });
      await collection.updateOne({ key }, { $set: { key, value, updatedAt: new Date() } }, { upsert: true });
      return res.status(200).json({ success: true });
    }

    if (action === 'delete') {
      const key = req.body.key;
      if (!key) return res.status(400).json({ error: 'key required for delete' });
      await collection.deleteOne({ key });
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    console.error('API ERROR:', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: err && err.message ? err.message : String(err) });
  }
};
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || '';
const dbName = process.env.MONGODB_DB || 'arrowgachas';

let cachedClient = null;

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function connect() {
  if (!uri) throw new Error('MONGODB_URI not set');
  if (cachedClient) return cachedClient;
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  cachedClient = client;
  return cachedClient;
}

module.exports = async function (req, res) {
  try {
    if (!uri) return res.status(500).json({ error: 'MONGODB_URI environment variable is required' });

    const client = await connect();
    const db = client.db(dbName);
    const coll = db.collection('kv');

    // ensure index on key
    await coll.createIndex({ key: 1 }, { unique: true }).catch(() => {});

    const body = req.body || {};
    const action = (body.action || req.query.action || '').toString();

    switch (action) {
      case 'get': {
        const key = body.key || req.query.key;
        if (!key) return res.status(400).json({ error: 'key required' });
        const doc = await coll.findOne({ key });
        if (!doc) return res.json(null);
        return res.json({ key: doc.key, value: doc.value, updatedAt: doc.updatedAt });
      }

      case 'set': {
        const key = body.key || req.query.key;
        const value = body.value;
        if (!key) return res.status(400).json({ error: 'key required' });
        await coll.updateOne({ key }, { $set: { key, value: typeof value === 'string' ? value : JSON.stringify(value), updatedAt: new Date() } }, { upsert: true });
        return res.json({ ok: true });
      }

      case 'list': {
        const prefix = body.key || body.prefix || req.query.key || '';
        const q = prefix ? { key: { $regex: `^${escapeRegex(prefix)}` } } : {};
        const cursor = coll.find(q).project({ key: 1, _id: 0 });
        const docs = await cursor.toArray();
        return res.json({ keys: docs.map(d => d.key) });
      }

      case 'delete': {
        const key = body.key || req.query.key;
        if (!key) return res.status(400).json({ error: 'key required' });
        await coll.deleteOne({ key });
        return res.json({ ok: true });
      }

      default:
        return res.status(400).json({ error: 'unknown action' });
    }
  } catch (err) {
    console.error('storage API error', err);
    return res.status(500).json({ error: err.message || 'internal error' });
  }
};
