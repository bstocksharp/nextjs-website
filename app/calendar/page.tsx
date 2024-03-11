"use client";

import AddDinnerButton from "./addDinnerButton";
import { fetchDinners } from "./fetchDinners";
import { useState, useEffect, Key } from "react";
import { Meal, CalendarDay } from "./sharedTypes";
import MealDayController from "./MealDayController";

export default function CalendarPage() {
  const [dinners, setDinners] = useState<Meal[]>([]);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const getFetchDinners = async () => {
    setIsLoaded(false);

    const dinnerData = await fetchDinners();
    setDinners(dinnerData);
    setIsLoaded(true);
  };

  useEffect(() => {
    getFetchDinners();
  }, []);

  useEffect(() => {
    // Get the date range for the next two weeks
    const today = new Date();
    const todayAtNoon = new Date(today);
    todayAtNoon.setHours(12, 0, 0, 0); // Set time to noon (12:00 PM)

    // Get the date range for the next two weeks
    const closestSunday = new Date(todayAtNoon);
    closestSunday.setDate(closestSunday.getDate() - closestSunday.getDay()); // Get the closest Sunday in the past

    const twoWeeksLater = new Date(closestSunday);
    twoWeeksLater.setDate(closestSunday.getDate() + 13);

    // Generate an array of dates for the two weeks
    const dates = [];
    const currentDate = new Date(closestSunday);
    while (currentDate <= twoWeeksLater) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Populate the calendar days with dinner items
    const calendarData = dates.map((date) => {
      const dinnerForDay = dinners.find((dinner) => {
        const dinnerDate = new Date(dinner.date);
        return dinnerDate.toDateString() === date.toDateString();
      });

      return {
        date,
        dinnerItem: dinnerForDay ? dinnerForDay.dinnerItem : "",
        link: dinnerForDay ? dinnerForDay.link : "",
      };
    });

    setCalendarDays(calendarData);
  }, [dinners]);

  return (
    <div className="main-calendar-wrapper">
      {!isLoaded ? (
        <div> Cool Loading Screen TBD </div>
      ) : (
        <>
          <div className="calendar-wrapper">
            {calendarDays.map((calendarDay: CalendarDay) => (
              <MealDayController
                key={calendarDay.date.toString()}
                calendarDay={calendarDay}
              />
            ))}
          </div>

          <div className="add-dinner-button-center">
            <AddDinnerButton afterUpdate={getFetchDinners} />
          </div>
        </>
      )}
    </div>
  );
}
