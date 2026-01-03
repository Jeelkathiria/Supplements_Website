import express, { Request, Response } from "express";
import cors from "cors";
import { requireAuth } from "./middlewares/requireAuth";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.send("Backend running");
});

app.get("/api/protected", requireAuth, (_req, res) => {
  res.json({ message: "You are authenticated" });
});

export default app;
