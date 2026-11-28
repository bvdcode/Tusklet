export function scrollTasks(
  scroller: HTMLElement,
  top: number,
  reducedMotion: boolean,
) {
  const distance = Math.abs(top - scroller.scrollTop);
  scroller.scrollTo({
    top,
    behavior:
      reducedMotion || distance > scroller.clientHeight * 3
        ? "instant"
        : "smooth",
  });
}
