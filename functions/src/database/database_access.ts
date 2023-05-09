import uuid4 = require("uuid4");
import { Project, Task, User } from "../types/types";
import { dbConnection } from "./init";
import {
  collection,
  getDocs,
  query,
  setDoc,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  deleteDoc,
  arrayRemove,
  where,
} from "firebase/firestore";
import { getTasksWithParameters } from "../openIA/openIA";

export const getAllUsers = async () => {
  const users = collection(dbConnection, "users");
  const querySnapshot = await getDocs(query(users));
  const allData = querySnapshot.docs.map((project) => project.data());
  return allData;
};

export const newUser = async (user: User) => {
  const userExists = await getUser(user.google_id);
  console.log(userExists);
  if (userExists === undefined) {
    const date = new Date().toISOString();
    await setDoc(doc(dbConnection, "users", user.google_id), {
      email: user.email,
      projects: [],
      created: date,
      notifications: [],
    });
  }
};

export const getUser = async (google_id: string) => {
  const docRef = doc(dbConnection, "users", google_id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as User;
  } else {
    return undefined;
  }
};

export const newProjectWithTasks = async (project: Project) => {
  const id = uuid4();
  const date = new Date().toISOString();

  const generatedTasks = await getTasksWithParameters(
    project.title,
    project.description
  );

  await setDoc(doc(dbConnection, "projects", id), {
    title: project.title,
    description: project.description,
    tasks: generatedTasks,
    owner: project.owner,
    created: date,
    collaborators: project.collaborators,
  });
  await addProjectToUser(project.owner, id);
  const newP = await getProjectById(id);
  return { ...newP, project_id: id };
};

export const newProject = async (project: Project) => {
  const id = uuid4();
  const date = new Date().toISOString();

  await setDoc(doc(dbConnection, "projects", id), {
    title: project.title,
    description: project.description,
    tasks: [],
    owner: project.owner,
    created: date,
    collaborators: project.collaborators,
  });
  await addProjectToUser(project.owner, id);
  const newP = await getProjectById(id);
  return { ...newP, project_id: id };
};

export const getUserProjects = async (google_id: string) => {
  let user: User | undefined;
  try {
    user = await getUser(google_id);
  } catch (e) {
    return [];
  }
  const projects: Project[] = [];
  for (const p of user!.projects!) {
    const project = await getProjectById(p);
    if (project) {
      projects.push({ ...project, project_id: p });
    } else {
      deleteProjectFromUser(google_id, p);
    }
  }
  return projects;
};

export const getProjectById = async (projectId: string) => {
  const docRef = doc(dbConnection, "projects", projectId);
  const docSnap = await getDoc(docRef);
  return docSnap.data() as Project;
};

export const addProjectToUser = async (
  google_id: string,
  projectId: string
) => {
  const userRef = doc(dbConnection, "users", google_id);
  await updateDoc(userRef, {
    projects: arrayUnion(projectId),
  });
};

export const addTaskToProject = async (task: Task, projectId: string) => {
  const userRef = doc(dbConnection, "projects", projectId);
  const id = uuid4();
  await updateDoc(userRef, {
    tasks: arrayUnion({ ...task, taskId: id }),
  });
  return { ...task, taskId: id };
};

export const deleteProjectById = async (id: string) => {
  await deleteDoc(doc(dbConnection, "projects", id));
};

export const deleteTaskById = async (projectId: string, taskId: string) => {
  const projectRef = doc(dbConnection, "projects", projectId);
  const projectTemp = (await getDoc(projectRef)).data() as Project;
  projectTemp.tasks = projectTemp.tasks.filter((t) => t.taskId !== taskId);
  setDoc(projectRef, { tasks: projectTemp.tasks }, { merge: true });
};

export const getTasksByProjectId = async (projectId: string) => {
  const project = await getProjectById(projectId);
  return project.tasks;
};

export const changeCompletionOfStep = async (
  projectId: string,
  taskId: string,
  stepTitle: string
) => {
  const projectRef = doc(dbConnection, "projects", projectId);
  const projectTemp = (await getDoc(projectRef)).data() as Project;
  projectTemp.tasks.forEach((t) => {
    if (t.taskId === taskId) {
      t.steps.forEach((s) => {
        if (s.name === stepTitle) {
          s.completed = !s.completed;
        }
      });
    }
  });
  setDoc(projectRef, { tasks: projectTemp.tasks }, { merge: true });
};

export const deleteProjectFromUser = async (
  userId: string,
  projectId: string
) => {
  const userRef = doc(dbConnection, "users", userId);
  await updateDoc(userRef, {
    projects: arrayRemove(projectId),
  });
};

export const changeStatusOfTask = async (
  projectId: string,
  taskId: string,
  status: string,
  collaborator: string
) => {
  const projectRef = doc(dbConnection, "projects", projectId);
  const projectTemp = (await getDoc(projectRef)).data() as Project;
  projectTemp.tasks.forEach((t) => {
    if (t.taskId === taskId) {
      t.state = status;
      t.collaborator = collaborator;
    }
  });
  setDoc(projectRef, { tasks: projectTemp.tasks }, { merge: true });
};

export const addNotificationToUser = async (
  projectId: string,
  sender_username: string,
  collaboratorEmail: string
) => {
  const usersRef = collection(dbConnection, "users");
  const q = query(usersRef, where("email", "==", collaboratorEmail));
  const querySnapshot = await getDocs(q);
  const project = await getProjectById(projectId);
  await updateDoc(querySnapshot.docs[0].ref, {
    notifications: arrayUnion({
      project_id: projectId,
      user_username: sender_username,
      projectName: project.title,
    }),
  });
};

export const getNotificationsByUserId = async (userId: string) => {
  const user = await getUser(userId);
  return user?.notifications;
};

export const resolveNotification = async (
  projectId: string,
  userId: string,
  action: string,
  username: string
) => {
  const userRef = doc(dbConnection, "users", userId);
  const projectRef = doc(dbConnection, "projects", projectId);
  const userSnap = await getDoc(userRef);
  let notifications = (userSnap.data() as User).notifications;
  notifications = notifications.filter((n) => n.project_id !== projectId);
  await updateDoc(userRef, {
    notifications: notifications,
  });
  if (action == "accept") {
    await updateDoc(userRef, {
      projects: arrayUnion(projectId),
    });
    await updateDoc(projectRef, {
      collaborators: arrayUnion({ user_name: username, user_id: userId }),
    });
  }
};
