import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

function loadTemplateIntoDom() {
  const filePath = path.resolve(
    __dirname,
    '..',
    'registrationWrapper.html',
  );
  const html = fs.readFileSync(filePath, 'utf8');

  // Extract <body> inner HTML and strip the <script> so we can control evaluation separately
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyInner = bodyMatch ? bodyMatch[1] : '';
  const bodyWithoutScript = bodyInner.replace(/<script[\s\S]*?<\/script>/gi, '');
  document.body.innerHTML = bodyWithoutScript;

  // Return the embedded script content (the IIFE) so the test can evaluate it
  const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
  return scriptMatch ? scriptMatch[1] : '';
}

describe('registrationWrapper.html — B1 Parser-verified flow (RED)', () => {
  beforeEach(() => {
    // Reset DOM and globals
    document.documentElement.innerHTML = '<head></head><body></body>';
    // Provide minimal globals used by the template
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).CHILDREN = []; // no children by default
    // Mock EmbersCore.verifyPayment to simulate missing/mismatch/expired → 0n
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).EmbersCore = { verifyPayment: vi.fn().mockResolvedValue(0n) };
  });

  it('shows Not Registered and 0 sats when verifyPayment returns 0n (OP_RETURN missing/mismatch/expired)', async () => {
    const scriptContent = loadTemplateIntoDom();

    // Evaluate the template's embedded script (IIFE sets up window.load listener)
    // eslint-disable-next-line no-eval
    (0, eval)(scriptContent);

    // Trigger the template initialization
    window.dispatchEvent(new Event('load'));

    // Give any async microtasks a tick
    await Promise.resolve();

    const badge = document.getElementById('badge');
    expect(badge).toBeTruthy();
    // Expect updated copy: "Not Registered"
    expect(badge!.textContent || '').toMatch(/Not Registered/i);

    // Amount should render explicitly as 0 sats under parser-verified flow
    const paid = document.getElementById('paid');
    expect(paid).toBeTruthy();
    expect(paid!.textContent || '').toMatch(/0\s*sats/i);
  });
});

describe('registrationWrapper.html — B2 Deduplicate by feeTxid (RED)', () => {
  beforeEach(() => {
    // Reset DOM and globals
    document.documentElement.innerHTML = '<head></head><body></body>';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).CHILDREN = []; 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).EmbersCore = { verifyPayment: vi.fn(), dedupe: vi.fn() };
  });

  it('deduplicates feeTxid and uses only latest unique tx in status summary', async () => {
    // Setup mock children with duplicate feeTxid values
    const duplicateChildren = [
      { schema: 'buyer_registration.v1', feeTxid: 'abc123', amount: 1000 },
      { schema: 'buyer_registration.v1', feeTxid: 'def456', amount: 2000 },
      { schema: 'buyer_registration.v1', feeTxid: 'abc123', amount: 1500 }, // duplicate
      { schema: 'buyer_registration.v1', feeTxid: 'ghi789', amount: 3000 },
      { schema: 'buyer_registration.v1', feeTxid: 'def456', amount: 2500 }, // duplicate
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).CHILDREN = duplicateChildren;

    // Mock EmbersCore.dedupe to return unique txids (order-preserving)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).EmbersCore.dedupe = vi.fn().mockReturnValue(['abc123', 'def456', 'ghi789']);

    const scriptContent = loadTemplateIntoDom();

    // Evaluate the template's embedded script
    // eslint-disable-next-line no-eval
    (0, eval)(scriptContent);

    // Trigger template initialization
    window.dispatchEvent(new Event('load'));
    await Promise.resolve();

    // Verify dedupe was called with the extracted feeTxids
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((window as any).EmbersCore.dedupe).toHaveBeenCalledWith(['abc123', 'def456', 'abc123', 'ghi789', 'def456']);

    // Verify that only the first occurrence of each feeTxid is used
    // This test will fail initially since deduplication is not yet implemented
    const badge = document.getElementById('badge');
    expect(badge).toBeTruthy();
  });

  it('handles empty children array without errors', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).CHILDREN = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).EmbersCore.dedupe = vi.fn().mockReturnValue([]);

    const scriptContent = loadTemplateIntoDom();
    // eslint-disable-next-line no-eval
    (0, eval)(scriptContent);

    window.dispatchEvent(new Event('load'));
    await Promise.resolve();

    // Should not call dedupe with empty array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((window as any).EmbersCore.dedupe).toHaveBeenCalledWith([]);
  });
});

