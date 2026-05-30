"use client";

import {
  AlertTriangle,
  ArrowDownAZ,
  Bot,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Edit3,
  LayoutDashboard,
  ListFilter,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Dispatch, FormEvent, SetStateAction, useMemo, useState } from "react";
import { clsx } from "clsx";
import { format, parseISO } from "date-fns";
import { getOpsPulse, getTaskSummary, parseOpsCommand, sortTasks } from "@/lib/task-utils";
import type { Task, TaskInput, TaskPriority, TaskStatus } from "@/lib/types";

const emptyForm: TaskInput = {
  title: "",
  description: "",
  status: "todo",
  dueDate: new Date().toISOString().slice(0, 10),
  priority: "medium",
  owner: "Ops",
};

type Filter = "all" | TaskStatus | "overdue";
type SortMode = "dueDate" | "priority" | "createdAt";

export function TaskDashboard({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [loading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("dueDate");
  const [form, setForm] = useState<TaskInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [command, setCommand] = useState("Follow up on overdue vendor approval high by tomorrow");

  const today = useMemo(() => new Date(), []);
  const summary = useMemo(() => getTaskSummary(tasks, today), [tasks, today]);
  const pulse = useMemo(() => getOpsPulse(tasks, today), [tasks, today]);

  const visibleTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = tasks.filter((task) => {
      const matchesQuery =
        !normalizedQuery ||
        [task.title, task.description, task.owner, task.status, task.priority].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      const isOverdue = new Date(task.dueDate) < new Date(new Date().toISOString().slice(0, 10)) && task.status !== "completed";
      const matchesFilter =
        filter === "all" || task.status === filter || (filter === "overdue" && isOverdue);
      return matchesQuery && matchesFilter;
    });

    return sortTasks(filtered, sortMode);
  }, [filter, query, sortMode, tasks]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  }

  function openEdit(task: Task) {
    setEditingId(task.id);
    setForm({
      title: task.title,
      description: task.description,
      status: task.status,
      dueDate: task.dueDate,
      priority: task.priority,
      owner: task.owner,
    });
    setIsModalOpen(true);
  }

  async function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(editingId ? `/api/tasks/${editingId}` : "/api/tasks", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as { task?: Task; error?: string };
      if (!response.ok || !payload.task) throw new Error(payload.error ?? "Unable to save task.");

      setTasks((current) =>
        editingId ? current.map((task) => (task.id === editingId ? payload.task as Task : task)) : [payload.task as Task, ...current],
      );
      setIsModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save task.");
    } finally {
      setSaving(false);
    }
  }

  async function removeTask(id: string) {
    setError("");
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to delete task.");
      setTasks((current) => current.filter((task) => task.id !== id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete task.");
    }
  }

  async function quickStatus(task: Task, status: TaskStatus) {
    setError("");
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json()) as { task?: Task; error?: string };
      if (!response.ok || !payload.task) throw new Error(payload.error ?? "Unable to update task.");
      setTasks((current) => current.map((item) => (item.id === task.id ? payload.task as Task : item)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update task.");
    }
  }

  function useCommand() {
    const parsed = parseOpsCommand(command, today);
    setEditingId(null);
    setForm({ ...emptyForm, ...parsed });
    setIsModalOpen(true);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Primary">
        <div className="brand">
          <span className="brand-mark">
            <ClipboardList size={21} aria-hidden />
          </span>
          <div>
            <strong>TaskOps</strong>
            <span>Screening Build</span>
          </div>
        </div>

        <nav className="nav-stack" aria-label="Dashboard navigation">
          <a className="nav-item active" href="#tasks">
            <LayoutDashboard size={18} aria-hidden />
            Dashboard
          </a>
          <a className="nav-item" href="#pulse">
            <Sparkles size={18} aria-hidden />
            Ops Pulse
          </a>
          <a className="nav-item" href="#tasks">
            <ClipboardList size={18} aria-hidden />
            Task Ledger
          </a>
        </nav>

        <div className="sidebar-note">
          <Bot size={18} aria-hidden />
          <p>Built with an AI-assisted workflow, then verified through tests and browser QA.</p>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyeline">HedgeOne Intern Screening Project</p>
            <h1>Business task management dashboard</h1>
          </div>
          <button className="primary-button" onClick={openCreate}>
            <Plus size={18} aria-hidden />
            Add task
          </button>
        </header>

        {error ? (
          <div className="alert" role="alert">
            <AlertTriangle size={18} aria-hidden />
            {error}
          </div>
        ) : null}

        <section className="metrics-grid" aria-label="Task summary">
          <Metric title="Open" value={summary.open} detail={`${summary.dueThisWeek} due this week`} icon={<Clock3 />} />
          <Metric title="In progress" value={summary.inProgress} detail="Active delivery queue" icon={<ArrowDownAZ />} />
          <Metric title="Completed" value={summary.completed} detail={`${summary.completionRate}% completion rate`} icon={<CheckCircle2 />} />
          <Metric title="Overdue" value={summary.overdue} detail="Needs owner action" icon={<AlertTriangle />} tone={summary.overdue ? "danger" : "good"} />
        </section>

        <section className="command-strip" aria-label="Ops command">
          <div>
            <div className="section-label">
              <Sparkles size={16} aria-hidden />
              Ops Command
            </div>
            <p>Type a short business instruction and convert it into a task draft.</p>
          </div>
          <div className="command-control">
            <input
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              aria-label="Ops command text"
            />
            <button onClick={useCommand}>
              <Bot size={17} aria-hidden />
              Draft
            </button>
          </div>
        </section>

        <div className="content-grid">
          <section id="tasks" className="task-panel" aria-label="Task ledger">
            <div className="panel-header">
              <div>
                <div className="section-label">
                  <ClipboardList size={16} aria-hidden />
                  Task Ledger
                </div>
                <h2>Track operational work from intake to completion</h2>
              </div>
              <div className="toolbar">
                <label className="search-field">
                  <Search size={16} aria-hidden />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search tasks"
                    aria-label="Search tasks"
                  />
                </label>
                <label className="select-field">
                  <ListFilter size={16} aria-hidden />
                  <select value={filter} onChange={(event) => setFilter(event.target.value as Filter)} aria-label="Filter tasks">
                    <option value="all">All</option>
                    <option value="todo">Todo</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </label>
                <label className="select-field">
                  <CalendarDays size={16} aria-hidden />
                  <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} aria-label="Sort tasks">
                    <option value="dueDate">Due date</option>
                    <option value="priority">Priority</option>
                    <option value="createdAt">Created</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="table-wrap">
              {loading ? (
                <div className="empty-state">Loading tasks...</div>
              ) : visibleTasks.length ? (
                <table>
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Status</th>
                      <th>Due</th>
                      <th>Priority</th>
                      <th>Owner</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onEdit={openEdit}
                        onDelete={removeTask}
                        onStatusChange={quickStatus}
                      />
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <ClipboardList size={26} aria-hidden />
                  <strong>No tasks match this view.</strong>
                  <span>Try another filter or add a new operational task.</span>
                </div>
              )}
            </div>
          </section>

          <aside id="pulse" className="pulse-panel" aria-label="Ops Pulse">
            <div className="section-label">
              <Sparkles size={16} aria-hidden />
              Ops Pulse
            </div>
            <h2>Risk snapshot</h2>
            <div className={clsx("risk-ring", pulse.riskLabel.toLowerCase())}>
              <span>{pulse.riskScore}</span>
              <small>{pulse.riskLabel}</small>
            </div>

            <div className="distribution" aria-label="Workload distribution">
              <DistributionBar label="Todo" value={tasks.filter((task) => task.status === "todo").length} total={Math.max(tasks.length, 1)} />
              <DistributionBar label="Progress" value={summary.inProgress} total={Math.max(tasks.length, 1)} />
              <DistributionBar label="Done" value={summary.completed} total={Math.max(tasks.length, 1)} />
            </div>

            <div className="pulse-notes">
              {pulse.notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {isModalOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="task-dialog-title">
            <div className="modal-header">
              <div>
                <p className="eyeline">{editingId ? "Update task" : "Create task"}</p>
                <h2 id="task-dialog-title">{editingId ? "Edit operational task" : "Add operational task"}</h2>
              </div>
              <button className="icon-button" onClick={() => setIsModalOpen(false)} aria-label="Close task dialog">
                <X size={18} aria-hidden />
              </button>
            </div>

            <form onSubmit={submitTask} className="task-form">
              <label>
                Title
                <input required minLength={2} maxLength={120} value={form.title} onChange={(event) => setFormField("title", event.target.value, setForm)} />
              </label>
              <label>
                Description
                <textarea value={form.description} onChange={(event) => setFormField("description", event.target.value, setForm)} />
              </label>
              <div className="form-grid">
                <label>
                  Status
                  <select value={form.status} onChange={(event) => setFormField("status", event.target.value as TaskStatus, setForm)}>
                    <option value="todo">Todo</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
                <label>
                  Due date
                  <input type="date" required value={form.dueDate} onChange={(event) => setFormField("dueDate", event.target.value, setForm)} />
                </label>
                <label>
                  Priority
                  <select value={form.priority} onChange={(event) => setFormField("priority", event.target.value as TaskPriority, setForm)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
                <label>
                  Owner
                  <input required minLength={2} value={form.owner} onChange={(event) => setFormField("owner", event.target.value, setForm)} />
                </label>
              </div>
              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button className="primary-button" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Save changes" : "Create task"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function setFormField<Key extends keyof TaskInput>(
  key: Key,
  value: TaskInput[Key],
  setForm: Dispatch<SetStateAction<TaskInput>>,
) {
  setForm((current) => ({ ...current, [key]: value }));
}

function Metric({
  title,
  value,
  detail,
  icon,
  tone,
}: {
  title: string;
  value: number;
  detail: string;
  icon: React.ReactElement;
  tone?: "danger" | "good";
}) {
  return (
    <article className={clsx("metric-card", tone)}>
      <div className="metric-icon">{icon}</div>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function TaskRow({
  task,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}) {
  const overdue = new Date(task.dueDate) < new Date(new Date().toISOString().slice(0, 10)) && task.status !== "completed";

  return (
    <tr>
      <td>
        <div className="task-title">
          <strong>{task.title}</strong>
          <span>{task.description}</span>
        </div>
      </td>
      <td>
        <select
          className={clsx("status-select", task.status)}
          value={task.status}
          onChange={(event) => onStatusChange(task, event.target.value as TaskStatus)}
          aria-label={`Update status for ${task.title}`}
        >
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </td>
      <td>
        <span className={clsx("due-date", overdue && "overdue")}>{format(parseISO(task.dueDate), "MMM d, yyyy")}</span>
      </td>
      <td>
        <span className={clsx("priority-chip", task.priority)}>{task.priority}</span>
      </td>
      <td>{task.owner}</td>
      <td>
        <div className="row-actions">
          <button className="icon-button" onClick={() => onEdit(task)} aria-label={`Edit ${task.title}`}>
            <Edit3 size={16} aria-hidden />
          </button>
          <button className="icon-button danger" onClick={() => onDelete(task.id)} aria-label={`Delete ${task.title}`}>
            <Trash2 size={16} aria-hidden />
          </button>
        </div>
      </td>
    </tr>
  );
}

function DistributionBar({ label, value, total }: { label: string; value: number; total: number }) {
  const width = Math.max(4, Math.round((value / total) * 100));
  return (
    <div className="distribution-row">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="bar-track">
        <span style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
