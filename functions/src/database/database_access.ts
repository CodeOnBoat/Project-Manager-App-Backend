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
} from "firebase/firestore";

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

export const newProject = async (project: Project) => {
  const id = uuid4();
  const date = new Date().toISOString();
  await setDoc(doc(dbConnection, "projects", id), {
    title: project.title,
    description: project.description,
    tasks: [],
    owner: project.owner,
    created: date,
  });
  await addProjectToUser(project.owner, id);
  const newP = await getProjectById(id);
  return { ...newP, project_id: id };
};

export const getUserProjects = async (google_id: string) => {
  const user: User | undefined = await getUser(google_id);
  const projects: Project[] = [];
  for (const p of user?.projects!) {
    const project = await getProjectById(p);
    projects.push({ ...project, project_id: p });
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
  await updateDoc(userRef, {
    tasks: arrayUnion(task),
  });
};
