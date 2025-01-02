export const calculateDaysBetween = (startDate: string | null, endDate: string | null) => {
    const today = new Date().toISOString().split('T')[0];
    const start = startDate && startDate !== "None" ? new Date(startDate) : new Date(today);
    const end = endDate && endDate !== "None" ? new Date(endDate) : new Date(today);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };