"use client";
import React, { useState } from "react";
import { InsertDinner } from "@/app/calendar/insertDinner";
import { useRouter } from "next/navigation";
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
    mealDate: new Date(),
  });

  const handleDinner = (e: any) => {
    setDinner({
      ...dinner,
      [e.target.name]: e.target.value,
    });
  };

  const handleDateChange = (date: Date) => {
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

  const router = useRouter();
  const create = async (e: any) => {
    e.preventDefault();
    toggleMenu();

    try {
      await InsertDinner(new FormData(e.target));
      console.log("Dinner added successfully");

      setDinner({
        createdBy: "",
        dinnerItem: "",
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
              <DatePicker
                selected={dinner.mealDate}
                onChange={handleDateChange}
                name="mealDate"
                dateFormat="MM/dd/yyyy"
                placeholderText="mm/dd/yyyy"
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
