import "dotenv/config"; // must be first import in ESM
import express, { Request, Response, Express } from "express";
import subjectsRouter from "./routes/subjects.ts";
import cors from "cors";

const app: Express = express();

const PORT: number = process.env.PORT as unknown as number || 8000;

if(!process.env.FRONTEND_URL) {
    throw new Error("Missing FRONTEND_URL");
}

app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
     credentials: true
}))

app.use(express.json());

app.use("/api/subjects", subjectsRouter);

app.get("/", (req: Request, res: Response): void => {
    res.json({
        message: "Classroom API Run Successfully!"
    });
});

if (!PORT || PORT < 1 || PORT > 65535) {
    throw new Error("PORT is not assigned in environment variables")
}

app.listen(PORT, (): void => {
    console.log("Server is running successfully on port:", PORT);
});