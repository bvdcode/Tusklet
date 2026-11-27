export function getLocalToday() {
  const now = new Date();
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
}

export function dueDateColor(
  dueDate: string,
  today: number,
  isCompleted: boolean,
) {
  if (isCompleted) {
    return "textSecondary";
  }
  const deadline = Date.parse(dueDate);
  if (deadline < today) {
    return "error";
  }
  if (deadline === today) {
    return "warning";
  }
  return "textSecondary";
}
