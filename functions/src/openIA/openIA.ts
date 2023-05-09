import axios from "axios";
import { Project } from "../types/types";

const sendPrompt = async (
  prompt: string,
  messages: { role: string; content: string }[]
) => {
  const key = "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";
  const client = axios.create({
    headers: { Authorization: "Bearer " + key },
  });
  const res = await client.post("https://api.openai.com/v1/chat/completions", {
    model: "gpt-3.5-turbo",
    messages: [...messages, { role: "user", content: prompt }],
  });
  return res.data.choices[0].message.content;
};

export const getTasksWithParameters = async (
  title: string,
  description: string
) => {
  const prompt = `You are the api for a task management application.
    Act as a project manager.
    At the end of the prompt you will have the title and a short description of a project that someone wants to make. 
    Your work is the following: 
    1 - Study the subject of the project to be able to provide specific and acurate information. You can 
    2 - Extract usefull documentation and guides of completition of similar projects. Youtube videos, blog posts, etc.
    2 - Generate all the tasks needed to complete the project. These should be between 10 and 15 tasks, depending on the complexity of the project. 
    The tasks should be as specific as possible, and should be ordered in a way that makes sense.
    3 - Your response should be in JSON.
    The json will have this structure:

  {
    tasks : [{
      title : a title of the task,
      description : a description of the task. Should be detailed and give simple structured instructions as a string,
      steps : a list of steps to follow in order the complete the current task. every step looks like this: {
        name : name of the step,
        link : a link to documentation on this specific step. The link must recent. Accepted sources are blogs, youtube videos, wikipedia articles...
        linkname : a name for the link of this step,
        completed : set by default to false
      }
      time : estimated time it will take to make it,
      state : set by default to 'notstarted',
      taskId : a random uuid,
      emoji : a emoji that relates to the task
    }]
  }

    The data for the current request is delimited by triple angle brackets.
    The title for the current request is <<<${title}>>> and the description is <<<${description}>>>`;

  return JSON.parse(await sendPrompt(prompt, [])).tasks;
};

export const chatWithProjectAssistant = async (
  project: Project,
  userInput: string,
  messageHistory: { role: string; content: string }[]
) => {
  const setUp = `You are the api for a task management application.
  Act as a project manager.
  Here is a JSON that has all the information about a project that is being developed: ${JSON.stringify(
    project
  )}
  The owner of this project wants you to be an assistant and act as a knowledgable project manager. 
  I want you to display that you have knowledge about the project he is working on.
  I also want you to be able to answer questions concerning the project, or a particular task or step inside of the project.
  If asked, you will provide a new task. When you do so, your reply will be: 'Sure! I have added a new task in your project', followed by the task. this task will be enclosed in triple backquotes. the task will have the format of the tasks in the provided project JSON.
  You will also give more details about a specific task if required.
  You will offer advice on the project, apporting creative ideas and providing links with documentation for the user.
  Following this message will come your conversation with the owner of this project.`;
  return await sendPrompt(userInput, [
    { role: "system", content: setUp },
    ...messageHistory,
  ]);
};
