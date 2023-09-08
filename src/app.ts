import express, { Request, Response } from "express";
import { getDb, connectToDb } from "./db";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import cors from "cors";
import { ISubscription } from "./types";

const SECRET_KEY = process.env.SECRET_KEY || "";
const port = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(cors());

let db: any;

const initServer = async () => {
  try {
    await connectToDb();
    app.listen(port, () => {
      console.log(`app listening on port ${port}`);
    });
    db = getDb();
  } catch (error) {
    console.error("Error connecting to the database", error);
  }
};

initServer();

app.get("/data", async (req: Request, res: Response) => {
  try {
    const data = await db.collection("data").find().toArray();

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error });
  }
});

app.get("/announced", async (req: Request, res: Response) => {
  try {
    const data = await db.collection("announced").find().toArray();

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error });
  }
});

// TODO: comment out this route for now
// app.post("/data", async (req: Request, res: Response) => {
//   try {
//     const result = await db.collection("data").insertOne(req.body);
//     res.status(201).json(result);
//   } catch (error) {
//     res.status(500).json({ error: "Could not create new document" });
//   }
// });

app.patch("/data/:id", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid ObjectId" });
  }

  try {
    jwt.verify(token, SECRET_KEY);

    const result = await db
      .collection("data")
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error });
  }
});

app.patch("/announced", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid ObjectId" });
  }

  const idsToUpdate = req.body.idsToUpdate.map(
    (id: string) => new ObjectId(id)
  );

  try {
    jwt.verify(token, SECRET_KEY);
    const filter = { _id: { $in: idsToUpdate } };
    const update = { $set: { isExecuted: true } };

    const result = await db.collection("announced").updateMany(filter, update);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error });
  }
});

app.get("/creators/:id", (req, res) => {
  if (ObjectId.isValid(req.params.id)) {
    db.collection("creators")
      .findOne({ _id: new ObjectId(req.params.id) })
      .then((doc: any) => {
        res.status(200).json(doc);
      })
      .catch((err: any) => {
        res.status(500).json({ error: "Could not fetch the document" });
      });
  } else {
    res.status(500).json({ error: "Could not fetch the document" });
  }
});

app.patch("/creators/:id", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid ObjectId" });
  }

  try {
    jwt.verify(token, SECRET_KEY);

    const result = await db
      .collection("creators")
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error });
  }
});

app.post("/creators", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    jwt.verify(token, SECRET_KEY);

    const newCreator = req.body;
    const result = await db.collection("creators").insertOne(newCreator);

    res.status(201).json({ result });
  } catch (error) {
    res.status(500).json({ error });
  }
});

app.delete("/creators/:id", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid ObjectId" });
  }

  try {
    jwt.verify(token, SECRET_KEY);

    const result = await db
      .collection("creators")
      .deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Creator not found" });
    }

    res.status(200).json({ message: "Creator deleted successfully" });
  } catch (error) {
    res.status(500).json({ error });
  }
});

app.get("/creators/network/:network", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    jwt.verify(token, SECRET_KEY);

    const network = req.params.network;
    const creators = await db
      .collection("creators")
      .find({ network })
      .toArray();
    res.status(200).json(creators);
  } catch (error) {
    res.status(500).json({ error });
  }
});

app.patch(
  "/creators/network/:network/address/:address",
  async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    try {
      jwt.verify(token, SECRET_KEY);

      const address = req.params.address;
      const network = req.params.network;
      const creator = await db
        .collection("creators")
        .findOne({ address, network });

      if (!creator) {
        return res.status(404).json({ error: "Creator not found" });
      }

      const result = await db
        .collection("creators")
        .updateOne({ address, network }, { $set: req.body });

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error });
    }
  }
);

app.get(
  "/creators/network/:network/address/:address",
  async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    try {
      jwt.verify(token, SECRET_KEY);

      const address = req.params.address;
      const network = req.params.network;
      const creator = await db
        .collection("creators")
        .findOne({ address, network });

      if (!creator) {
        return res.status(404).json({ error: "Creator not found" });
      }

      res.status(200).json(creator);
    } catch (error) {
      res.status(500).json({ error });
    }
  }
);

app.delete(
  "/creators/network/:network/address/:address",
  async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    try {
      jwt.verify(token, SECRET_KEY);

      const address = req.params.address;
      const network = req.params.network;
      const result = await db
        .collection("creators")
        .deleteOne({ address, network });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Creator not found" });
      }

      res.status(200).json({ message: "Creator deleted successfully" });
    } catch (error) {
      res.status(500).json({ error });
    }
  }
);

// add create, update delete subscriptions
app.post("/subscriptions", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  const { creator, supporter, pureProxy, expiresOn, subscribedTime } = req.body;
  if (!creator || !supporter || !pureProxy || !expiresOn) {
    return res.status(400).json({ error: "Missing fields in request body." });
  }

  try {
    jwt.verify(token, SECRET_KEY);

    const newSubscription: ISubscription = {
      creator,
      supporter,
      pureProxy,
      expiresOn,
      subscribedTime,
    };
    const result = await db
      .collection("subscriptions")
      .insertOne(newSubscription);

    res.status(201).json({ result });
  } catch (error) {
    res.status(500).json({ error });
  }
});

app.put("/subscriptions", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  const { creator, supporter, pureProxy, expiresOn } = req.body;

  if (!creator || !supporter) {
    return res.status(400).json({
      error:
        "Both creator and supporter fields are required for identifying the subscription to update.",
    });
  }

  try {
    jwt.verify(token, SECRET_KEY);

    const criteria = {
      creator: creator,
      supporter: supporter,
    };

    const updatedSubscription: Partial<ISubscription> = {};
    if (pureProxy) updatedSubscription.pureProxy = pureProxy;
    if (expiresOn) updatedSubscription.expiresOn = expiresOn;

    const result = await db
      .collection("subscriptions")
      .updateOne(criteria, { $set: updatedSubscription });

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ error: "Subscription not found or no changes made." });
    }

    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error });
  }
});

app.delete("/subscriptions", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  const { creator, supporter } = req.body;
  if (!creator && !supporter) {
    return res.status(400).json({
      error: "Please provide either a creator or a supporter address.",
    });
  }

  try {
    jwt.verify(token, SECRET_KEY);

    let criteria = {} as any;

    if (creator) {
      criteria.creator = creator;
    }

    if (supporter) {
      criteria.supporter = supporter;
    }

    const result = await db.collection("subscriptions").deleteMany(criteria);

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ error: "No subscriptions found for the provided addresses." });
    }

    res.status(200).json({ message: "Subscriptions deleted successfully." });
  } catch (error) {
    res.status(500).json({ error });
  }
});
