import { User } from "../types/types";
import { dbConnection } from "./init";
import {
  collection,
  getDocs,
  query,
  setDoc,
  doc,
  getDoc,
} from "firebase/firestore";

export const getAllUsers = async () => {
  const users = collection(dbConnection, "users");
  const querySnapshot = await getDocs(query(users));
  const allData = querySnapshot.docs.map((project) => project.data());
  return allData;
};

export const newUser = async (user: User) => {
  const date = new Date();
  await setDoc(doc(dbConnection, "users", user.google_id), {
    email: user.email,
    projects: [],
    created: date,
  });
};

export const getUser = async (user: User) => {
  const docRef = doc(dbConnection, "users", user.google_id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return undefined;
  }
};
