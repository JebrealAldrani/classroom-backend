import express, {Router} from "express";
import {departments, subjects} from "../db/schema";

import {ilike, or, eq, sql, and, getTableColumns, desc} from "drizzle-orm"
import {db} from "../db";

const router: Router = express.Router();

router.get("/", async (req, res) => {
    try {
        const {search, department, page = 1, limit = 10} = req.query;

        const currentPage = Math.max(1, +page);
        const limitPerPage = Math.max(5, +limit);

        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        //If search query exists, filter by subject name OR subject code
        if (search) {
            filterConditions.push(
                or(
                    ilike(subjects.name, `%${search}%`),
                    ilike(subjects.code, `%${search}%`),
                )
            )
        }

        //If department filter exists, match department name
        if (department) {
            filterConditions.push(ilike(departments.name, `%${department}%`));
        }

        //combine all filters using AND if any exists
        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db
            .select({count: sql<number>`count(*)`})
            .from(subjects).leftJoin(departments, eq(subjects.department_id, departments.id))
            .where(whereClause)

        const totalCount = countResult[0]?.count ?? 0;

        const subjectsList = await db
            .select({
                ...getTableColumns(subjects),
                department: {...getTableColumns(departments)}
            })
            .from(subjects)
            .leftJoin(departments, eq(subjects.department_id, departments.id))
            .where(whereClause)
            .orderBy(desc(subjects.createdAt))
            .limit(limitPerPage)
            .offset(offset)

        res.status(200).json({
            data: subjectsList,
            pagination: {
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
                page: currentPage,
                limit: limitPerPage,
            }
        })
    } catch (err) {
        console.error("GET Subjects error", err);
        res.status(500).json({
            message: `Internal Server Error`
        })
    }
});

export default router;