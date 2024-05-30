const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");
const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
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
    const usersCollection = client.db("resto_eat").collection("users");

    //middleware //verifyToken
    const verifyToken = (req, res, next) => {
      // console.log(req.headers, "verify");
      if (!req.headers.authorization) {
        res.status(401).send({ message: "Forbidden access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          res.status(401).send("Forbidden access");
        } else {
          req.decoded = decoded;
          next();
        }
      });
    };

    //jwt token
    app.post("/jwt", async (req, res) => {
      const userEmail = req.body?.email;
      // console.log(userEmail);
      const token = jwt.sign({ userEmail }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });
      res.send({ token });
    });

    app.get("/user/admin/:email", verifyToken, async (req, res) => {
      try {
        const email = req.params.email;
        const decodedEmail = await req?.decoded?.userEmail;
        if (email === decodedEmail) {
          const query = { userEmail: email };
          const result = await usersCollection.findOne(query);
          const role = result?.role;
          console.log(result);

          if (role) {
            console.log(role, email, result);
            return res.send({ role: role });
          } else {
            console.log(role, email, result);
            return res.send({ role: null });
          }
        }
        return res.status(403).send({ message: "Unauthorized access" });
      } catch (error) {
        console.error("Error:", error);
        return res.status(500).send({ message: "Internal Server Error" });
      }
    });

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

    //store users info
    app.post("/users", async (req, res) => {
      const user = await req?.body;
      //checking user email exists or not in DB
      const query = { userEmail: user?.userEmail };
      const emailExists = await usersCollection.findOne(query);
      if (emailExists) {
        return res.send({ message: "Email already exists!", insertedId: null });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    //get all user
    app.get("/users", verifyToken, async (req, res) => {
      // console.log(req.headers);
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    //delete a user
    app.delete("/users/:id", async (req, res) => {
      const userId = req.params.id;
      const query = { _id: new ObjectId(userId) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    //role user to admin
    app.patch("/user/admin/:id", async (req, res) => {
      const userId = req.params.id;
      const newRole = await req.body?.role;
      const filter = { _id: new ObjectId(userId) };

      const updateDoc = {
        $set: {
          role: newRole,
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
  } catch (error) {
    console.log("Server Connection Failed!");
  }
}
run();
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
