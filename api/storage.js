const { MongoClient, ServerApiVersion } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'arrow_gacha';
const COLLECTION_NAME = 'storage';

let client;
let collection;

async function getBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

async function connectMongo() {
  if (collection) return;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI not set');
  }

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
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await connectMongo();

    const body = await getBody(req);
    const { action, key, value } = body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

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
      const docs = await collection.find({}).toArray();
      return res.json({ keys: docs.map(d => d.key) });
    }

    if (action === 'delete') {
      await collection.deleteOne({ key });
      return res.json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    console.error('API ERROR:', err);
    return res.status(500).json({
      error: err.message,
    });
  }
};
