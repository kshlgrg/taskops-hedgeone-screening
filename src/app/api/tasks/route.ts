import { NextResponse } from "next/server";
import { createTask, listTasks } from "@/lib/task-store";
import type { TaskInput } from "@/lib/types";

export async function GET() {
  try {
    const tasks = await listTasks();
    return NextResponse.json({ tasks });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load tasks." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TaskInput;
    const task = await createTask(body);
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create task." },
      { status: 400 },
    );
  }
}
