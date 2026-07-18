import "dotenv/config";
import {betterAuth} from "better-auth";
import {drizzleAdapter} from "better-auth/adapters/drizzle";
import {db} from "../db"; // your drizzle instance
import * as schema from '../db/schema/auth.ts'
export const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET!,
    trustOrigins: [process.env.FRONTEND_URL!],
    baseURL: process.env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite
        schema,
    }),
    emailAndPassword: {
        enabled: true
    },
    user: {
        additionalFields: {
            role: {type: 'string', required: true, default: 'student', input: true},
            imageCldPubId: {type: 'string', required: false, input: true}
        }
    }
});