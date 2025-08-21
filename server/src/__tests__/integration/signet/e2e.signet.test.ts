/**
 * End-to-end integration tests for complete registration flow on Signet
 * Tests the full workflow from template generation to registration validation
 */

import {
  generateTemplate,
  inscribeOnSignet,
  createTxWithOpReturn,
  inscribeChild,
  waitForConfirmations,
  fetchRegistrationStatus,
  renderTemplate,
  getCurrentBlockHeight
} from './template-utils';

// Skip these tests in CI environment as they require local Signet node
const describeSkipCI = process.env['CI'] ? describe.skip : describe;

describeSkipCI('E2E registration on Signet (requires local Signet node)', () => {
  it('should complete full registration flow', async () => {
    // 1. Deploy parent template
    const parentHtml = generateTemplate('tb1qz3kmh8r2ezsqkhes255wrlslk027n0sf0luukq', 1000);
    const parentId = await inscribeOnSignet(parentHtml);
    
    // 2. Get current block for expiry calculation
    const currentBlock = await getCurrentBlockHeight();
    
    // 3. Create payment with OP_RETURN
    const paymentTx = await createTxWithOpReturn(
      `${parentId}|${currentBlock + 144}`,
      'tb1qz3kmh8r2ezsqkhes255wrlslk027n0sf0luukq',
      0.00001
    );
    
    // 4. Create child registration
    const receipt = { feeTxid: paymentTx, timestamp: Date.now() };
    const childId = await inscribeChild(parentId, receipt);
    
    // 5. Wait for confirmation
    await waitForConfirmations(childId, 1);
    
    // 6. Verify registration active
    const status = await fetchRegistrationStatus(parentId);
    expect(status.isRegistered).toBe(true);
    
    // 7. Verify in browser simulation
    const rendered = await renderTemplate(parentId);
    expect(rendered).toContain('Active');
  });
});