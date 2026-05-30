import { differenceInCalendarDays, parseISO } from "date-fns";
import type { Task, TaskInput, TaskPriority, TaskStatus } from "./types";

export const statusLabels: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  completed: "Completed",
};

export const priorityLabels: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function isValidStatus(value: unknown): value is TaskStatus {
  return value === "todo" || value === "in_progress" || value === "completed";
}

export function isValidPriority(value: unknown): value is TaskPriority {
  return value === "low" || value === "medium" || value === "high";
}

export function validateTaskInput(input: Partial<TaskInput>): string[] {
  const errors: string[] = [];

  if (!input.title || input.title.trim().length < 2) {
    errors.push("Title must be at least 2 characters.");
  }

  if (input.title && input.title.length > 120) {
    errors.push("Title must be 120 characters or fewer.");
  }

  if (!input.dueDate || Number.isNaN(Date.parse(input.dueDate))) {
    errors.push("Due date is required.");
  }

  if (!isValidStatus(input.status)) {
    errors.push("Status must be Todo, In Progress, or Completed.");
  }

  if (!isValidPriority(input.priority)) {
    errors.push("Priority must be Low, Medium, or High.");
  }

  if (!input.owner || input.owner.trim().length < 2) {
    errors.push("Owner must be at least 2 characters.");
  }

  return errors;
}

export function getTaskSummary(tasks: Task[], today = new Date()) {
  const open = tasks.filter((task) => task.status !== "completed").length;
  const completed = tasks.filter((task) => task.status === "completed").length;
  const inProgress = tasks.filter((task) => task.status === "in_progress").length;
  const overdue = tasks.filter(
    (task) => task.status !== "completed" && differenceInCalendarDays(parseISO(task.dueDate), today) < 0,
  ).length;
  const dueThisWeek = tasks.filter((task) => {
    const days = differenceInCalendarDays(parseISO(task.dueDate), today);
    return task.status !== "completed" && days >= 0 && days <= 7;
  }).length;

  return {
    total: tasks.length,
    open,
    completed,
    inProgress,
    overdue,
    dueThisWeek,
    completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
  };
}

export function getOpsPulse(tasks: Task[], today = new Date()) {
  const summary = getTaskSummary(tasks, today);
  const highPriorityOpen = tasks.filter((task) => task.priority === "high" && task.status !== "completed").length;
  const blockedSoon = tasks.filter((task) => {
    const days = differenceInCalendarDays(parseISO(task.dueDate), today);
    return task.status !== "completed" && task.priority !== "low" && days <= 2;
  }).length;

  const notes = [
    summary.overdue > 0
      ? `${summary.overdue} overdue task${summary.overdue === 1 ? "" : "s"} need owner follow-up.`
      : "No overdue work is blocking the board.",
    highPriorityOpen > 0
      ? `${highPriorityOpen} high-priority item${highPriorityOpen === 1 ? "" : "s"} still open.`
      : "High-priority queue is clear.",
    blockedSoon > 0
      ? `${blockedSoon} near-term item${blockedSoon === 1 ? "" : "s"} should be reviewed today.`
      : "No urgent due-date pressure in the next 48 hours.",
  ];

  const riskScore = Math.min(100, summary.overdue * 22 + highPriorityOpen * 12 + blockedSoon * 10);

  return {
    riskScore,
    riskLabel: riskScore >= 60 ? "High" : riskScore >= 30 ? "Watch" : "Healthy",
    notes,
  };
}

export function parseOpsCommand(command: string, today = new Date()): Partial<TaskInput> {
  const normalized = command.trim();
  const lower = normalized.toLowerCase();
  const title = normalized
    .replace(/\b(high|medium|low)\b/gi, "")
    .replace(/\b(todo|in progress|completed)\b/gi, "")
    .replace(/\bby\s+(today|tomorrow|next week|\d{4}-\d{2}-\d{2})\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  let dueDate = today.toISOString().slice(0, 10);
  if (lower.includes("tomorrow")) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    dueDate = tomorrow.toISOString().slice(0, 10);
  } else if (lower.includes("next week")) {
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    dueDate = nextWeek.toISOString().slice(0, 10);
  } else {
    const explicitDate = lower.match(/\b\d{4}-\d{2}-\d{2}\b/);
    if (explicitDate) dueDate = explicitDate[0];
  }

  const priority: TaskPriority = lower.includes("high") ? "high" : lower.includes("low") ? "low" : "medium";
  const status: TaskStatus = lower.includes("completed")
    ? "completed"
    : lower.includes("in progress")
      ? "in_progress"
      : "todo";

  return {
    title: title || normalized || "New operations task",
    description: normalized ? `Created from Ops Command: "${normalized}"` : "",
    status,
    dueDate,
    priority,
    owner: "Ops",
  };
}

export function sortTasks(tasks: Task[], mode: "dueDate" | "priority" | "createdAt") {
  const priorityWeight: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
  return [...tasks].sort((a, b) => {
    if (mode === "priority") return priorityWeight[a.priority] - priorityWeight[b.priority];
    return a[mode].localeCompare(b[mode]);
  });
}
