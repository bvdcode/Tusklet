import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { VirtuosoHandle } from "react-virtuoso";
import { taskScrollBehavior } from "./taskScroll";
import type { TaskGroupHeading } from "./taskView";

function maximumScroll() {
  return Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  );
}

export default function useActiveTaskGroup(
  headerRef: RefObject<HTMLElement | null>,
  groupsRef: RefObject<HTMLDivElement | null>,
  listRef: RefObject<VirtuosoHandle | null>,
  groups: TaskGroupHeading[],
) {
  const [activeGroup, setActiveGroup] = useState<{
    id: string;
    previousId?: string;
  }>();
  const limitedJump = useRef<{ id: string; scrollY: number }>(undefined);
  const activate = useCallback((id: string | undefined) => {
    if (id !== undefined) {
      setActiveGroup((current) =>
        current?.id === id ? current : { id, previousId: current?.id },
      );
    }
  }, []);

  useEffect(() => {
    const header = headerRef.current;
    const list = groupsRef.current;
    if (!header || !list) {
      return;
    }

    let frame: number | undefined;
    const update = () => {
      frame = undefined;
      const boundary = header.getBoundingClientRect().bottom;
      const scrollY = window.scrollY;
      const atEnd = Math.ceil(scrollY) >= maximumScroll();
      const jump = limitedJump.current;
      if (
        jump &&
        (scrollY < jump.scrollY || !groups.some(({ id }) => id === jump.id))
      ) {
        limitedJump.current = undefined;
      } else if (jump) {
        jump.scrollY = scrollY;
      }
      if (atEnd && limitedJump.current) {
        activate(limitedJump.current.id);
        return;
      }
      if (atEnd && scrollY > 0) {
        activate(groups.at(-1)?.id);
        return;
      }

      let activeId: string | undefined = groups[0]?.id;
      for (const entry of list.querySelectorAll<HTMLElement>(
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
    observer.observe(header);
    observer.observe(list);
    const entriesObserver = new MutationObserver(schedule);
    entriesObserver.observe(list, { childList: true, subtree: true });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();

    return () => {
      observer.disconnect();
      entriesObserver.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame !== undefined) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [activate, groups, groupsRef, headerRef]);

  function scrollToGroup(id: string, reducedMotion: boolean) {
    const header = headerRef.current;
    const list = groupsRef.current;
    const group = groups.find((heading) => heading.id === id);
    if (!header || !list || !group) {
      return;
    }
    if (group.index === 0) {
      limitedJump.current = undefined;
      window.scrollTo({
        top: 0,
        behavior: taskScrollBehavior(0, reducedMotion),
      });
      return;
    }

    const scrollY = window.scrollY;
    const boundary = header.getBoundingClientRect().bottom;
    const start = list.querySelector<HTMLElement>(
      `[data-index="${group.index}"][data-task-group]`,
    );
    if (!start) {
      limitedJump.current = { id, scrollY };
      listRef.current?.scrollToIndex({
        index: group.index,
        align: "start",
        offset: -boundary,
        behavior: "auto",
      });
      return;
    }

    const top = Math.max(
      0,
      Math.ceil(scrollY + start.getBoundingClientRect().top - boundary),
    );
    const maximum = maximumScroll();
    limitedJump.current = top > maximum ? { id, scrollY } : undefined;
    const destination = Math.min(top, maximum);
    if (Math.abs(scrollY - destination) < 1) {
      activate(id);
    }
    window.scrollTo({
      top: destination,
      behavior: taskScrollBehavior(destination, reducedMotion),
    });
  }

  return { activeGroup, scrollToGroup };
}
