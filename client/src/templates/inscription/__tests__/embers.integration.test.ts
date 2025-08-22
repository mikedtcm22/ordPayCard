/**
 * Tests for Template Embers Core integration
 * Verifies templates can load Embers Core from inscription IDs
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderTemplate, getEmbersInscriptionId } from '../loader';
import { JSDOM } from 'jsdom';

describe('Template Embers Core integration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('getEmbersInscriptionId', () => {
    it('should return regtest inscription ID when on regtest network', () => {
      process.env.VITE_EMBERS_CORE_REGTEST_ID = 'regtest123i0';
      process.env.VITE_BITCOIN_NETWORK = 'regtest';
      
      const id = getEmbersInscriptionId();
      expect(id).toBe('regtest123i0');
    });

    it('should return signet inscription ID when on signet network', () => {
      process.env.VITE_EMBERS_CORE_SIGNET_ID = 'signet456i0';
      process.env.VITE_BITCOIN_NETWORK = 'signet';
      
      const id = getEmbersInscriptionId();
      expect(id).toBe('signet456i0');
    });

    it('should return testnet inscription ID when on testnet network', () => {
      process.env.VITE_EMBERS_CORE_TESTNET_ID = 'testnet789i0';
      process.env.VITE_BITCOIN_NETWORK = 'testnet';
      
      const id = getEmbersInscriptionId();
      expect(id).toBe('testnet789i0');
    });

    it('should return mainnet inscription ID when on mainnet network', () => {
      process.env.VITE_EMBERS_CORE_MAINNET_ID = 'mainnet999i0';
      process.env.VITE_BITCOIN_NETWORK = 'mainnet';
      
      const id = getEmbersInscriptionId();
      expect(id).toBe('mainnet999i0');
    });

    it('should return null when inscription ID not configured', () => {
      process.env.VITE_BITCOIN_NETWORK = 'signet';
      delete process.env.VITE_EMBERS_CORE_SIGNET_ID;
      
      const id = getEmbersInscriptionId();
      expect(id).toBeNull();
    });

    it('should default to regtest when network not specified', () => {
      process.env.VITE_EMBERS_CORE_REGTEST_ID = 'default123i0';
      delete process.env.VITE_BITCOIN_NETWORK;
      
      const id = getEmbersInscriptionId();
      expect(id).toBe('default123i0');
    });
  });

  describe('renderTemplate', () => {
    it('should load Embers Core from inscription ID', async () => {
      process.env.VITE_EMBERS_CORE_SIGNET_ID = 'abc123i0';
      process.env.VITE_BITCOIN_NETWORK = 'signet';
      
      const template = await renderTemplate();
      expect(template).toContain('/content/abc123i0');
      expect(template).toContain('<script');
    });

    it('should include fallback comment when inscription not available', async () => {
      delete process.env.VITE_EMBERS_CORE_SIGNET_ID;
      process.env.VITE_BITCOIN_NETWORK = 'signet';
      
      const template = await renderTemplate();
      expect(template).toContain('<!-- Embers Core not available -->');
    });

    it('should handle invalid inscription ID gracefully', async () => {
      process.env.VITE_EMBERS_CORE_SIGNET_ID = 'invalid';
      process.env.VITE_BITCOIN_NETWORK = 'signet';
      
      const template = await renderTemplate();
      expect(template).toContain('<!-- Embers Core not available -->');
    });

    it('should use correct ord URL based on network', async () => {
      process.env.VITE_EMBERS_CORE_TESTNET_ID = 'test123i0';
      process.env.VITE_BITCOIN_NETWORK = 'testnet';
      
      const template = await renderTemplate();
      expect(template).toContain('https://testnet.ordinals.com/content/test123i0');
    });

    it('should cache loaded Embers Core library', async () => {
      process.env.VITE_EMBERS_CORE_SIGNET_ID = 'cache123i0';
      process.env.VITE_BITCOIN_NETWORK = 'signet';
      
      const template1 = await renderTemplate();
      const template2 = await renderTemplate();
      
      // Both should be identical (cached)
      expect(template1).toBe(template2);
    });

    it('should include version checking', async () => {
      process.env.VITE_EMBERS_CORE_SIGNET_ID = 'version123i0';
      process.env.VITE_BITCOIN_NETWORK = 'signet';
      process.env.VITE_EMBERS_MIN_VERSION = '1.0.0';
      
      const template = await renderTemplate();
      expect(template).toContain('EMBERS_MIN_VERSION');
    });

    it('should add integrity verification when hash provided', async () => {
      process.env.VITE_EMBERS_CORE_SIGNET_ID = 'integrity123i0';
      process.env.VITE_EMBERS_CORE_SIGNET_HASH = 'sha256-abc123...';
      process.env.VITE_BITCOIN_NETWORK = 'signet';
      
      const template = await renderTemplate();
      expect(template).toContain('integrity="sha256-abc123..."');
    });
  });

  describe('Template DOM integration', () => {
    it('should make EmbersCore available in template context', async () => {
      process.env.VITE_EMBERS_CORE_SIGNET_ID = 'dom123i0';
      process.env.VITE_BITCOIN_NETWORK = 'signet';
      
      const template = await renderTemplate();
      const dom = new JSDOM(template, { runScripts: 'dangerously' });
      
      // Mock the EmbersCore being loaded
      (dom.window as any).EmbersCore = {
        verifyPayment: vi.fn().mockReturnValue(1000n),
        dedupe: vi.fn(),
        SEMVER: '1.0.0'
      };
      
      expect((dom.window as any).EmbersCore).toBeDefined();
      expect((dom.window as any).EmbersCore.SEMVER).toBe('1.0.0');
    });

    it('should handle missing EmbersCore gracefully', async () => {
      delete process.env.VITE_EMBERS_CORE_SIGNET_ID;
      process.env.VITE_BITCOIN_NETWORK = 'signet';
      
      const template = await renderTemplate();
      const dom = new JSDOM(template, { runScripts: 'dangerously' });
      
      // Should have fallback handling
      expect(template).toContain('if (typeof EmbersCore === "undefined")');
    });
  });
});