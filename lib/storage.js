const { MongoClient, ServerApiVersion } = require('mongodb');

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://Vercel-Admin-arrow:pzQU2TbCddRBflF4@arrow.tjc24he.mongodb.net/?retryWrites=true&w=majority';

const DB_NAME = 'arrow_gacha';
const COLLECTION_NAME = 'storage';

let client;
let collection;

async function connectToMongoDB() {
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
  // ⛔ BLOK GET / OPTIONS / DLL
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { action, key, value } = req.body || {};

  try {
    await connectToMongoDB();

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

    if (action === 'list') {
      const regex = new RegExp(`^${key || ''}`);
      const docs = await collection.find({ key: { $regex: regex } }).toArray();
      return res.status(200).json({ keys: docs.map(d => d.key) });
    }

    if (action === 'delete') {
      await collection.deleteOne({ key });
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
