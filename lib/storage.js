const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://Vercel-Admin-arrow:pzQU2TbCddRBflF4@arrow.tjc24he.mongodb.net/?retryWrites=true&w=majority";
const DB_NAME = 'arrow_gacha';
const COLLECTION_NAME = 'storage';

let client;
let db;
let collection;

async function connectToMongoDB() {
  if (!client) {
    try {
      client = new MongoClient(MONGODB_URI);
      await client.connect();
      db = client.db(DB_NAME);
      collection = db.collection(COLLECTION_NAME);
      await collection.createIndex({ key: 1 }, { unique: true });
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }
}

export default async function handler(req, res) {
  const { method } = req;
  const { action, key, value, persistent } = req.body || req.query;

  try {
    await connectToMongoDB();

    if (method === 'POST') {
      if (action === 'get') {
        const doc = await collection.findOne({ key });
        if (doc) {
          res.status(200).json({ value: doc.value });
        } else {
          res.status(404).json({ error: 'Not found' });
        }
      } else if (action === 'set') {
        await collection.updateOne(
          { key },
          { $set: { key, value, updatedAt: new Date() } },
          { upsert: true }
        );
        res.status(200).json({ success: true });
      } else if (action === 'list') {
        const regex = new RegExp(`^${key}`);
        const docs = await collection.find({ key: { $regex: regex } }).toArray();
        res.status(200).json({ keys: docs.map(doc => doc.key) });
      } else if (action === 'delete') {
        await collection.deleteOne({ key });
        res.status(200).json({ success: true });
      } else {
        res.status(400).json({ error: 'Invalid action' });
      }
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
