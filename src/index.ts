import AgentAPI from "apminsight";

AgentAPI.config()

import "dotenv/config"; // must be first import in ESM
import express, {Request, Response, Express} from "express";
import cors from "cors";
import {toNodeHandler} from "better-auth/node";
import {auth} from "./lib/auth.js";

import subjectsRouter from "./routes/subjects.js";
import classesRouter from "./routes/classes.js";
import usersRouter from "./routes/users.js";
import securityMiddleware from "./middleware/securityMiddleware.js";

const app = express();

const PORT: number = (process.env.PORT as unknown as number);

if (!process.env.FRONTEND_URL) {
    throw new Error("Missing FRONTEND_URL");
}

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is missing");
}

if (!PORT || PORT < 1 || PORT > 65535) {
    throw new Error("PORT is not assigned in environment variables");
}

const originOptions = {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    credentials: true
}

app.use(cors(originOptions));

app.use(express.json());

app.use(securityMiddleware);

app.all("/api/auth/*splat", toNodeHandler(auth));

//Routes
app.use("/api/subjects", subjectsRouter);
app.use("/api/classes", classesRouter);
app.use("/api/users", usersRouter)

app.get("/", (req, res): void => {
    res.json({
        message: "Classroom API Run Successfully!",
    });
});

app.listen(PORT, (): void => {
    console.log("Server is running successfully on port:", PORT);
});