export type Meal = {
  date: Date;
  dinnerItem: string;
  createdBy: string;
  link?: string;
};

export type Task = {
  date: Date;
  task: string;
  dueDate: Date;
};

// tasks can be empty, because it is not planned to be implemented for a long time
export type CalendarDays = {
  [key: string]: { meal?: Meal; tasks: Task[] };
};
