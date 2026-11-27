import { useEffect, useRef, useState } from "react";
import type { TaskGrouping } from "./taskView";

export default function useActiveTaskGroup(
  grouping: TaskGrouping,
  listId: string,
) {
  const headerRef = useRef<HTMLElement>(null);
  const groupsRef = useRef<HTMLDivElement>(null);
  const [activeGroupId, setActiveGroupId] = useState<string>();

  useEffect(() => {
    const header = headerRef.current;
    const groups = groupsRef.current;
    if (!header || !groups || grouping === "none") {
      return;
    }

    let frame: number | undefined;
    const update = () => {
      frame = undefined;
      const boundary = header.getBoundingClientRect().bottom;
      let activeId: string | undefined;
      for (const group of groups.querySelectorAll<HTMLElement>(
        "[data-task-group]",
      )) {
        if (group.getBoundingClientRect().bottom > boundary) {
          break;
        }
        activeId = group.dataset.taskGroup;
      }
      setActiveGroupId(activeId);
    };
    const schedule = () => {
      frame ??= window.requestAnimationFrame(update);
    };

    const observer = new ResizeObserver(schedule);
    observer.observe(header);
    observer.observe(groups);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame !== undefined) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [grouping, listId]);

  return { headerRef, groupsRef, activeGroupId };
}
