import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";

const app: Express = express();

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.get("/user", (req: Request, res: Response) => {
  res.json({ name: "John", age: 25, id: 1 });
});

app.post("/user", (req: Request, res: Response) => {
  res.send("User created!");
});

app.listen(3000, () => {
  console.log("Example app listening on port 3000");
});
