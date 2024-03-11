export default function GetFullDateFormat({
  calendarDate,
}: {
  calendarDate: Date;
}) {
  return (
    <div>
      {calendarDate.toLocaleDateString(undefined, {
        weekday: "long",
      })}{" "}
      {calendarDate.toLocaleDateString(undefined, {
        month: "long",
      })}{" "}
      {calendarDate.toLocaleDateString(undefined, {
        day: "numeric",
      })}
      {", "}
      {calendarDate.toLocaleDateString(undefined, {
        year: "numeric",
      })}
    </div>
  );
}
