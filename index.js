const jwt = require("jsonwebtoken");
const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
const { ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();

// middleware
app.use(cors());
app.use(express.json());

// verify token here
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rms22hp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const webCollection = client.db("DarkTechWeb").collection("webs");
    const appCollection = client.db("DarkTechWeb").collection("apps");
    const reviewCollection = client.db("DarkTechWeb").collection("reviews");
    const teamCollection = client.db("DarkTechWeb").collection("teams");
    const userCollection = client.db("DarkTechWeb").collection("users");

    // verify admin here...................................................................

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user?.role !== "admin") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };

    // token related api....................................................................
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "12h",
      });
      res.send({ token });
    });

    // user related api....................................................................
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
      // console.log(result);
    });

    app.get("/users", verifyJWT, async (req, res) => {
      const result = await userCollection.find().toArray();
      // console.log(result);
      res.send(result);
    });

    app.get("/users/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ admin: false });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      console.log(result);
      res.send(result);
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    //  web related api.....................................................................
    app.get("/webs", async (req, res) => {
      const cursor = webCollection.find();
      const result = await cursor.toArray();
      // console.log(result);
      res.send(result);
    });

    //  app related api.....................................................................
    app.get("/apps", async (req, res) => {
      const cursor = appCollection.find();
      const result = await cursor.toArray();
      // console.log(result);
      res.send(result);
    });

    // review related api..................................................................
    app.get("/reviews", async (req, res) => {
      const cursor = reviewCollection.find();
      const result = await cursor.toArray();
      // console.log(result);
      res.send(result);
    });
    app.delete("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
      // console.log(result);
    });
    // team related api..................................................................
    app.get("/teams", async (req, res) => {
      const cursor = teamCollection.find();
      const result = await cursor.toArray();
      // console.log(result);
      res.send(result);
    });

    // .............................................................................
    // Send a ping to confirm a successful connection...............................
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// check check check
app.get("/", (req, res) => {
  res.send("dark tech server is running.");
});
app.listen(port, () => {
  console.log(`dark tech server is runnung on port: ${port}`);
});

// //  menu related api.....................................................................
// app.get("/menues", async (req, res) => {
//   const cursor = menuCollection.find();
//   const result = await cursor.toArray();
//   res.send(result);
// });
// app.post("/menues", verifyJWT, verifyAdmin, async (req, res) => {
//   const newItem = req.body;
//   const result = await menuCollection.insertOne(newItem);
//   res.send(result);
// });
// app.delete("/menu/:id", verifyJWT, verifyAdmin, async (req, res) => {
//   const id = req.params.id;
//   const query = { _id: new ObjectId(id) };
//   const result = await menuCollection.deleteOne(query);
//   res.send(result);
// });

// // cart related api.....................................................................
// app.post("/carts", async (req, res) => {
//   const item = req.body;
//   // console.log(item);
//   const result = await cartCollection.insertOne(item);
//   res.send(result);
// });
// app.get('/carts', verifyJWT, async (req, res) => {
//   const email = req.query.email;

//   if (!email) {
//     res.send([]);
//   }

//   const decodedEmail = req.decoded.email;
//   if (email !== decodedEmail) {
//     return res.status(403).send({ error: true, message: 'forbidden access' })
//   }

//   const query = { email: email };

//   const cursor = await cartCollection.find(query);
//   const result = await cursor.toArray();
//   res.send(result);
// });
// app.delete("/carts/:id", async (req, res) => {
//   const id = req.params.id;
//   const query = { _id: new ObjectId(id) };
//   const result = await cartCollection.deleteOne(query);
//   res.send(result);
// });


// no need just try for fun.....................................................................................................................................................

 //   app.delete("/reviews/:id", async (req, res) => {
  //     try {
  //         const id = req.params.id;
  //         const query = { _id: new ObjectId(id) };
  //         const result = await reviewCollection.deleteOne(query);
          
  //         if (result.deletedCount === 1) {
  //             res.status(200).json({ message: "Review deleted successfully" });
  //         } else {
  //             res.status(404).json({ message: "Review not found or already deleted" });
  //         }
  //     } catch (error) {
  //         console.error("Error deleting review:", error);
  //         res.status(500).json({ message: "Internal server error" });
  //     }
  // });