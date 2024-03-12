"use client";
import React, { useState } from "react";
import { InsertDinner } from "@/app/calendar/insertDinner";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function AddDinnerButton({
  afterUpdate,
}: {
  afterUpdate: VoidFunction;
}) {
  const [isAddDinnerOpen, setIsAddDinnerOpen] = useState(false);
  const [dinner, setDinner] = useState({
    createdBy: "",
    dinnerItem: "",
    dinnerLink: "",
    mealDate: new Date(),
  });

  const handleDinner = (e: any) => {
    setDinner({
      ...dinner,
      [e.target.name]: e.target.value,
    });
  };

  const handleDateChange = (date: Date) => {
    date.setHours(12, 0, 0, 0);
    console.log(date);
    setDinner({
      ...dinner,
      mealDate: date,
    });
  };

  const toggleMenu = () => {
    setIsAddDinnerOpen(!isAddDinnerOpen);
  };

  const isFormValid = () => {
    return Object.values(dinner).every(
      (value) => value !== null && value !== ""
    );
  };

  const create = async (e: any) => {
    e.preventDefault();
    toggleMenu();

    try {
      // Set the mealDate to noon before submitting
      const noonDate = new Date(dinner.mealDate);
      noonDate.setHours(12, 0, 0, 0);
      setDinner({
        ...dinner,
        mealDate: noonDate,
      });

      // Format the mealDate to remove the time portion and adjust to the desired timezone
      const formattedDate = noonDate.toISOString();

      // Create a new FormData object with the updated mealDate
      const formData = new FormData(e.target);
      formData.set("mealDate", formattedDate);
      // Insert dinner with the updated FormData object
      await InsertDinner(formData);
      console.log("Dinner added successfully");

      // Reset dinner state after successful submission
      setDinner({
        createdBy: "",
        dinnerItem: "",
        dinnerLink: "",
        mealDate: new Date(),
      });

      afterUpdate?.();
    } catch (error) {
      console.error("Error adding dinner:", error);
    }
  };

  return (
    <>
      <button className="add-dinner-button" onClick={toggleMenu}>
        <div>Add a Dinner</div>
      </button>

      {isAddDinnerOpen && (
        <>
          <div className="add-dinner-overlay" onClick={toggleMenu} />
          <div className="add-dinner-popup">
            <form onSubmit={create} className="overlay_form">
              <label>Created By</label>
              <input
                type="text"
                placeholder="Created By"
                name="createdBy"
                value={dinner.createdBy}
                onChange={handleDinner}
              />
              <label>Dinner Item</label>
              <input
                type="text"
                placeholder="Dinner Item"
                name="dinnerItem"
                value={dinner.dinnerItem}
                onChange={handleDinner}
              />
              <label>Date of Meal</label>
              <p>
                Note : Dinners will appear 1 day before desired date... sorry
              </p>
              <DatePicker
                selected={dinner.mealDate}
                onChange={handleDateChange}
                name="mealDate"
                dateFormat="MM/dd/yyyy"
                placeholderText="mm/dd/yyyy"
              />
              <label>Link to Recipe</label>
              <input
                type="text"
                placeholder="Link"
                name="dinnerLink"
                value={dinner.dinnerLink}
                onChange={handleDinner}
              />
              <button
                type="submit"
                className="dinner-submit-button"
                disabled={!isFormValid()}
              >
                Submit
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
