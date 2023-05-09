export type User = {
  email: string;
  google_id: string;
  projects?: string[];
  notifications: NotificationType[];
};

export type NotificationType = {
  project_id: string;
  user_id: string;
};

export type Project = {
  project_id?: string;
  title: string;
  description: string;
  tasks: Task[];
  owner: string;
  collaborators: CollaboratorType[];
};

export type CollaboratorType = {
  user_name: string;
  user_id: string;
};

export type Task = {
  taskId?: string;
  title: string;
  description: string;
  time: number;
  state: string;
  collaborator: string;
  steps : Step[]
};

export type Step = {
  name: string;
  link: string;
  linkname: string;
  completed: boolean;
};
