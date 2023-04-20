import { Express } from "express";
import { getAll } from "./database/database_access";
var express = require("express");
const functions = require("firebase-functions");

const app: Express = express();

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
const cors = require("cors");
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.get("/test", async (req, res) => {
  try {
    const users = await getAll();
    res.status(200).send(users);
  } catch (e) {
    res.status(500).send({ message: e });
  }
});

exports.app = functions.https.onRequest(app);
