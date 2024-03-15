import { Meal, Task } from "./sharedTypes/sharedTypes";
import { useState } from "react";
import GetFullDateFormat from "./components/GetFullDateFormat";
import { useUpdateOrInsertMeal } from "./hooks/useUpdateOrInsertMeal";

export default function MealDayController({
  dateString,
  meal,
  tasks,
  afterUpdate,
}: {
  dateString: string;
  meal?: Meal;
  tasks: Task[];
  afterUpdate: VoidFunction;
}) {
  const [isCalendarDetailsOpen, setIsCalendarDetailsOpen] = useState(false);
  const date = new Date(dateString);
  const defaultMeal: Meal = {
    date: date,
    createdBy: "",
    dinnerItem: "",
    link: "",
  };
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedMeal, setEditedMeal] = useState<Meal>(meal || defaultMeal);
  const doesDinnerExist = !!meal;

  const { saveMealChanges } = useUpdateOrInsertMeal({
    doesDinnerExist,
    afterUpdate,
  });

  const toggleCalendarMenu = () => {
    setIsCalendarDetailsOpen(!isCalendarDetailsOpen);
    setIsEditMode(false);
    consoleLogger();
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const handleDinneritemChange = (e: {
    target: { name: string; value: string };
  }) => {
    setEditedMeal({
      ...editedMeal,
      [e.target.name]: e.target.value,
    });
  };

  const consoleLogger = () => {
    console.log(meal);
  };

  return (
    <>
      <div className="calendar-day" onClick={toggleCalendarMenu}>
        <div className="calendar-date" onClick={consoleLogger}>
          {date.toLocaleDateString(undefined, { day: "numeric" })}
        </div>

        <div className="calendar-dinner-item">
          {truncateText(meal?.dinnerItem || "", 10)}
        </div>
      </div>

      {isCalendarDetailsOpen ? (
        <>
          <div className="calendar-day-overlay" onClick={toggleCalendarMenu} />
          <div className="calendar-day-popup">
            <div className="calendar-day-popup-head">
              <GetFullDateFormat calendarDate={date} />
              <button
                className="calendar_popup_edit_button"
                onClick={toggleEditMode}
              >
                <p>{!isEditMode && "✎"}</p>
              </button>
              <button
                className="calendar_popup_close_button"
                onClick={toggleCalendarMenu}
              >
                <p>🗙</p>
              </button>
            </div>
            {isEditMode ? (
              <>
                <div>Dinner</div>
                <input
                  type="text"
                  name="dinnerItem"
                  value={editedMeal?.dinnerItem}
                  onChange={handleDinneritemChange}
                />
                <div>Link</div>
                <input
                  type="text"
                  name="link"
                  value={editedMeal?.link}
                  onChange={handleDinneritemChange}
                />
                <div className="calender-popup-editmode-buttons">
                  <button
                    onClick={() => saveMealChanges(editedMeal)}
                    className="calender-popup-editmode-button-save"
                  >
                    save
                  </button>
                  <button
                    className="calender-popup-editmode-button-cancel"
                    onClick={toggleEditMode}
                  >
                    cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                {editedMeal?.dinnerItem && (
                  <div className="calendar-dinner-item">
                    Dinner : {editedMeal?.dinnerItem}
                  </div>
                )}
                {editedMeal?.link && (
                  <a
                    className="calendar-dinner-item"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={
                      editedMeal?.link.startsWith("http://") ||
                      editedMeal?.link.startsWith("https://")
                        ? editedMeal?.link
                        : "https://" + editedMeal?.link
                    }
                  >
                    Link to Recipe
                  </a>
                )}
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

// ⊗ ↺ ↻ ⊠ ⌀ ✎ 🖉
