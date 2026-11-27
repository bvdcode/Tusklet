import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

export type TaskGroupHeading = { id: string; title: string };

function getHeadings(groups: HTMLDivElement) {
  return Array.from(groups.querySelectorAll<HTMLElement>("[data-task-group]"));
}

function maximumScroll() {
  return Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  );
}

export default function useActiveTaskGroup(
  headerRef: RefObject<HTMLElement | null>,
  groupsRef: RefObject<HTMLDivElement | null>,
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

    const headings = getHeadings(list).slice(1);
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
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top > boundary) {
          break;
        }
        activeId = heading.dataset.taskGroup;
      }
      activate(activeId);
    };
    const schedule = () => {
      frame ??= window.requestAnimationFrame(update);
    };

    const observer = new ResizeObserver(schedule);
    observer.observe(header);
    observer.observe(list);
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
  }, [activate, groups, groupsRef, headerRef]);

  function scrollToGroup(id: string, behavior: ScrollBehavior) {
    const header = headerRef.current;
    const list = groupsRef.current;
    if (!header || !list) {
      return;
    }

    const headings = getHeadings(list);
    const heading = headings.find(
      (element) => element.dataset.taskGroup === id,
    );
    if (!heading) {
      return;
    }

    const scrollY = window.scrollY;
    const top =
      heading === headings[0]
        ? 0
        : Math.max(
            0,
            Math.ceil(
              scrollY +
                heading.getBoundingClientRect().bottom -
                header.getBoundingClientRect().bottom,
            ),
          );
    const maximum = maximumScroll();
    limitedJump.current = top > maximum ? { id, scrollY } : undefined;
    const destination = Math.min(top, maximum);
    if (Math.abs(scrollY - destination) < 1) {
      activate(id);
    }
    window.scrollTo({ top: destination, behavior });
  }

  return { activeGroup, scrollToGroup };
}
