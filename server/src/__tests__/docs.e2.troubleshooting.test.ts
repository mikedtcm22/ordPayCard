/**
 * Test for E2: Wallet troubleshooting guide documentation
 * 
 * Purpose: Ensure wallet troubleshooting guide exists with required sections
 * to help users when their wallet cannot add OP_RETURN or has other issues.
 * 
 * Test verifies:
 * - Documentation file exists at expected location
 * - Contains required sections (Supported Wallets, Alternatives, etc.)
 * - Includes practical troubleshooting steps
 * - References E1 examples appropriately
 */

import * as fs from 'fs';
import * as path from 'path';

describe('E2: Wallet troubleshooting guide documentation', () => {
  const docPath = path.join(__dirname, '../../../docs/testing/wallet-troubleshooting.md');

  it('should have documentation file at expected location', () => {
    expect(fs.existsSync(docPath)).toBe(true);
  });

  it('should contain required section headings', () => {
    const content = fs.readFileSync(docPath, 'utf-8');
    
    // Required sections as per specification
    expect(content).toMatch(/#+\s*Supported Wallets/i);
    expect(content).toMatch(/#+\s*Alternatives/i);
    expect(content).toMatch(/#+\s*Raw Builder Flow/i);
    expect(content).toMatch(/#+\s*Verification/i);
    expect(content).toMatch(/#+\s*FAQ/i);
  });

  it('should include wallet capability matrix', () => {
    const content = fs.readFileSync(docPath, 'utf-8');
    
    // Should mention specific wallets and their OP_RETURN capabilities
    expect(content).toMatch(/OP_RETURN/);
    expect(content).toMatch(/capability|support|compatible/i);
    
    // Should have table or list format for wallet comparison
    expect(content.match(/\|/g)?.length).toBeGreaterThan(3); // Table format with pipes
  });

  it('should reference E1 bitcoin-cli examples', () => {
    const content = fs.readFileSync(docPath, 'utf-8');
    
    // Should link to or reference the E1 examples document
    expect(content).toMatch(/opreturn-bitcoin-cli-examples|bitcoin-cli.*examples/i);
    
    // Should mention raw transaction or PSBT as fallback
    expect(content).toMatch(/raw.*transaction|PSBT|createrawtransaction/i);
  });

  it('should include verification steps', () => {
    const content = fs.readFileSync(docPath, 'utf-8');
    
    // Should explain how to verify OP_RETURN presence
    expect(content).toMatch(/verify|validate|check|confirm/i);
    
    // Should mention decoding or inspecting transactions
    expect(content).toMatch(/decode|inspect|examine/i);
    
    // Should reference payment amount verification
    expect(content).toMatch(/payment|amount|fee/i);
  });

  it('should provide common error solutions', () => {
    const content = fs.readFileSync(docPath, 'utf-8');
    
    // Should have common errors section
    expect(content).toMatch(/error|issue|problem|troubleshoot/i);
    
    // Should provide solutions or workarounds
    expect(content).toMatch(/solution|fix|workaround|resolve/i);
    
    // Should mention specific error scenarios
    expect(content).toMatch(/missing.*OP_RETURN|invalid|rejected/i);
  });

  it('should include FAQ section with practical questions', () => {
    const content = fs.readFileSync(docPath, 'utf-8');
    
    // FAQ should have question format (using ? or Q:)
    expect(content).toMatch(/\?|Q:|Question/);
    
    // Should address common concerns
    expect(content).toMatch(/wallet.*support|manual|alternative/i);
  });

  it('should reference status API debug fields', () => {
    const content = fs.readFileSync(docPath, 'utf-8');
    
    // Should mention how to use status API for debugging
    expect(content).toMatch(/status.*API|debug|registration.*status/i);
    
    // Should reference the endpoint or debug fields
    expect(content).toMatch(/api\/registration|debug.*field|isRegistered/i);
  });
});