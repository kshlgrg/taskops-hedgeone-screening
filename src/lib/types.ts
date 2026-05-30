export type TaskStatus = "todo" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  priority: TaskPriority;
  owner: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskInput = {
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  priority: TaskPriority;
  owner: string;
};

export type TaskPatch = Partial<TaskInput>;
