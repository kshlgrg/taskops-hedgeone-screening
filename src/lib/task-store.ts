import { createClient } from "@supabase/supabase-js";
import { demoTasks } from "./demo-data";
import { validateTaskInput } from "./task-utils";
import type { Task, TaskInput, TaskPatch, TaskPriority, TaskStatus } from "./types";

type DbTask = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  due_date: string;
  priority: TaskPriority;
  owner: string;
  created_at: string;
  updated_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const forceDemoMode = process.env.TASKOPS_DEMO_MODE === "true";

const supabase =
  !forceDemoMode && supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      })
    : null;

let memoryTasks = [...demoTasks];

function toTask(row: DbTask): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    dueDate: row.due_date,
    priority: row.priority,
    owner: row.owner,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDbInput(input: TaskInput) {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    status: input.status,
    due_date: input.dueDate,
    priority: input.priority,
    owner: input.owner.trim(),
  };
}

export async function listTasks(): Promise<Task[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("due_date", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data as DbTask[]).map(toTask);
  }

  return [...memoryTasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export async function createTask(input: TaskInput): Promise<Task> {
  const errors = validateTaskInput(input);
  if (errors.length) throw new Error(errors.join(" "));

  if (supabase) {
    const { data, error } = await supabase.from("tasks").insert(toDbInput(input)).select("*").single();
    if (error) throw new Error(error.message);
    return toTask(data as DbTask);
  }

  const timestamp = new Date().toISOString();
  const task: Task = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    description: input.description.trim(),
    status: input.status,
    dueDate: input.dueDate,
    priority: input.priority,
    owner: input.owner.trim(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  memoryTasks = [task, ...memoryTasks];
  return task;
}

export async function updateTask(id: string, patch: TaskPatch): Promise<Task> {
  if (supabase) {
    const { data: current, error: currentError } = await supabase.from("tasks").select("*").eq("id", id).single();
    if (currentError) throw new Error(currentError.message);

    const merged: TaskInput = {
      title: patch.title ?? (current as DbTask).title,
      description: patch.description ?? (current as DbTask).description,
      status: patch.status ?? (current as DbTask).status,
      dueDate: patch.dueDate ?? (current as DbTask).due_date,
      priority: patch.priority ?? (current as DbTask).priority,
      owner: patch.owner ?? (current as DbTask).owner,
    };

    const errors = validateTaskInput(merged);
    if (errors.length) throw new Error(errors.join(" "));

    const { data, error } = await supabase.from("tasks").update(toDbInput(merged)).eq("id", id).select("*").single();
    if (error) throw new Error(error.message);
    return toTask(data as DbTask);
  }

  const existing = memoryTasks.find((task) => task.id === id);
  if (!existing) throw new Error("Task not found.");

  const merged = { ...existing, ...patch };
  const errors = validateTaskInput({
    title: merged.title,
    description: merged.description,
    status: merged.status,
    dueDate: merged.dueDate,
    priority: merged.priority,
    owner: merged.owner,
  });
  if (errors.length) throw new Error(errors.join(" "));

  const updated: Task = { ...merged, updatedAt: new Date().toISOString() };
  memoryTasks = memoryTasks.map((task) => (task.id === id ? updated : task));
  return updated;
}

export async function deleteTask(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }

  memoryTasks = memoryTasks.filter((task) => task.id !== id);
}
