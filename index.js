const express = require("express");
const app = express();
const port = process.env.port || 3000;
const cors = require("cors");
app.use(express.json());
app.use(cors());

app.get("/", (res, req) => {
  req.send("hello i am server");
});

app.listen(port, () => {
  console.log(`server on in this port ${port}`);
});
