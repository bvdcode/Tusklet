import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { VirtuosoHandle } from "react-virtuoso";
import { scrollTasks } from "./taskScroll";
import type { TaskGroupHeading } from "./taskView";

function maximumScroll(scroller: HTMLElement) {
  return Math.max(0, scroller.scrollHeight - scroller.clientHeight);
}

export default function useActiveTaskGroup(
  scroller: HTMLElement | null,
  listRef: RefObject<VirtuosoHandle | null>,
  groups: TaskGroupHeading[],
) {
  const [activeGroup, setActiveGroup] = useState<{
    id: string;
    previousId?: string;
  }>();
  const limitedJump = useRef<{ id: string; scrollTop: number }>(undefined);
  const activate = useCallback((id: string | undefined) => {
    if (id !== undefined) {
      setActiveGroup((current) =>
        current?.id === id ? current : { id, previousId: current?.id },
      );
    }
  }, []);

  useEffect(() => {
    if (!scroller) {
      return;
    }

    let frame: number | undefined;
    const update = () => {
      frame = undefined;
      const boundary = scroller.getBoundingClientRect().top + scroller.clientTop;
      const { scrollTop } = scroller;
      const atEnd = Math.ceil(scrollTop) >= maximumScroll(scroller);
      const jump = limitedJump.current;
      if (
        jump &&
        (scrollTop < jump.scrollTop || !groups.some(({ id }) => id === jump.id))
      ) {
        limitedJump.current = undefined;
      } else if (jump) {
        jump.scrollTop = scrollTop;
      }
      if (atEnd && limitedJump.current) {
        activate(limitedJump.current.id);
        return;
      }
      if (atEnd && scrollTop > 0) {
        activate(groups.at(-1)?.id);
        return;
      }

      let activeId: string | undefined = groups[0]?.id;
      for (const entry of scroller.querySelectorAll<HTMLElement>(
        "[data-task-group]",
      )) {
        if (entry.getBoundingClientRect().top > boundary) {
          break;
        }
        activeId = entry.dataset.taskGroup;
      }
      if (jump?.id === activeId) {
        limitedJump.current = undefined;
      }
      activate(activeId);
    };
    const schedule = () => {
      frame ??= window.requestAnimationFrame(update);
    };

    const observer = new ResizeObserver(schedule);
    observer.observe(scroller);
    const entriesObserver = new MutationObserver(schedule);
    entriesObserver.observe(scroller, { childList: true, subtree: true });
    scroller.addEventListener("scroll", schedule, { passive: true });
    schedule();

    return () => {
      observer.disconnect();
      entriesObserver.disconnect();
      scroller.removeEventListener("scroll", schedule);
      if (frame !== undefined) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [activate, groups, scroller]);

  function scrollToGroup(id: string, reducedMotion: boolean) {
    const group = groups.find((heading) => heading.id === id);
    if (!scroller || !group) {
      return;
    }
    if (group.index === 0) {
      limitedJump.current = undefined;
      scrollTasks(scroller, 0, reducedMotion);
      return;
    }

    const { scrollTop } = scroller;
    const boundary = scroller.getBoundingClientRect().top + scroller.clientTop;
    const start = scroller.querySelector<HTMLElement>(
      `[data-index="${group.index}"][data-task-group]`,
    );
    if (!start) {
      limitedJump.current = { id, scrollTop };
      listRef.current?.scrollToIndex({
        index: group.index,
        align: "start",
        behavior: "auto",
      });
      return;
    }

    const top = Math.max(
      0,
      Math.ceil(scrollTop + start.getBoundingClientRect().top - boundary),
    );
    const maximum = maximumScroll(scroller);
    limitedJump.current = top > maximum ? { id, scrollTop } : undefined;
    const destination = Math.min(top, maximum);
    if (Math.abs(scrollTop - destination) < 1) {
      activate(id);
    }
    scrollTasks(scroller, destination, reducedMotion);
  }

  return { activeGroup, scrollToGroup };
}
