import { TaskDashboard } from "@/components/task-dashboard";
import { listTasks } from "@/lib/task-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const tasks = await listTasks().catch(() => []);

  return <TaskDashboard initialTasks={tasks} />;
}
