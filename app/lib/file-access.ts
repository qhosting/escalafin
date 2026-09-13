import type { Prisma } from '@prisma/client';

export interface FileActor { id: string; role: string; tenantId: string | null }

/** Use the same predicate for listing, downloading and deleting documents. */
export function fileAccessWhere(actor: FileActor, action: 'read' | 'delete' = 'read'): Prisma.FileWhereInput {
  if (actor.role === 'SUPER_ADMIN') return {};
  if (!actor.tenantId || !['ADMIN', 'ASESOR', 'CLIENTE'].includes(actor.role)) {
    return { id: { in: [] } };
  }
  const tenant: Prisma.FileWhereInput = { OR: [
    { client: { is: { tenantId: actor.tenantId } } },
    { clientId: null, uploadedBy: { is: { tenantId: actor.tenantId } } },
  ] };
  if (actor.role === 'ADMIN') return tenant;
  const permitted: Prisma.FileWhereInput[] = [{ uploadedById: actor.id }];
  if (actor.role === 'ASESOR') permitted.push({ client: { is: { asesorId: actor.id } } });
  if (actor.role === 'CLIENTE' && action === 'read') permitted.push({ client: { is: { userId: actor.id } } });
  return { AND: [tenant, { OR: permitted }] };
}
