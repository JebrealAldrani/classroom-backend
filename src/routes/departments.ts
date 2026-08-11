import express, { Router } from "express";
import { and, desc, eq, getTableColumns, ilike, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { departments } from "../db/schema/index.js";

const router: Router = express.Router();

router.post("/", async (req, res) => {
  try {
    const [department] = await db
      .insert(departments)
      .values(req.body)
      .returning({
        id: departments.id,
        code: departments.code,
        name: departments.name,
        description: departments.description,
        createdAt: departments.createdAt,
        updatedAt: departments.updatedAt,
      });

    res.status(201).json({
      message: "Department created successfully",
      data: department,
    });
  } catch (error) {
    console.error("POST Department error", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    const currentPage = Math.max(1, Number(page));
    const limitPerPage = Math.max(5, Number(limit));
    const offset = (currentPage - 1) * limitPerPage;

    const whereConditions = [];
    if (search) {
      whereConditions.push(
        ilike(departments.name, `%${search}%`),
        ilike(departments.code, `%${search}%`),
      );
    }

    const whereClause = whereConditions.length
      ? and(...whereConditions)
      : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(departments)
      .where(whereClause);

    const totalCount = countResult[0]?.count ?? 0;

    const departmentList = await db
      .select({
        ...getTableColumns(departments),
      })
      .from(departments)
      .where(whereClause)
      .orderBy(desc(departments.createdAt))
      .limit(limitPerPage)
      .offset(offset);

    res.status(200).json({
      data: departmentList,
      pagination: {
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
        page: currentPage,
        limit: limitPerPage,
      },
    });
  } catch (error) {
    console.error("GET Departments error", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const departmentId = Number(req.params.id);
    if (!Number.isFinite(departmentId)) {
      return res.status(400).json({ message: "Department not found" });
    }

    const [department] = await db
      .select({
        ...getTableColumns(departments),
      })
      .from(departments)
      .where(eq(departments.id, departmentId));

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.status(200).json({ data: department });
  } catch (error) {
    console.error("GET Department error", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const departmentId = Number(req.params.id);
    if (!Number.isFinite(departmentId)) {
      return res.status(400).json({ message: "Department not found" });
    }

    const [department] = await db
      .update(departments)
      .set(req.body)
      .where(eq(departments.id, departmentId))
      .returning({
        id: departments.id,
        code: departments.code,
        name: departments.name,
        description: departments.description,
        createdAt: departments.createdAt,
        updatedAt: departments.updatedAt,
      });

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.status(200).json({ data: department });
  } catch (error) {
    console.error("PUT Department error", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const departmentId = Number(req.params.id);
    if (!Number.isFinite(departmentId)) {
      return res.status(400).json({ message: "Department not found" });
    }

    await db.delete(departments).where(eq(departments.id, departmentId));

    res
      .status(200)
      .json({ message: "Department deleted successfully", data: {} });
  } catch (error) {
    console.error("DELETE Department error", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
