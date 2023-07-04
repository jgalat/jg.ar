const { floor, min, max } = Math;
const range = (lo: number, hi: number) =>
  Array.from({ length: hi - lo }, (_, i) => i + lo);

export default (visible: number, current: number, total: number) => {
  const start = max(
    0,
    min(current - floor((visible - 3) / 2), total - visible + 2)
  );
  const end = min(total, max(current + floor((visible - 2) / 2), visible - 2));

  return [
    ...(start > 1 ? [0, -1] : start > 0 ? [0] : []),
    ...range(start, end + 1),
    ...(end < total - 1 ? [-2, total] : end < total ? [total] : []),
  ];
};
