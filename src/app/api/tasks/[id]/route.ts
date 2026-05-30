import { NextResponse } from "next/server";
import { deleteTask, updateTask } from "@/lib/task-store";
import type { TaskPatch } from "@/lib/types";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as TaskPatch;
    const task = await updateTask(id, body);
    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update task." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    await deleteTask(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete task." },
      { status: 400 },
    );
  }
}
