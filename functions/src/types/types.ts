export type User = {
  email: string;
  google_id: string;
  projects?: string[];
};

export type Project = {
  project_id?: string;
  title: string;
  description: string;
  tasks: Task[];
  owner: string;
};

export type Task = {
  title: string;
  description: string;
  time: number;
  state: string;
};
