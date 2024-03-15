import { Meal } from "../sharedTypes/sharedTypes";
import { createMeal } from "./createMeal";

export const useUpdateOrInsertMeal = ({
  doesDinnerExist,
  afterUpdate,
}: {
  doesDinnerExist: boolean;
  afterUpdate: VoidFunction;
}) => {
  const runUpdateMeal = async (meal: Meal) => {
    console.log("runUpdateMeal");
  };

  const runCreateMeal = async (meal: Meal) => {
    console.log("runCreateMeal");
    await createMeal(meal);
  };

  const saveMealChanges = async (meal?: Meal) => {
    try {
      console.log({ meal, doesDinnerExist });
      if (!meal) {
        console.error("NO MEAL PROVIDED");
        return;
      }

      if (doesDinnerExist) {
        await runUpdateMeal(meal);
        console.log("Dinner updated successfully");
      } else {
        await runCreateMeal(meal);
        console.log("Dinner created successfully");
      }
      afterUpdate();
    } catch (error) {
      console.error("Error adding dinner:", error);
    }
  };
  return {
    saveMealChanges,
  };
};
