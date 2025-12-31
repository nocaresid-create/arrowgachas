import { MongoClient, ServerApiVersion } from 'mongodb';

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://Vercel-Admin-arrow:pzQU2TbCddRBflF4@arrow.tjc24he.mongodb.net/?retryWrites=true&w=majority';

const DB_NAME = 'arrow_gacha';
const COLLECTION_NAME = 'storage';

let client;
let db;
let collection;

async function connectToMongoDB() {
  if (collection) return;

  try {
    client = new MongoClient(MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    await client.connect();

    db = client.db(DB_NAME);
    collection = db.collection(COLLECTION_NAME);

    // pastikan key unik
    await collection.createIndex({ key: 1 }, { unique: true });

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  const { method } = req;
  const { action, key, value } = req.body || {};

  try {
    await connectToMongoDB();

    if (method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).end(`Method ${method} Not Allowed`);
    }

    if (action === 'get') {
      const doc = await collection.findOne({ key });
      if (!doc) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.status(200).json({ value: doc.value });
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
      const regex = new RegExp(`^${key}`);
      const docs = await collection
        .find({ key: { $regex: regex } })
        .toArray();

      return res.status(200).json({
        keys: docs.map((doc) => doc.key),
      });
    }

    if (action === 'delete') {
      await collection.deleteOne({ key });
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
