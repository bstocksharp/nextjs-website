import { CalendarDay } from "./sharedTypes";
import { useState } from "react";
import GetFullDateFormat from "./helpers/GetFullDateFormat";

export default function MealDayController({
  calendarDay,
}: {
  calendarDay: CalendarDay;
}) {
  const [isCalendarDetailsOpen, setIsCalendarDetailsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const toggleCalendarMenu = () => {
    setIsCalendarDetailsOpen(!isCalendarDetailsOpen);
    setIsEditMode(false);
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  return (
    <>
      <div
        key={calendarDay.date.toString()}
        className="calendar-day"
        onClick={toggleCalendarMenu}
      >
        <div className="calendar-date">
          {calendarDay.date.toLocaleDateString(undefined, { day: "numeric" })}
        </div>

        <div className="calendar-dinner-item">
          {truncateText(calendarDay.dinnerItem, 50)}
        </div>
      </div>

      {isCalendarDetailsOpen ? (
        <>
          <div className="calendar-day-overlay" onClick={toggleCalendarMenu} />
          <div className="calendar-day-popup">
            <div className="calendar-day-popup-head">
              <GetFullDateFormat calendarDate={calendarDay.date} />
              <button
                className="calendar_popup_edit_button"
                onClick={toggleEditMode}
              >
                <text>{!isEditMode && "✎"}</text>
              </button>
              <button
                className="calendar_popup_close_button"
                onClick={toggleCalendarMenu}
              >
                <text>🗙</text>
              </button>
            </div>
            {isEditMode ? (
              <>
                <div>Dinner</div>
                <input
                  type="text"
                  name="dinnerItem"
                  value={calendarDay.dinnerItem}
                />
                <div>Link</div>
                <input type="text" name="link" value={calendarDay.link} />
                <div className="calender-popup-editmode-buttons">
                  <button className="calender-popup-editmode-button-save">
                    save
                  </button>
                  <button
                    className="calender-popup-editmode-button-cancel"
                    onClick={toggleCalendarMenu}
                  >
                    cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>Dinner</div>
                <div className="calendar-dinner-item">
                  {calendarDay.dinnerItem}
                </div>
                <div>Link</div>
                <div className="calendar-dinner-item">{calendarDay.link}</div>
              </>
            )}
          </div>
        </>
      ) : null}
    </>
  );
}

function truncateText(text: string, maxLength: number) {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

// {calendarDay.date.toLocaleDateString(undefined, {
//    weekday: "short",
//})}

// ⊗ ↺ ↻ ⊠ ⌀ ✎ 🖉
