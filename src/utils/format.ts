import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';

export const formatDate = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), 'dd-MMM-yyyy');
  } catch {
    return dateStr;
  }
};

export const formatCurrency = (amount: number) => {
  return `Rs. ${amount.toLocaleString('en-PK')}`;
};

export const todayISO = () => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
};

export const dateToISO = (date: Date) => {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
};

export const getWeekRange = (date: Date = new Date()) => {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start, end };
};
