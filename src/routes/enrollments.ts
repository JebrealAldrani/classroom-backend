import express, { Router } from "express";
import { and, desc, eq, getTableColumns, ilike, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { classes, enrollments, user } from "../db/schema/index.js";

const router: Router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { classId, studentId } = req.body;

    const [createdEnrollment] = await db
      .insert(enrollments)
      .values({ classId, studentId })
      .returning({
        studentId: enrollments.studentId,
        classId: enrollments.classId,
      });

    res.status(201).json({
      message: "Student enrolled successfully",
      data: createdEnrollment,
    });
  } catch (error) {
    console.error("POST Enrollment error", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.delete("/:classId/:studentId", async (req, res) => {
  try {
    const classId = Number(req.params.classId);
    const studentId = req.params.studentId;

    if (!Number.isFinite(classId)) {
      return res.status(400).json({ message: "Invalid class or student id" });
    }

    await db
      .delete(enrollments)
      .where(
        and(
          eq(enrollments.classId, classId),
          eq(enrollments.studentId, studentId),
        ),
      );

    res.status(200).json({
      message: "Student unenrolled successfully",
      data: {},
    });
  } catch (error) {
    console.error("DELETE Enrollment error", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/class/:classId", async (req, res) => {
  try {
    const classId = Number(req.params.classId);
    if (!Number.isFinite(classId)) {
      return res.status(400).json({ message: "Invalid class id" });
    }

    const enrolledStudents = await db
      .select({
        studentId: enrollments.studentId,
        student: {
          ...getTableColumns(user),
        },
      })
      .from(enrollments)
      .leftJoin(user, eq(enrollments.studentId, user.id))
      .where(eq(enrollments.classId, classId))
      .orderBy(desc(user.name));

    res.status(200).json({ data: enrolledStudents });
  } catch (error) {
    console.error("GET Class enrollments error", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
