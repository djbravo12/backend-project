import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";

const app = express();

// app.listen(`${process.env.PORT || 6000}`);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(cookieParser());

export { app };
