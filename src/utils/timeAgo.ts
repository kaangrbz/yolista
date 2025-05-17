export const getTimeAgo = (date: string): string => {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (seconds < 60) {
    return `${seconds}s`; // seconds
  }
  if (minutes < 60) {
    return `${minutes}dk`; // minutes
  }
  if (hours < 24) {
    return `${hours}sa`; // hours
  }
  if (days < 30) {
    return `${days}g`; // days
  }
  if (months < 12) {
    return `${months}a`; // months
  }
  return `${years}y`; // years
};
