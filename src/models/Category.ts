interface ICategory {
  _id?: string; // MongoDB document ID
  name: string; // Name of the category (e.g., "Xbox Subscriptions")
  description?: string; // Optional description of the category
  createdAt: Date; // Timestamp when the category was created
  updatedAt: Date; // Timestamp when the category was last updated
}

export { ICategory };