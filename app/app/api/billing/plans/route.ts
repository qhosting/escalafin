/**
 * API Route: Planes de Suscripción
 * GET /api/billing/plans - Lista planes disponibles
 */

import { NextRequest, NextResponse } from 'next/server';
import { PlansService } from '@/lib/billing/plans';

export async function GET(request: NextRequest) {
    try {
        const plans = await PlansService.getActivePlans();

        // Parsear features y limits para la respuesta
        const plansWithDetails = plans.map(plan => ({
            id: plan.id,
            name: plan.name,
            displayName: plan.displayName,
            description: plan.description,
            priceMonthly: Number(plan.priceMonthly),
            priceYearly: plan.priceYearly ? Number(plan.priceYearly) : null,
            currency: plan.currency,
            features: PlansService.parseFeatures(plan),
            limits: PlansService.parseLimits(plan),
            isPopular: plan.isPopular,
            trialDays: plan.trialDays
        }));

        return NextResponse.json({
            success: true,
            plans: plansWithDetails
        });

    } catch (error) {
        console.error('Error fetching plans:', error);
        return NextResponse.json(
            { success: false, error: 'Error al obtener los planes' },
            { status: 500 }
        );
    }
}
