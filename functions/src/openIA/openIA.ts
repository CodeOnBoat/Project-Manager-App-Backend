import axios from "axios";
import { Project } from "../types/types";
import { infoToDB } from "../utils/utils";

const sendPrompt = async (
  prompt: string,
  messages: { role: string; content: string }[]
) => {
  const key = process.env.OPEN_AI_KEY;
  const client = axios.create({
    headers: { Authorization: "Bearer " + key },
  });

  infoToDB({ content: [...messages, { role: "user", content: prompt }] });
  const res = await client.post("https://api.openai.com/v1/chat/completions", {
    model: "gpt-3.5-turbo",
    messages: [...messages, { role: "user", content: prompt }],
  });
  infoToDB(res);
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
        description : description of the step,
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
  Here is a JSON that has all the information about a project that is being developed: ${JSON.stringify(
    project
  )}
  You will act like an experienced project assistant with knowledge on the topic.
  You will answer questions concerning the project, or a particular task or step inside of the project, giving guidance, information, and assistance to the user so that he can complete them.
  You will come up with creative and realistic ideas when you are asked. And offer to create new tasks if you come up with one that is necessary.
  If asked, you will provide a new task. When you do so, your reply will be: 'Sure! I have added a new task in your project', followed by the task. this task will be enclosed in [t].
  Example of task: 
  [t]
  {
    title : a title of the task,
    description : a description of the task. Should be detailed and give simple structured instructions as a string,
    steps : a list of steps to follow in order the complete the current task. every step looks like this: {
      name : name of the step,
      description : description of the step,
      completed : set by default to false
    }
    time : estimated time it will take to make it,
    state : set by default to 'notstarted',
    taskId : a random uuid,
    emoji : a emoji that relates to the task
  }
  [/t]

  Every message should be followed by three suggestions, each suggestion consisting of a maximum of three words. These suggestions will guide the user on what they can respond next. Enclose the suggestions array within [s][/s] tags.
  Example of suggestions:
  [s]
    [
      "Explain me more",
      "Create new task",
      "Suggest next step"
    ]
  [/s]
  
  Following this message will come your conversation with the owner of this project.`;
  return await sendPrompt(userInput, [
    { role: "system", content: setUp },
    ...messageHistory,
  ]);
  // {user : 'Hello', assistant : 'Hello, how can I help you?' [s]["Explain me more", "Create new task", "Suggest next step"][/s]}
  // {user : 'Hello', assistant : 'Ahoy!, how can I assist you?' [s]["Explain me more", "Create new task", "Suggest next step"][/s]}
  // {user : 'Hi', assistant : 'Hi, how can I help you?' [s] ["Explain me more", "Create new task", "Suggest next step"][/s]}
  // {user : 'Create a task to make a express server', assistant : 'Of course! I have added this task to your project: [t]{"title": "Create an Express server","description": "Set up and configure an Express server to serve as the backend for your TaskWise application.","steps": [{"name": "Install Express","description": "Use npm to install the Express package for your project.","completed": false},{"name": "Set up server.js","description": "Create a new file named server.js in the root of your project directory. In this file, import Express (require('express')) and create a new instance of the app using 'const app = express();'.","completed": false},{"name": "Define routes","description": "Define the routes of your application using app.get(), app.post(), app.put(), and app.delete().","completed": false},{"name": "Test your server","description": "Start the server using 'app.listen()' and test that you can access the APIs from a web browser or a client-side application.","completed": false}],"time": 3,"state": "notstarted","taskId": "b3816fc6-a36a-4cc4-8c1b-86b1a935f3d6","emoji": "🌐"}[/t] Feel free to ask me any questions about the task or the steps. [s]['Explain first step','Explain the task','Create new task'][/s]'}
};
