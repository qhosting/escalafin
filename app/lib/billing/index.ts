/**
 * Módulo de Billing para SaaS
 * Exporta todos los servicios de billing desde un único punto de entrada
 */

export { PlansService, DEFAULT_PLAN_LIMITS, PLAN_FEATURES } from './plans';
export type { PlanLimits, PlanFeature } from './plans';

export { SubscriptionsService } from './subscriptions';
export type { SubscriptionWithPlan, CreateSubscriptionInput, SubscriptionSummary } from './subscriptions';

export { UsageTracker, getCurrentPeriod } from './usage-tracker';
export type { UsageMetric, UsageSnapshot, UsageIncrement } from './usage-tracker';

export { LimitsService, TenantLimitExceededError } from './limits';
export type { LimitableResource, LimitCheckResult, AllLimitsStatus } from './limits';
