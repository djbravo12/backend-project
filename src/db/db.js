import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// console.log(process.env.MONGODB_URL);/

const mongoDbConnection = async () => {
  try {
    const connectionInstances = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`
    );

    console.log(`MongoDB connection successfull ${connectionInstances.connection.host}`);
  } catch (error) {
    console.log(`Error:: MongoDB connection Failed:: ${error}`);
  }
};

export default mongoDbConnection;
