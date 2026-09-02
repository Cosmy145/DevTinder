import authRouter from "./auth.routes.ts";
import profileRouter from "./profile.routes.ts";
import usersRouter from "./users.routes.ts";
import requestsRouter from "./requests.routes.ts";
import Express, { Router } from "express";

const v1Router: Router = Express.Router();

v1Router.use("/auth", authRouter);

v1Router.use("/profile", profileRouter);

v1Router.use("/requests", requestsRouter);

v1Router.use("/users", usersRouter);

export default v1Router;
