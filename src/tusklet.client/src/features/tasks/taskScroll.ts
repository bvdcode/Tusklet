export function taskScrollBehavior(top: number, reducedMotion: boolean) {
  const distance = Math.abs(top - window.scrollY);
  return reducedMotion || distance > window.innerHeight * 3
    ? "instant"
    : "smooth";
}
