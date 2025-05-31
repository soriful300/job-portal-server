require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.port || 3000;
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@userdatabase.06ovt0z.mongodb.net/?retryWrites=true&w=majority&appName=userDatabase`;

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
    const jobsCollection = client.db("job-portal").collection("job-collection");
    const submitJobCollection = client
      .db("job-portal")
      .collection("submit-job");

    const logger = (req, res, next) => {
      console.log("inside the logger middleware");
      next();
    };f
    const VerifyToken = (req, res, next) => {
      const token = req.cookies.token;
      console.log("cookie in the middleware", token);
      if (!token) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        console.log(decoded);
      });
      next();
    };

    app.post("/jwt", async (req, res) => {
      const { email } = req.body;
      const userData = { email };
      const token = jwt.sign(userData, process.env.JWT_ACCESS_SECRET, {
        expiresIn: "1d",
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
      });
      res.send("Logged in, token set in cookie!");
    });

    app.get("/jobs/applications/:email", async (req, res) => {
      const email = req.params.email;
      const query = { hr_email: email };
      const jobs = await jobsCollection.find(query).toArray();

      for (const job of jobs) {
        const applicationQuery = { id: job._id.toString() };

        const application_count = await submitJobCollection.countDocuments(
          applicationQuery
        );

        job.application_count = application_count;
      }
      res.send(jobs);
    });

    app.get("/jobs", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.hr_email = email;
      }
      const result = await jobsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    app.post("/addNewJob", async (req, res) => {
      const {
        title,
        location,
        jobType,
        category,
        applicationDeadline,
        salaryRange,
        description,
        company,
        requirements,
        responsibilities,
        status,
        hr_email,
        hr_name,
        company_logo,
      } = req.body;
      const doc = {
        title,
        location,
        jobType,
        category,
        applicationDeadline,
        salaryRange,
        description,
        company,
        requirements,
        responsibilities,
        status,
        hr_email,
        hr_name,
        company_logo,
      };
      const result = await jobsCollection.insertOne(doc);
      res.send(result);

      f;
    });

    app.post("/submitInfo", (req, res) => {
      const { linkedin, gitHub, resume, name, email, id } = req.body;

      const doc = {
        linkedin: linkedin,
        gitHub: gitHub,
        resume: resume,
        name: name,
        email: email,
        id: id,
      };
      const result = submitJobCollection.insertOne(doc);
      res.send(result);
    });

    app.get("/singleUserData/:email", logger, VerifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await submitJobCollection.find(query).toArray();
      for (const application of result) {
        const applicationId = application.id;
        const jobQuery = { _id: new ObjectId(applicationId) };
        const job = await jobsCollection.findOne(jobQuery);
        application.company = job.company;
        application.title = job.title;
        application.company_log = job.company_logo;
      }
      res.send(result);
    });

    app.patch("/statusUpdate/:id", async (req, res) => {
      const id = req.params.id;
      const status = req.body;

      const query = { _id: new ObjectId(id) };
      const doc = {
        $set: status,
      };
      const result = await submitJobCollection.updateOne(query, doc);
      res.send(result);
    });

    app.get("/application/job/:job_id", async (req, res) => {
      const job_id = req.params.job_id;
      const query = { id: job_id };
      const result = await submitJobCollection.find(query).toArray();
      res.send(result);
    });

    await client.connect();
    // Send a ping to confirm a successful connection
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

app.get("/", (res, req) => {
  req.send("hello i am server");
});

app.listen(port, () => {
  console.log(`server on in this port ${port}`);
});
