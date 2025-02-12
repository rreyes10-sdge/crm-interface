export const calculateDaysBetween = (startDate: string | null, endDate: string | null) => {
  const today = new Date().toISOString().split('T')[0];
  const start = startDate && startDate !== "None" ? new Date(startDate) : new Date(today);
  const end = endDate && endDate !== "None" ? new Date(endDate) : new Date(today);

  let businessDays = 0;
  let currentDate = new Date(start);
  currentDate.setDate(currentDate.getDate() + 1); // Start counting from the next day

  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
      businessDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return businessDays;
};