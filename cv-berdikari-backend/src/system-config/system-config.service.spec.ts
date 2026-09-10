import { SystemConfigService } from './system-config.service';

describe('SystemConfigService', () => {
  it('should return default 0.11 when no config', async () => {
    const svc = new SystemConfigService({ systemConfig: { findFirst: jest.fn().mockResolvedValue(null) } } as any);
    expect(await svc.getPpnRate()).toBe(0.11);
  });
  it('should return stored rate', async () => {
    const svc = new SystemConfigService({ systemConfig: { findFirst: jest.fn().mockResolvedValue({ value: '0.12' }) } } as any);
    expect(await svc.getPpnRate()).toBe(0.12);
  });
});
