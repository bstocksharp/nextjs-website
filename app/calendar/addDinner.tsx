"use client";
import React, { useState } from "react";
import { createDinner } from "@/app/calendar/addDinners";
import { useRouter } from "next/navigation";

export default function addDinner() {
  const [isAddDinnerOpen, setIsAddDinnerOpen] = useState(false);
  const [createdBy, setCreatedBy] = useState("");
  const [dinnerItem, setDinnerItem] = useState("");
  const [mealDate, setMealDate] = useState("");

  const router = useRouter();

  const toggleMenu = () => {
    setIsAddDinnerOpen(!isAddDinnerOpen);
  };

  const create = async (e: any) => {
    e.preventDefault(); // Prevent the default form submission behavior
    console.log(new FormData(e.target));
    toggleMenu();

    try {
      await createDinner(new FormData(e.target)); // Call the Server Action with FormData
      console.log("Dinner added successfully");

      router.refresh();
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
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
              />
              <label>Dinner Item</label>
              <input
                type="text"
                placeholder="Dinner Item"
                name="dinnerItem"
                value={dinnerItem}
                onChange={(e) => setDinnerItem(e.target.value)}
              />
              <label>Date of Meal</label>
              <input
                type="text"
                placeholder="mm/dd/yyyy"
                name="mealDate"
                value={mealDate}
                onChange={(e) => setMealDate(e.target.value)}
              />
              <button type="submit" className="dinner-submit-button">
                Submit
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
