/**
 * Integration tests for Signet network health monitoring
 * Verifies ord sync status and block production
 */

import { checkSignetHealth } from '../../../utils/signet-health';

// Skip these tests in CI environment as they may attempt to connect to bitcoin-cli
const describeSkipCI = process.env['CI'] ? describe.skip : describe;

describeSkipCI('Signet health checks', () => {
  it('should verify ord is synced', async () => {
    const health = await checkSignetHealth();
    expect(health.ordSynced).toBeDefined();
    expect(health.chainHeight).toBeGreaterThan(0);
  });
  
  it('should detect when ord is behind', async () => {
    const health = await checkSignetHealth();
    
    // If ord is behind chain tip by more than 2 blocks
    if (health.ordHeight < health.chainHeight - 2) {
      expect(health.warnings).toContain('Ord is behind chain tip');
    } else {
      // Otherwise it should be synced
      expect(health.ordSynced).toBe(true);
    }
  });
  
  it('should report chain sync status', async () => {
    const health = await checkSignetHealth();
    
    expect(health).toMatchObject({
      network: 'signet',
      chainHeight: expect.any(Number),
      ordHeight: expect.any(Number),
      ordSynced: expect.any(Boolean),
      timestamp: expect.any(String),
      warnings: expect.any(Array)
    });
  });
  
  it('should calculate sync percentage', async () => {
    const health = await checkSignetHealth();
    
    if (health.chainHeight > 0 && health.ordHeight > 0) {
      const syncPercentage = (health.ordHeight / health.chainHeight) * 100;
      expect(syncPercentage).toBeGreaterThanOrEqual(0);
      expect(syncPercentage).toBeLessThanOrEqual(100);
    }
  });
  
  it('should detect network connectivity issues', async () => {
    const health = await checkSignetHealth();
    
    // Check if endpoints are reachable
    expect(health.endpoints).toMatchObject({
      bitcoin: expect.any(Boolean),
      ord: expect.any(Boolean)
    });
    
    if (!health.endpoints.bitcoin || !health.endpoints.ord) {
      expect(health.warnings).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/endpoint not reachable/)
        ])
      );
    }
  });
  
  it('should measure block production rate', async () => {
    const health = await checkSignetHealth();
    
    if (health.blockProductionRate) {
      // Signet should produce blocks roughly every 10 minutes
      expect(health.blockProductionRate).toMatchObject({
        averageBlockTime: expect.any(Number),
        lastBlockTime: expect.any(String),
        isHealthy: expect.any(Boolean)
      });
      
      // Average block time should be around 600 seconds (10 minutes)
      // Allow for some variance
      if (health.blockProductionRate.isHealthy) {
        expect(health.blockProductionRate.averageBlockTime).toBeGreaterThan(300); // 5 minutes
        expect(health.blockProductionRate.averageBlockTime).toBeLessThan(1200); // 20 minutes
      }
    }
  });
});