import dayjs from "dayjs";
import quarterOfYear from "dayjs/plugin/quarterOfYear";

dayjs.extend(quarterOfYear);

export { dayjs };

export function formatDate(value: string | Date, format = "MMM D, YYYY") {
  return dayjs(value).format(format);
}

export function getTaxYearRange(startMonth: number, startDay: number) {
  const now = dayjs();
  const currentYearStart = dayjs(new Date(now.year(), startMonth - 1, startDay));
  const taxYearStart = now.isBefore(currentYearStart) ? currentYearStart.subtract(1, "year") : currentYearStart;
  const taxYearEnd = taxYearStart.add(1, "year").subtract(1, "day");

  return {
    start: taxYearStart.toDate(),
    end: taxYearEnd.toDate()
  };
}
