import express, {Router} from "express";
import {classes, subjects, user} from "../db/schema/index.js";
import {db} from "../db/index.js";
import {and, desc, eq, getTableColumns, ilike, or, sql} from "drizzle-orm";
import users from "./users.js";

const router: Router = express.Router();

router.post("/", async (req, res, next) => {

    try {
        const [createdClass] = await db.insert(classes).values({
            ...req.body,
            inviteCode: Math.random().toString(36).substring(2, 9),
            schedules: []
        }).returning({id: classes.id});

        if (!createdClass) {
            throw new Error('something went wrong during add class to database')
        }

        res.status(201).json({
            message: "classroom created successfully",
            data: {
                classRoomId: createdClass.id
            }
        })
    } catch (error) {
        console.error("some thing went wrong during add class ", error)
        res.status(500).json({message: "internal server error, please try again later!"})
    }
})

router.get("/", async (req, res, next) => {
    try {
        const {search, page = 1, limit = 10} = req.query;

        const currentPage = Math.max(1, +page);
        const limitPerPage = Math.max(5, +limit);

        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        //If search query exists, filter by subject name OR subject code
        if (search) {
            filterConditions.push(
                or(
                    ilike(classes.name, `%${search}%`),
                    ilike(classes.description, `%${search}%`),
                )
            )
        }

        //combine all filters using AND if any exists
        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db
            .select({count: sql<number>`count(*)`})
            .from(classes)
            .leftJoin(user, eq(classes.teacherId, user.id))
            .where(whereClause)

        const totalCount = countResult[0]?.count ?? 0;

        const classesList = await db
            .select({
                ...getTableColumns(classes),
                subject: {...getTableColumns(subjects)},
                user: {
                    ...getTableColumns(user)
                }
            })
            .from(classes)
            .leftJoin(subjects, eq(classes.subjectId, subjects.id))
            .where(whereClause)
            .orderBy(desc(classes.createdAt))
            .limit(limitPerPage)
            .offset(offset)

        res.status(200).json({
            data: classesList,
            pagination: {
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
                page: currentPage,
                limit: limitPerPage,
            }
        })
    } catch (err) {
        console.error("GET Classes error", err);
        res.status(500).json({
            message: `Internal Server Error`
        })
    }
})
export default router;