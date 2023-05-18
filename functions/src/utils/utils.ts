import { doc, setDoc } from "firebase/firestore";
import {
  addTaskToProject,
} from "../database/database_access";
import { Project, Task } from "../types/types";
import { dbConnection } from "../database/init";
import uuid4 = require("uuid4");

export const extractTaskFromResponse = async (
  project: Project,
  message: string
) => {
  const regex = /\[t\]([\s\S]*)\[t\]/g;
  const task = regex.exec(message);
  if (task !== null) {
    let tasks = JSON.parse(task[1]);
    tasks.forEach((t: Task) => {
      addTaskToProject(t, project.project_id!);
    });
  }
};

// export const extractCommandsFromResponse = (
//   message: string,
//   projectId: string
// ) => {
//   const regex = /\[c\]([\s\S]*)\[c\]/g;
//   const commandReg = regex.exec(message);
//   if (commandReg) {
//     const command = JSON.parse(commandReg[1]);
//     if (command.modTask) {
//       updateTaskById(command.taskId, command.task);
//     } else {
//       deleteTaskById(projectId, command.taskId);
//     }
//   }
//   return message.replace(regex, "");
// };

export const extractSuggestionsFromResponse = (message: string) => {
  const regex = /\[s\]([\s\S]*)\[s\]/g;
  const response = {
    message: message.replace(regex, ""),
    suggestions: [],
  };
  const suggestions = regex.exec(message);
  if (suggestions) {
    response.suggestions = JSON.parse(suggestions[1]);
  }
  return response;
};

export const infoToDB = async (obj?: any) => {
  const id = uuid4();

  await setDoc(doc(dbConnection, "errors", id), {
    obj
  });
};
