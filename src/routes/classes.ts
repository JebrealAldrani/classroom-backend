import express, {Router} from "express";
import {classes} from "../db/schema/index.js";
import {db} from "../db/index.js";

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

export default router;