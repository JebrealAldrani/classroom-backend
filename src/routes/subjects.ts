import express, { Router } from "express";
import { departments, subjects } from "../db/schema/index.js";
import { and, desc, eq, getTableColumns, ilike, sql, or } from "drizzle-orm";
import { db } from "../db/index.js";

const router: Router = express.Router();

const resolveDepartmentId = async (
  departmentName?: string,
  departmentId?: number,
) => {
  if (typeof departmentId === "number") {
    return departmentId;
  }
  if (!departmentName) {
    return undefined;
  }
  const [department] = await db
    .select({ id: departments.id })
    .from(departments)
    .where(eq(departments.name, departmentName));

  return department?.id;
};

router.post("/", async (req, res) => {
  try {
    const departmentId = await resolveDepartmentId(
      req.body.department,
      req.body.departmentId,
    );

    if (!departmentId) {
      return res.status(400).json({ message: "Department is required" });
    }

    const [createdSubject] = await db
      .insert(subjects)
      .values({
        name: req.body.name,
        code: req.body.code,
        description: req.body.description,
        department_id: departmentId,
      })
      .returning({
        ...getTableColumns(subjects),
        // department: { ...getTableColumns(departments) },
      });

    res.status(201).json({
      message: "Subject created successfully",
      data: createdSubject,
    });
  } catch (err) {
    console.error("POST Subject error", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { search, department, page = 1, limit = 10 } = req.query;

    const currentPage = Math.max(1, Number(page));
    const limitPerPage = Math.max(5, Number(limit));
    const offset = (currentPage - 1) * limitPerPage;

    const filterConditions = [];

    if (search) {
      filterConditions.push(
        or(
          ilike(subjects.name, `%${search}%`),
          ilike(subjects.code, `%${search}%`),
        ),
      );
    }

    if (department) {
      filterConditions.push(ilike(departments.name, `%${department}%`));
    }

    const whereClause =
      filterConditions.length > 0 ? and(...filterConditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(subjects)
      .leftJoin(departments, eq(subjects.department_id, departments.id))
      .where(whereClause);

    const totalCount = countResult[0]?.count ?? 0;

    const subjectsList = await db
      .select({
        ...getTableColumns(subjects),
        department: { ...getTableColumns(departments) },
      })
      .from(subjects)
      .leftJoin(departments, eq(subjects.department_id, departments.id))
      .where(whereClause)
      .orderBy(desc(subjects.createdAt))
      .limit(limitPerPage)
      .offset(offset);

    res.status(200).json({
      data: subjectsList,
      pagination: {
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
        page: currentPage,
        limit: limitPerPage,
      },
    });
  } catch (err) {
    console.error("GET Subjects error", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const subjectId = Number(req.params.id);
    if (!Number.isFinite(subjectId)) {
      return res.status(400).json({ message: "Subject not found" });
    }

    const [subject] = await db
      .select({
        ...getTableColumns(subjects),
        department: { ...getTableColumns(departments) },
      })
      .from(subjects)
      .leftJoin(departments, eq(subjects.department_id, departments.id))
      .where(eq(subjects.id, subjectId));

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.status(200).json({ data: subject });
  } catch (err) {
    console.error("GET Subject error", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const subjectId = Number(req.params.id);
    if (!Number.isFinite(subjectId)) {
      return res.status(400).json({ message: "Subject not found" });
    }

    const departmentId = await resolveDepartmentId(
      req.body.department,
      req.body.departmentId,
    );

    const updateData: Record<string, unknown> = {
      name: req.body.name,
      code: req.body.code,
      description: req.body.description,
    };

    if (departmentId) {
      updateData.department_id = departmentId;
    }

    const [updatedSubject] = await db
      .update(subjects)
      .set(updateData)
      .where(eq(subjects.id, subjectId))
      .returning({
        ...getTableColumns(subjects),
        department: { ...getTableColumns(departments) },
      });

    if (!updatedSubject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.status(200).json({ data: updatedSubject });
  } catch (err) {
    console.error("PUT Subject error", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const subjectId = Number(req.params.id);
    if (!Number.isFinite(subjectId)) {
      return res.status(400).json({ message: "Subject not found" });
    }

    await db.delete(subjects).where(eq(subjects.id, subjectId));

    res.status(200).json({ message: "Subject deleted successfully", data: {} });
  } catch (err) {
    console.error("DELETE Subject error", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
