import { dbConnection } from "./init";
import { collection, getDocs, query } from "firebase/firestore";

export const getAll = async () => {
  const users = collection(dbConnection, "users");
  const querySnapshot = await getDocs(query(users));
  const allData = querySnapshot.docs.map((project) => project.data());
  return allData
};
