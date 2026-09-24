export function moveItem<T>(list: T[], from: number, to: number) {
  const copy = [...list];
  copy.splice(to, 0, ...copy.splice(from, 1));
  return copy;
}
