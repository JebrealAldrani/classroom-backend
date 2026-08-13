import express, { Router } from "express";
import { classes, departments, subjects, user } from "../db/schema/index.js";
import { db } from "../db/index.js";
import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";

const router: Router = express.Router();

router.post("/", async (req, res) => {
  try {
    const [createdClass] = await db
      .insert(classes)
      .values({
        ...req.body,
        inviteCode: Math.random().toString(36).substring(2, 9),
        schedules: req.body.schedules ?? [],
      })
      .returning({ id: classes.id });

    if (!createdClass) {
      throw new Error("something went wrong during add class to database");
    }

    res.status(201).json({
      message: "classroom created successfully",
      data: {
        classRoomId: createdClass.id,
      },
    });
  } catch (error) {
    console.error("some thing went wrong during add class ", error);
    res
      .status(500)
      .json({ message: "internal server error, please try again later!" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { search, page = 1, limit = 10, status } = req.query;

    const currentPage = Math.max(1, Number(page));
    const limitPerPage = Math.max(5, Number(limit));
    const offset = (currentPage - 1) * limitPerPage;

    const filterConditions = [];

    if (search) {
      filterConditions.push(
        or(
          ilike(classes.name, `%${search}%`),
          ilike(classes.description, `%${search}%`),
        ),
      );
    }

    const CLASS_STATUSES = ["active", "inactive", "archived"] as const;
    type ClassStatus = (typeof CLASS_STATUSES)[number];

    function isClassStatus(value: unknown): value is ClassStatus {
      return (
        typeof value === "string" &&
        (CLASS_STATUSES as readonly string[]).includes(value)
      );
    }

    // ...inside the route handler:

    if (status) {
      if (!isClassStatus(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      filterConditions.push(eq(classes.status, status));
    }

    const whereClause =
      filterConditions.length > 0 ? and(...filterConditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(classes)
      .leftJoin(user, eq(classes.teacherId, user.id))
      .where(whereClause);

    const totalCount = countResult[0]?.count ?? 0;

    const classesList = await db
      .select({
        ...getTableColumns(classes),
        subject: { ...getTableColumns(subjects) },
        user: {
          ...getTableColumns(user),
        },
      })
      .from(classes)
      .leftJoin(subjects, eq(classes.subjectId, subjects.id))
      .leftJoin(user, eq(classes.teacherId, user.id))
      .where(whereClause)
      .orderBy(desc(classes.createdAt))
      .limit(limitPerPage)
      .offset(offset);

    res.status(200).json({
      data: classesList,
      pagination: {
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
        page: currentPage,
        limit: limitPerPage,
      },
    });
  } catch (err) {
    console.error("GET Classes error", err);
    res.status(500).json({ message: `Internal Server Error` });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const classId = Number(req.params.id);

    if (!Number.isFinite(classId)) {
      return res.status(400).json({ message: "classroom not found" });
    }

    const [classDetails] = await db
      .select({
        ...getTableColumns(classes),
        subject: { ...getTableColumns(subjects) },
        teacher: { ...getTableColumns(user) },
      })
      .from(classes)
      .leftJoin(subjects, eq(classes.subjectId, subjects.id))
      .leftJoin(user, eq(classes.teacherId, user.id))
      .where(eq(classes.id, classId));

    if (!classDetails) {
      return res.status(404).json({ message: "classroom not found" });
    }

    res.status(200).json({ data: classDetails });
  } catch (error) {
    console.error("GET Class error", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const classId = Number(req.params.id);
    if (!Number.isFinite(classId)) {
      return res.status(400).json({ message: "classroom not found" });
    }

    const [updatedClass] = await db
      .update(classes)
      .set(req.body)
      .where(eq(classes.id, classId))
      .returning({
        ...getTableColumns(classes),
      });

    if (!updatedClass) {
      return res.status(404).json({ message: "classroom not found" });
    }

    res.status(200).json({ data: updatedClass });
  } catch (error) {
    console.error("PUT Class error", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const classId = Number(req.params.id);
    if (!Number.isFinite(classId)) {
      return res.status(400).json({ message: "classroom not found" });
    }

    await db.delete(classes).where(eq(classes.id, classId));

    res.status(200).json({ message: "Class deleted successfully", data: {} });
  } catch (error) {
    console.error("DELETE Class error", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
