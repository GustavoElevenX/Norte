export type Autonomy = "N0" | "N1";
export type AssistantAction = "none" | "create_task" | "schedule_task";

export function assistantPolicy(level: Autonomy, action: AssistantAction) {
  if (action === "none") return "read_only" as const;
  return level === "N0" ? "suggest_only" as const : "requires_approval" as const;
}
