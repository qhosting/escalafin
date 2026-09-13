import { fileAccessWhere } from '@/lib/file-access';

describe('file access policy', () => {
  it('scopes administrators to their tenant', () => {
    const where = fileAccessWhere({ id: 'admin-1', role: 'ADMIN', tenantId: 'tenant-a' });
    expect(JSON.stringify(where)).toContain('tenant-a');
  });

  it('does not grant access without a tenant', () => {
    expect(fileAccessWhere({ id: 'user-1', role: 'ADMIN', tenantId: null })).toEqual({ id: { in: [] } });
  });

  it('limits advisors to owned or assigned client files', () => {
    const where = fileAccessWhere({ id: 'advisor-1', role: 'ASESOR', tenantId: 'tenant-a' });
    expect(JSON.stringify(where)).toContain('advisor-1');
    expect(JSON.stringify(where)).toContain('tenant-a');
  });
});
