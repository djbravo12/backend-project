import mongoDbConnection from "./db/db.js";
import { app } from "./app.js";
import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});

// console.log(process.env.PORT);

mongoDbConnection()
  .then(() => {
    app.on("error", (error) => {
      console.log(`Error ${error}`);
    });

    app.listen(process.env.PORT || 9000, (req, res) => {
      console.log(`Server is running at port :: ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log(`MONGO db connection failed ${error}`);
  });
