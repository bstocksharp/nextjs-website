"use client";

import { fetchDinners } from "./fetchDinners";
import { useState, useEffect, Key } from "react";
import { Meal, CalendarDays } from "./sharedTypes/sharedTypes";
import MealDayController from "./MealDayController";

export default function CalendarPage() {
  const [dinners, setDinners] = useState<Meal[]>([]);
  const [calendarDays, setCalendarDays] = useState<CalendarDays>({});
  const [isLoaded, setIsLoaded] = useState(false);

  const runFetchDinners = async () => {
    setIsLoaded(false);
    const dinnerData = await fetchDinners();
    setDinners(dinnerData);
    runSetCalendarDays();
    setIsLoaded(true);
  };

  useEffect(() => {
    runFetchDinners();
  }, []);

  const runSetCalendarDays = () => {
    // Get the date range for the next two weeks
    const closestSunday = new Date();
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

    let calendarDays: CalendarDays = {};
    // Populate the calendar days with dinner items
    dates.forEach((date) => {
      const dinnerForDay = dinners.find((dinner) => {
        const dinnerDate = new Date(dinner.date);
        return dinnerDate.toDateString() === date.toDateString();
      });

      calendarDays[date.toISOString()] = {
        meal: dinnerForDay,
        tasks: [],
      };
    });

    setCalendarDays(calendarDays);
  };

  useEffect(() => {
    runSetCalendarDays();
  }, [dinners]);

  const placeholderDays = Array.from({ length: 14 }).map((_, index) => (
    <div key={index} className="calendar-day-placeholder"></div>
  ));

  return (
    <div className="main-calendar-wrapper">
      {!isLoaded ? (
        <div className="calendar-wrapper">{placeholderDays}</div>
      ) : (
        <>
          <div className="calendar-wrapper">
            {Object.keys(calendarDays).map((dateString) => (
              <MealDayController
                tasks={calendarDays[dateString].tasks}
                meal={calendarDays[dateString].meal}
                key={dateString}
                dateString={dateString}
                afterUpdate={runFetchDinners}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
