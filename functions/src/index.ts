import { Express } from "express";
import {
    addTaskToProject,
  getAllUsers,
  getUser,
  getUserProjects,
  newProject,
  newUser,
} from "./database/database_access";
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

app.get("/users", async (req, res) => {
  try {
    const users = await getAllUsers();
    res.status(200).send(users);
  } catch (e) {
    res.status(500).send({ message: e });
  }
});

app.post("/users", async (req, res) => {
  const user = req.body;
  try {
    await newUser(user);
    res.status(201).end();
  } catch (e) {
    res.status(500).send({ message: e });
  }
});

app.get("/users/:google_id", async (req, res) => {
  const id = req.params.google_id;
  try {
    const user = await getUser(id);
    res.status(200).send(user);
  } catch (e) {
    res.status(500).send({ message: e });
  }
});

app.post("/projects", async (req, res) => {
  const project = req.body;
  try {
    const newP = await newProject(project);
    res.status(201).send(newP);
  } catch (e) {
    res.status(500).send({ message: e });
  }
});

app.post("/projects/:projectId", async (req, res) => {
  const projectId = req.params.projectId;
  const task = req.body;
  try {
    await addTaskToProject(task, projectId);
    res.status(201).end();
  } catch (e) {
    res.status(500).send({ message: e });
  }
});

app.get("/projects/:google_id", async (req, res) => {
  const id = req.params.google_id;
  try {
    const projects = await getUserProjects(id);
    res.status(200).send(projects);
  } catch (e) {
    res.status(500).send({ message: e });
  }
});

exports.app = functions.https.onRequest(app);
