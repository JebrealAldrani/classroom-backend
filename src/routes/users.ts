import crypto from "node:crypto";
import express, { Router } from "express";
import { db } from "../db/index.js";
import { user } from "../db/schema/index.js";
import { and, count, eq, ilike } from "drizzle-orm";

const router: Router = express.Router();

router.post("/", async (req, res) => {
  try {
    const newUser = {
      id: crypto.randomUUID(),
      email: req.body.email,
      name: req.body.name,
      role: req.body.role ?? "student",
      image: req.body.image,
      imageCldPubId: req.body.imageCldPubId,
      emailVerified: req.body.emailVerified ?? false,
    };

    const [createdUser] = await db.insert(user).values(newUser).returning();

    res.status(201).json({
      message: "User created successfully",
      data: createdUser,
    });
  } catch (error) {
    console.error("POST User error", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const current = Number(req.query.current ?? 1);
    const pageSize = Number(req.query.pageSize ?? 10);
    const offset = (current - 1) * pageSize;

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

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        imageCldPubId: user.imageCldPubId,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
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
        total,
        totalPages: Math.ceil(total / pageSize),
        page: current,
        limit: pageSize,
      },
    });
  } catch (error) {
    console.error("GET Users error", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const [foundUser] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        imageCldPubId: user.imageCldPubId,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, id));

    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ data: foundUser });
  } catch (error) {
    console.error("GET User error", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const [updatedUser] = await db
      .update(user)
      .set({
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        image: req.body.image,
        imageCldPubId: req.body.imageCldPubId,
        emailVerified: req.body.emailVerified,
      })
      .where(eq(user.id, id))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        imageCldPubId: user.imageCldPubId,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ data: updatedUser });
  } catch (error) {
    console.error("PUT User error", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log("DELETE User id:", id);
    await db.delete(user).where(eq(user.id, id));

    res.status(200).json({ message: "User deleted successfully", data: {} });
  } catch (error) {
    // console.error("DELETE User error", error);
    console.log("DELETE User error", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
