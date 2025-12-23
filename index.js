const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ---------------- MongoDB setup ----------------
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@mordancluster.s5spyh0.mongodb.net/?appName=MordanCluster`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server
    await client.connect();

    const coffeeCollection = client.db("coffeeDB").collection("coffees");
    const userCollection = client.db("coffeeDB").collection("users");

    // ----------- Coffee Related APIs -----------

    // Get all coffees
    app.get("/coffees", async (req, res) => {
      try {
        const coffees = await coffeeCollection.find().toArray();
        res.send(coffees);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch coffees" });
      }
    });

    // Get coffee by ID
    app.get("/coffees/:id", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: "Invalid coffee ID" });
      }
      try {
        const coffee = await coffeeCollection.findOne({
          _id: new ObjectId(id),
        });
        if (!coffee) return res.status(404).send({ error: "Coffee not found" });
        res.send(coffee);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch coffee" });
      }
    });

    // Add new coffee
    app.post("/coffees", async (req, res) => {
      try {
        const newCoffee = req.body;
        const result = await coffeeCollection.insertOne(newCoffee);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to add coffee" });
      }
    });

    // Update coffee by ID
    app.put("/coffees/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedCoffee = req.body;
      const coffeeDoc = { $set: updatedCoffee };
      const result = await coffeeCollection.updateOne(filter, coffeeDoc, {
        upsert: true,
      });
      res.send(result);
    });

    // Delete coffee by ID
    app.delete("/coffees/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await coffeeCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to delete coffee" });
      }
    });

    // ----------- User Related APIs -----------

    app.get("/users", async (req, res) => {
      try {
        const users = await userCollection.find().toArray();
        res.send(users);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch users" });
      }
    });

    app.patch("/users", async (req, res) => {
      const { email, lastSignInTime } = req.body;
      const filter = { email: email };
      const updateDoc = {
        $set: {
          lastSignInTime: lastSignInTime,
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      try {
        const newUser = req.body;
        const result = await userCollection.insertOne(newUser);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to add user" });
      }
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const result = await userCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Ping to test connection
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
  } finally {
    // Keep the connection open for Express
  }
}
run().catch(console.dir);

// ------------- Default route -------------
app.get("/", (req, res) => {
  res.send("Coffee server is getting hotter ☕🔥");
});

// ------------- Start server -------------
app.listen(port, () => {
  console.log(`Coffee server is running on port ${port}`);
});
