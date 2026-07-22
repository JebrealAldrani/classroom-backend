import express, { Router } from "express";
import { db } from "../db/index.js";
import { user } from "../db/schema/index.js";
import { eq, ilike, and, count } from "drizzle-orm";

const router: Router = express.Router();

router.get("/", async (req, res) => {
    try {

        const current = Number(req.query.current ?? 1);
        const pageSize = Number(req.query.pageSize ?? 10);
        const offset = (current - 1) * pageSize;

        // Parse filters
        const filters =
            typeof req.query.filters === "string"
                ? JSON.parse(req.query.filters)
                : [];

        const conditions = [];

        for (const filter of filters) {
            switch (filter.field) {
                case "role":
                    if (filter.operator === "eq") {
                        conditions.push(eq(user.role, filter.value));
                    }
                    break;

                case "name":
                    if (filter.operator === "contains") {
                        conditions.push(ilike(user.name, `%${filter.value}%`));
                    }
                    break;

                case "email":
                    if (filter.operator === "contains") {
                        conditions.push(ilike(user.email, `%${filter.value}%`));
                    }
                    break;
            }
        }

        const whereClause =
            conditions.length > 0 ? and(...conditions) : undefined;

        const data = await db
            .select()
            .from(user)
            .where(whereClause)
            .limit(pageSize)
            .offset(offset);

        const result = await db
            .select({
                total: count(),
            })
            .from(user)
            .where(whereClause);

        const total = result[0]?.total ?? 0;

        res.status(200).json({
            data,
            pagination: {
                total: total,
                totalPages: Math.ceil(total / pageSize),
                page: current,
                limit: pageSize,
            }
        });
    } catch (error) {
        console.error("something went wrong during GET users", error);

        res.status(500).json({
            message: "Internal Server Error",
        });
    }
});

export default router;