import { Router } from "express";
import  registerUser  from "../controllers/users.controllers.js";

const router = Router();

router.route("/Register").post(registerUser);

export default router;
