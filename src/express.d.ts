// src/types/express.d.ts
import "express";

declare global {
    namespace Express {
        interface Request {
            user?: {
                role: 'admin' | 'student' | 'teacher';
            };
        }
    }
}

export {};