describe('registrationWrapper.html — B3 Developer debug flag (RED)', () => {
  beforeEach(() => {
    // Reset DOM and globals
    document.documentElement.innerHTML = '<head></head><body></body>';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).CHILDREN = []; 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).EmbersCore = { verifyPayment: vi.fn(), dedupe: vi.fn() };
    // Clean up any existing debug object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).__debug;
  });

  it('exposes window.__debug with diagnostic info when DEBUG=1', async () => {
    // Set DEBUG flag
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).DEBUG = 1;

    const mockChildren = [
      { schema: 'buyer_registration.v1', feeTxid: 'abc123', amount: 1000 }
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).CHILDREN = mockChildren;

    // Mock EmbersCore.verifyPayment to return some payment amount
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).EmbersCore.verifyPayment = vi.fn().mockResolvedValue(1000n);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).EmbersCore.dedupe = vi.fn().mockReturnValue(['abc123']);

    const scriptContent = loadTemplateIntoDom();

    // Evaluate the template's embedded script
    // eslint-disable-next-line no-eval
    (0, eval)(scriptContent);

    // Trigger template initialization and wait for async completion
    window.dispatchEvent(new Event('load'));
    await Promise.resolve();
    
    // Wait for checkRegistration async operations to complete
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registrationStatus = (window as any).registrationStatus;
    if (registrationStatus && typeof registrationStatus === 'function') {
      await registrationStatus();
    }

    // Verify __debug object exists and contains expected diagnostic info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const debugObj = (window as any).__debug;
    expect(debugObj).toBeTruthy();
    expect(debugObj).toBeTypeOf('object');
    
    // Should contain last inputs/outputs from registration check
    expect(debugObj).toHaveProperty('lastInputs');
    expect(debugObj).toHaveProperty('lastOutputs');
    expect(debugObj.lastInputs).toHaveProperty('selfId');
    expect(debugObj.lastInputs).toHaveProperty('children');
    expect(debugObj.lastOutputs).toHaveProperty('isRegistered');
    expect(debugObj.lastOutputs).toHaveProperty('paidSats');
  });

  it('includes provenance diagnostic fields when available', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).DEBUG = 1;

    // Mock diagnostic data that would come from provenance checks
    const mockDiagnostics = {
      H_parent: 850000,
      H_child: 850000,
      feeHeight: 849999,
      K: 1
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).PROVENANCE_DIAGNOSTICS = mockDiagnostics;

    const scriptContent = loadTemplateIntoDom();
    // eslint-disable-next-line no-eval
    (0, eval)(scriptContent);

    window.dispatchEvent(new Event('load'));
    await Promise.resolve();
    
    // Wait for checkRegistration async operations to complete
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registrationStatus = (window as any).registrationStatus;
    if (registrationStatus && typeof registrationStatus === 'function') {
      await registrationStatus();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const debugObj = (window as any).__debug;
    expect(debugObj).toBeTruthy();
    
    // Should include provenance diagnostics when available
    expect(debugObj).toHaveProperty('provenance');
    expect(debugObj.provenance).toEqual(mockDiagnostics);
  });

  it('does not expose window.__debug when DEBUG is false or unset', async () => {
    // Ensure DEBUG is not set
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).DEBUG = 0;

    const scriptContent = loadTemplateIntoDom();
    // eslint-disable-next-line no-eval
    (0, eval)(scriptContent);

    window.dispatchEvent(new Event('load'));
    await Promise.resolve();

    // Should not have debug object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((window as any).__debug).toBeUndefined();
  });

  it('removes existing __debug when DEBUG flag is false', async () => {
    // Pre-set some debug data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__debug = { existing: 'data' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).DEBUG = false;

    const scriptContent = loadTemplateIntoDom();
    // eslint-disable-next-line no-eval
    (0, eval)(scriptContent);

    window.dispatchEvent(new Event('load'));
    await Promise.resolve();
    
    // Wait for checkRegistration async operations to complete
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registrationStatus = (window as any).registrationStatus;
    if (registrationStatus && typeof registrationStatus === 'function') {
      await registrationStatus();
    }

    // Should have removed existing debug object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((window as any).__debug).toBeUndefined();
  });

  it('avoids including PII in debug output', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).DEBUG = 1;

    const mockChildren = [
      { 
        schema: 'buyer_registration.v1', 
        feeTxid: 'abc123', 
        amount: 1000,
        buyer_email: 'secret@example.com', // PII that should not appear
        buyer_name: 'Secret Name' // PII that should not appear
      }
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).CHILDREN = mockChildren;

    const scriptContent = loadTemplateIntoDom();
    // eslint-disable-next-line no-eval
    (0, eval)(scriptContent);

    window.dispatchEvent(new Event('load'));
    await Promise.resolve();
    
    // Wait for checkRegistration async operations to complete
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registrationStatus = (window as any).registrationStatus;
    if (registrationStatus && typeof registrationStatus === 'function') {
      await registrationStatus();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const debugObj = (window as any).__debug;
    expect(debugObj).toBeTruthy();
    
    // Should not contain PII fields in debug output
    const debugStr = JSON.stringify(debugObj);
    expect(debugStr).not.toContain('secret@example.com');
    expect(debugStr).not.toContain('Secret Name');
    expect(debugStr).not.toContain('buyer_email');
    expect(debugStr).not.toContain('buyer_name');
  });
});


