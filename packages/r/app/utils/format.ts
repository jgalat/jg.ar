const units = ["kB", "MB", "GB", "TB"] as const;
export function size(bytes: number): string {
  const step = 1024;
  for (let i = 0; i < units.length; i++) {
    if (bytes < Math.pow(step, i + 2)) {
      return `${(bytes / Math.pow(step, i + 1)).toFixed(2)} ${units[i]}`;
    }
  }
  return `infinite`;
}
