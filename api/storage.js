const { MongoClient, ServerApiVersion } = require('mongodb');

module.exports = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');

    // TEST 1: ENV
    if (!process.env.MONGODB_URI) {
      return res.status(500).json({
        step: 'env',
        error: 'MONGODB_URI is undefined'
      });
    }

    // TEST 2: MongoClient init
    const client = new MongoClient(process.env.MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    // TEST 3: Connect
    await client.connect();

    // TEST 4: Ping
    await client.db('admin').command({ ping: 1 });

    return res.status(200).json({
      step: 'ok',
      message: 'MongoDB connected'
    });
  } catch (err) {
    return res.status(500).json({
      step: 'catch',
      error: err.message,
      stack: err.stack
    });
  }
};
