
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { twoFactorAuth } from '@/lib/two-factor-auth';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { secret, otpauthUrl } = twoFactorAuth.generateSecret(session.user.email!);
        const qrCode = await twoFactorAuth.generateQRCode(otpauthUrl);

        return NextResponse.json({ secret, qrCode });
    } catch (error) {
        console.error('Error in 2FA Setup GET:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await request.json();
        const { secret, code } = body;

        if (!secret || !code) {
            return NextResponse.json({ error: 'Secret and code are required' }, { status: 400 });
        }

        const result = await twoFactorAuth.enable2FA(session.user.id, secret, code);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in 2FA Setup POST:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
