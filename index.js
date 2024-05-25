const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");
const { ObjectId } = require("mongodb");
//config
require("dotenv").config();
//middleware
app.use(express.json());
app.use(cors());

//mongodb uri
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.6gnpvdz.mongodb.net`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const menuCollection = client.db("resto_eat").collection("menu");
    const reviewsCollection = client.db("resto_eat").collection("reviews");
    const cartsCollection = client.db("resto_eat").collection("carts");

    // all the items of menu page
    app.get("/menu", async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    });

    //cart post
    app.post("/carts", async (req, res) => {
      const item = req?.body;
      // console.log(item);
      const result = await cartsCollection.insertOne(item);
      res.send(result);
    });

    //get cart data by user
    app.get("/carts", async (req, res) => {
      const email = req?.query?.email;
      const query = { userEmail: email };
      const result = await cartsCollection.find(query).toArray();
      // console.log(result);
      res.send(result);
    });

    //delete user cart from dashboard
    app.delete("/carts/:id", async (req, res) => {
      const itemId = req.params.id;
      // console.log(itemId);
      const query = { _id: new ObjectId(itemId) };
      const result = await cartsCollection.deleteOne(query);
      res.send(result);
    });

    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  } catch (error) {
    console.log("Server Connection Failed!");
  }
}
run();
