const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const verifyRouter = require("./routes/verify.js");
const lotsRouter = require("./routes/lots.js");
const stepsRouter = require("./routes/steps.js");
const actorsRouter = require("./routes/actors.js");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/verify", verifyRouter);
app.use("/lots", lotsRouter);
app.use("/lots", stepsRouter);
app.use("/actors", actorsRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend Vanilla Trace listening on ${PORT}`);
});
