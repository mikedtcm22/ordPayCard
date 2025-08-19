/**
 * Test for E1: bitcoin-cli OP_RETURN examples documentation
 * 
 * Purpose: Ensure documentation exists with required bitcoin-cli examples
 * for creating OP_RETURN transactions with inscription ID and expiry block.
 * 
 * Test verifies:
 * - Documentation file exists at expected location
 * - Contains required placeholders (<NFT_ID> and <EXPIRY_BLOCK>)
 * - Includes OP_RETURN output in code examples
 * - Has required sections (Overview, Prerequisites, Examples, Troubleshooting)
 */

import * as fs from 'fs';
import * as path from 'path';

describe('E1: bitcoin-cli OP_RETURN examples documentation', () => {
  const docPath = path.join(__dirname, '../../../docs/testing/opreturn-bitcoin-cli-examples.md');

  it('should have documentation file at expected location', () => {
    expect(fs.existsSync(docPath)).toBe(true);
  });

  it('should contain required placeholders and content', () => {
    const content = fs.readFileSync(docPath, 'utf-8');
    
    // Required placeholders
    expect(content).toContain('<NFT_ID>');
    expect(content).toContain('<EXPIRY_BLOCK>');
    
    // OP_RETURN must be present in code blocks
    expect(content).toMatch(/`[^`]*OP_RETURN[^`]*`/);
    
    // Required sections
    expect(content).toMatch(/#+\s*Overview/i);
    expect(content).toMatch(/#+\s*Prerequisites/i);
    expect(content).toMatch(/#+\s*Regtest/i);
    expect(content).toMatch(/#+\s*Troubleshooting/i);
  });

  it('should include bitcoin-cli command examples', () => {
    const content = fs.readFileSync(docPath, 'utf-8');
    
    // Should have bitcoin-cli commands
    expect(content).toMatch(/bitcoin-cli/);
    
    // Should have createrawtransaction or similar
    expect(content).toMatch(/createrawtransaction|fundrawtransaction|walletcreatefundedpsbt/);
    
    // Should mention hex encoding for OP_RETURN data
    expect(content).toMatch(/hex|hexadecimal/i);
  });

  it('should include network-specific notes', () => {
    const content = fs.readFileSync(docPath, 'utf-8');
    
    // Should mention different networks
    expect(content).toMatch(/regtest/i);
    expect(content).toMatch(/signet|testnet/i);
    expect(content).toMatch(/mainnet/i);
  });

  it('should include proper OP_RETURN format documentation', () => {
    const content = fs.readFileSync(docPath, 'utf-8');
    
    // Should document the canonical format
    expect(content).toContain('|'); // Pipe separator between NFT_ID and EXPIRY_BLOCK
    
    // Should explain expiry block
    expect(content).toMatch(/expiry|expiration/i);
    
    // Should mention creator address payment
    expect(content).toMatch(/creator|payment|fee/i);
  });
});