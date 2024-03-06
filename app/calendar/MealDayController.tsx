import { CalendarDay } from "./sharedTypes";

export default function MealDayController({
  calendarDay,
}: {
  calendarDay: CalendarDay;
}) {
  const moreDateData = () => {
    console.log("clicked me", calendarDay.date);
  };
  return (
    <div
      key={calendarDay.date.toString()}
      className="calendar-day"
      onClick={moreDateData}
    >
      <div className="calendar-date">
        {calendarDay.date.toLocaleDateString(undefined, { day: "numeric" })}
      </div>

      <div className="calendar-dinner-item">
        {truncateText(calendarDay.dinnerItem, 50)}
      </div>
    </div>
  );
}

function truncateText(text: string, maxLength: number) {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

// {calendarDay.date.toLocaleDateString(undefined, {
//    weekday: "short",
//})}
