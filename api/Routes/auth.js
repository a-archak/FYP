import Express from "express";
import { login, register, logout } from "../controllers/auth.js";



const router = Express.Router();

router.post("login", login);
router.post("regoster", register);
router.post("logout", logout);


export default router;