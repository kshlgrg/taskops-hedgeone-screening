import { describe, expect, it } from "vitest";
import { getOpsPulse, getTaskSummary, parseOpsCommand, validateTaskInput } from "./task-utils";
import type { Task } from "./types";

const today = new Date("2026-05-30T10:00:00.000Z");

const tasks: Task[] = [
  {
    id: "1",
    title: "Overdue escalation",
    description: "Needs attention",
    status: "todo",
    dueDate: "2026-05-29",
    priority: "high",
    owner: "Ops",
    createdAt: "2026-05-20T00:00:00.000Z",
    updatedAt: "2026-05-20T00:00:00.000Z",
  },
  {
    id: "2",
    title: "Delivery sprint",
    description: "In flight",
    status: "in_progress",
    dueDate: "2026-06-02",
    priority: "medium",
    owner: "Product",
    createdAt: "2026-05-21T00:00:00.000Z",
    updatedAt: "2026-05-21T00:00:00.000Z",
  },
  {
    id: "3",
    title: "Closed item",
    description: "Done",
    status: "completed",
    dueDate: "2026-05-25",
    priority: "low",
    owner: "Support",
    createdAt: "2026-05-22T00:00:00.000Z",
    updatedAt: "2026-05-22T00:00:00.000Z",
  },
];

describe("task utilities", () => {
  it("summarizes task status and due-date pressure", () => {
    expect(getTaskSummary(tasks, today)).toMatchObject({
      total: 3,
      open: 2,
      completed: 1,
      inProgress: 1,
      overdue: 1,
      dueThisWeek: 1,
      completionRate: 33,
    });
  });

  it("generates a risk pulse from open high-priority and overdue work", () => {
    const pulse = getOpsPulse(tasks, today);

    expect(pulse.riskScore).toBeGreaterThan(30);
    expect(pulse.notes[0]).toContain("overdue");
    expect(pulse.notes[1]).toContain("high-priority");
  });

  it("parses ops command text into a task draft", () => {
    expect(parseOpsCommand("Follow up invoice approval high by tomorrow", today)).toMatchObject({
      title: "Follow up invoice approval",
      priority: "high",
      status: "todo",
      dueDate: "2026-05-31",
      owner: "Ops",
    });
  });

  it("validates required task fields", () => {
    const errors = validateTaskInput({
      title: "",
      description: "",
      status: "todo",
      dueDate: "not-a-date",
      priority: "medium",
      owner: "A",
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        "Title must be at least 2 characters.",
        "Due date is required.",
        "Owner must be at least 2 characters.",
      ]),
    );
  });
});
