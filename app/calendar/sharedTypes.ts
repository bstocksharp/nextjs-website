export type Meal = {
  id: string; // declared as string since some map functions were complaining about it being a Number
  date: Date;
  dinnerItem: string;
  createdBy: string;
  link?: string;
};

export type CalendarDay = {
  date: Date;
  dinnerItem: string;
  link: string | undefined;
};
