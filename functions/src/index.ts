import { Express } from "express";
import {
  addNotificationToUser,
  addTaskToProject,
  changeCompletionOfStep,
  changeStatusOfTask,
  deleteProjectById,
  deleteTaskById,
  getAllUsers,
  getNotificationsByUserId,
  getTasksByProjectId,
  getUser,
  getUserProjects,
  newProject,
  newProjectWithTasks,
  newUser,
  resolveNotification,
} from "./database/database_access";
import { addProjectToUser } from "./database/database_access";
import { chatWithProjectAssistant } from "./openIA/openIA";
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

app.post("/projects/ai", async (req, res) => {
  const project = req.body;
  try {
    const newP = await newProjectWithTasks(project);
    res.status(201).send(newP);
  } catch (e) {
    res.status(500).send({ message: e });
  }
});

app.post("/projects/chatbox", async (req, res) => {
  const query = req.body.message;
  const project = req.body.project;
  const messageHistory = req.body.messageHistory;

  try {
    const newP = await chatWithProjectAssistant(project, query, messageHistory);
    res.status(201).send(newP);
  } catch (e) {
    res.status(500).send({ message: e });
  }
});

app.post("/projects/:projectId", async (req, res) => {
  const projectId = req.params.projectId;
  const task = req.body;
  try {
    const newT = await addTaskToProject(task, projectId);
    res.status(201).send(newT);
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

app.delete("/projects/:projectId", async (req, res) => {
  const id = req.params.projectId;
  try {
    deleteProjectById(id);
    res.status(201).end();
  } catch (e) {
    res.status(500).send({ message: e });
  }
});

app.delete("/projects/:projectId/:taskId", async (req, res) => {
  const projectId = req.params.projectId;
  const taskId = req.params.taskId;
  try {
    await deleteTaskById(projectId, taskId);
    res.status(201).end();
  } catch (e) {
    res.status(500).send({ message: e });
  }
});

app.get("/projects/:projectId/tasks", async (req, res) => {
  const projectId = req.params.projectId;
  try {
    const tasks = await getTasksByProjectId(projectId);
    res.status(200).send(tasks);
  } catch (e) {
    res.status(500).send({ message: e });
  }
});

app.patch("/projects/:projectId/:taskId", async (req, res) => {
  const projectId = req.params.projectId;
  const taskId = req.params.taskId;
  const status = req.body.status;
  const collaborator = req.body.collaborator;

  try {
    await changeStatusOfTask(projectId, taskId, status, collaborator);
    res.status(201).end();
  } catch (e) {
    res.status(500).send({ message: e });
  }
});

app.patch(`/projects/:projectId/users/:userId`, async (req, res) => {
  const userId = req.params.userId;
  const projectId = req.params.projectId;
  try {
    addProjectToUser(userId, projectId);
  } catch (e) {
    res.status(500).send({ message: e });
  }
});

app.patch(`/projects/sendnotification`, async (req, res) => {
  const { sender_username, collaborator_mail, project_id } = req.body;

  try {
    await addNotificationToUser(project_id, sender_username, collaborator_mail);
    res.status(201).end();
  } catch (e) {
    res.status(500).end();
  }
});

app.get(`/users/:userId/notifications`, async (req, res) => {
  const user_id = req.params.userId;
  try {
    const notifications = await getNotificationsByUserId(user_id);
    res.status(201).send(notifications);
  } catch (e) {
    res.status(500).send({
      e,
    });
  }
});

app.post(`/users/:userId/notifications/:projectId`, async (req, res) => {
  const user_id = req.params.userId;
  const project_id = req.params.projectId;
  const { action, user_name } = req.body;
  try {
    await resolveNotification(project_id, user_id, action, user_name);
    res.status(201).end();
  } catch (e) {
    res.status(500).send({
      e,
    });
  }
});

app.patch("/projects/:projectId/:taskId/:stepTitle", async (req, res) => {
  const projectId = req.params.projectId;
  const taskId = req.params.taskId;
  const stepTitle = req.params.stepTitle;

  try {
    await changeCompletionOfStep(projectId, taskId, stepTitle);
    res.status(201).end();
  } catch (e) {
    res.status(500).send({ message: e });
  }
});

exports.app = functions.https.onRequest(app);
