import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { applyRateLimit, rateLimiters } from '@/lib/rate-limiter';

const handler = NextAuth(authOptions);

async function authHandler(req: NextRequest, context: any) {
    if (req.method === 'POST') {
        const rateLimit = await applyRateLimit(req, rateLimiters.auth);
        if (rateLimit) return rateLimit;
    }
    return handler(req, context);
}

export { authHandler as GET, authHandler as POST };
