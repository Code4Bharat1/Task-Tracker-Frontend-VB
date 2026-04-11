"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

export default function DemoPage() {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Design homepage",
      assignee: "Alex",
      due: "Mar 31",
      completed: false,
    },
    {
      id: 2,
      title: "Set up project board",
      assignee: "Sam",
      due: "Apr 2",
      completed: false,
    },
    {
      id: 3,
      title: "Write API spec",
      assignee: "Taylor",
      due: "Apr 4",
      completed: true,
    },
  ]);
  const [newTask, setNewTask] = useState("");

  function toggleComplete(id) {
    setTasks((t) =>
      t.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    );
  }

  function addTask() {
    if (!newTask.trim()) return;
    setTasks((t) => [
      ...t,
      {
        id: Date.now(),
        title: newTask.trim(),
        assignee: "You",
        due: "TBD",
        completed: false,
      },
    ]);
    setNewTask("");
  }

  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pct = Math.round((completed / Math.max(total, 1)) * 100);

  return (
    <div className="p-4 text-sm h-full box-border bg-surface">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Interactive Demo
          </h2>
          <div className="text-xs text-foreground-muted">
            Try creating a task and toggling completion.
          </div>
        </div>
        <div className="text-xs text-foreground-muted">
          {completed} / {total} done
        </div>
      </div>

      <div className="mb-3">
        <div className="w-full h-2 bg-surface-container rounded overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-xs text-foreground-muted mt-1">
          {pct}% complete
        </div>
      </div>

      <div className="flex gap-2">
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task title"
          className="flex-1 px-3 py-2 border border-outline rounded-md bg-surface-container text-foreground"
        />
        <button
          onClick={addTask}
          className="bg-primary text-on-primary px-3 py-2 rounded-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      <ul className="mt-4 space-y-2 overflow-auto" style={{ maxHeight: 260 }}>
        {tasks.map((task) => (
          <li
            key={task.id}
            className={
              "flex items-center gap-3 p-3 rounded-md " +
              (task.completed ? "bg-surface" : "bg-surface-container") +
              " border border-outline"
            }
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleComplete(task.id)}
              className="w-4 h-4"
            />
            <div className="flex-1 min-w-0">
              <div
                className={
                  "font-medium " +
                  (task.completed
                    ? "line-through text-foreground-muted"
                    : "text-foreground")
                }
              >
                {task.title}
              </div>
              <div className="text-xs text-foreground-muted">
                {task.assignee} · due {task.due}
              </div>
            </div>
            <button className="text-xs text-primary">Open</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
