import type {Request, Response, NextFunction} from "express";
import aj from "../config/arcjet.ts"
import {ArcjetNodeRequest, slidingWindow} from "@arcjet/node";

const securityMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'test') return next();

    try {
        const role: RateLimitRole = req.user?.role! ?? "guest"

        let limit;
        let message;

        switch (role) {
            case 'admin':
                limit = 20;
                message = "admin request limit exceed (20 per minute), slow down";
                break;
            case 'teacher':
            case 'student':
                limit = 10;
                message = 'user request limit exceed (10 per minute), please wait'
                break;
            default:
                limit = 5;
                message = 'Guest request limit exceed (5 per minute), please signup for higher limits';
        }

        const client = aj.withRule(
            slidingWindow({
                mode: 'LIVE',
                interval: '1s',
                max: limit
            })
        )

        const arcjetRequest: ArcjetNodeRequest = {
            headers: req.headers,
            method: req.method,
            url: req.originalUrl,
            socket: {
                remoteAddress: req.socket.remoteAddress ?? req.ip ?? '0.0.0.0'
            }
        }

        const decision = await client.protect(arcjetRequest);

        if (decision.isDenied() && decision.reason.isBot()) {
            return res.status(403).json({error: 'Forbidden', message: 'Automated requests are not allowed'})
        }

        if (decision.isDenied() && decision.reason.isShield()) {
            return res.status(403).json({error: 'Forbidden', message: 'Request blocked by security policy'})
        }

        if (decision.isDenied() && decision.reason.isRateLimit()) {
            return res.status(403).json({error: 'Too many requests', message: message})
        }

        next();
    } catch (error) {
        console.error('arcjet middleware error', error);
        res.status(500).json({
            error: 'Internal Error',
            message: 'something went wrong with arcjet security middleware'
        })
    }
}

export default securityMiddleware;
