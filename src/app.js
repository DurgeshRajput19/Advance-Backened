import express, { urlencoded } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.ORIGIN,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "15kb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "15kb",
  })
);

app.use(express.static("public"));

app.use(cookieParser());

//import routes 
import UserRouter from "./routes/user.routes.js"

app.use("/api/v1/users" , UserRouter)

//http:localhost:8000/api/v1/users/register
export default app;
