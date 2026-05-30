import type { Task } from "./types";

const now = new Date("2026-05-30T09:00:00.000Z").toISOString();

export const demoTasks: Task[] = [
  {
    id: "demo-1",
    title: "Map CRM follow-up stages for sales handoff",
    description: "Create a compact workflow for lead status, next action, and owner transfer.",
    status: "in_progress",
    dueDate: "2026-06-02",
    priority: "high",
    owner: "Kushal",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "demo-2",
    title: "Automate vendor invoice exception review",
    description: "List rules for missing GST details, duplicate invoice numbers, and overdue approvals.",
    status: "todo",
    dueDate: "2026-06-05",
    priority: "medium",
    owner: "Ops",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "demo-3",
    title: "Prepare dashboard seed data for client demo",
    description: "Add realistic records for completed, delayed, and active operational tasks.",
    status: "completed",
    dueDate: "2026-05-28",
    priority: "low",
    owner: "Product",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "demo-4",
    title: "Review overdue support escalations",
    description: "Identify aging tickets and assign the next owner action.",
    status: "todo",
    dueDate: "2026-05-29",
    priority: "high",
    owner: "Support",
    createdAt: now,
    updatedAt: now,
  },
];
