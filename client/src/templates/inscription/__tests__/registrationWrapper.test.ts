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


