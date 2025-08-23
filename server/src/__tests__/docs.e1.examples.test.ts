/**
 * Tests for OP_RETURN documentation and examples
 * Verifies documentation contains required content about size limits and validation
 */

import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('E1 - OP_RETURN documentation', () => {
  const docPath = path.join(__dirname, '../../../docs/testing/opreturn-bitcoin-cli-examples.md');
  
  describe('document existence', () => {
    it('should have OP_RETURN examples document', () => {
      // Assert
      expect(fs.existsSync(docPath)).toBe(true);
    });
  });
  
  describe('required content', () => {
    let docContent: string;
    
    beforeAll(() => {
      // Read document content if it exists
      if (fs.existsSync(docPath)) {
        docContent = fs.readFileSync(docPath, 'utf8');
      } else {
        docContent = '';
      }
    });
    
    it('should mention OP_RETURN size limits (80-83 bytes)', () => {
      // Assert
      expect(docContent).toContain('80');
      expect(docContent).toContain('bytes');
      expect(docContent.toLowerCase()).toContain('op_return');
      
      // Should mention the range
      const hasRange = docContent.includes('80-83') || 
                       docContent.includes('80 to 83') ||
                       (docContent.includes('80') && docContent.includes('83'));
      expect(hasRange).toBe(true);
    });
    
    it('should include validateaddress usage', () => {
      // Assert
      expect(docContent).toContain('validateaddress');
      expect(docContent).toContain('bitcoin-cli');
    });
    
    it('should contain NFT_ID and EXPIRY_BLOCK placeholders', () => {
      // Assert
      expect(docContent).toContain('<NFT_ID>');
      expect(docContent).toContain('<EXPIRY_BLOCK>');
      
      // Should show the pipe separator format
      expect(docContent).toContain('|');
    });
    
    it('should include OP_RETURN in code blocks', () => {
      // Assert - look for OP_RETURN in code blocks (indented or fenced)
      const codeBlockWithOpReturn = 
        /```[\s\S]*?OP_RETURN[\s\S]*?```/.test(docContent) || // Fenced code block
        /    .*OP_RETURN/.test(docContent); // Indented code block
      
      expect(codeBlockWithOpReturn).toBe(true);
    });
    
    it('should include minimal decode/verification snippet', () => {
      // Assert
      expect(docContent).toContain('decode');
      
      // Should have verification steps
      const hasVerification = 
        docContent.includes('verify') ||
        docContent.includes('validation') ||
        docContent.includes('check');
      expect(hasVerification).toBe(true);
    });
    
    it('should link to parser rules', () => {
      // Assert - should reference parser or status API
      const hasParserLink = 
        docContent.includes('parser') ||
        docContent.includes('registration/parser') ||
        docContent.includes('status API');
      expect(hasParserLink).toBe(true);
    });
    
    it('should have network-specific examples', () => {
      // Assert - should mention different networks
      expect(docContent.toLowerCase()).toContain('regtest');
      expect(docContent.toLowerCase()).toContain('signet');
      
      // Should mention testnet or mainnet
      const hasOtherNetworks = 
        docContent.toLowerCase().includes('testnet') ||
        docContent.toLowerCase().includes('mainnet');
      expect(hasOtherNetworks).toBe(true);
    });
    
    it('should include fundrawtransaction or walletcreatefundedpsbt', () => {
      // Assert - should show funding methods
      const hasFundingMethod = 
        docContent.includes('fundrawtransaction') ||
        docContent.includes('walletcreatefundedpsbt');
      expect(hasFundingMethod).toBe(true);
    });
    
    it('should have troubleshooting section', () => {
      // Assert
      expect(docContent.toLowerCase()).toContain('troubleshoot');
      
      // Should mention common errors
      const hasErrors = 
        docContent.toLowerCase().includes('error') ||
        docContent.toLowerCase().includes('issue') ||
        docContent.toLowerCase().includes('problem');
      expect(hasErrors).toBe(true);
    });
  });
  
  describe('document structure', () => {
    let docContent: string;
    
    beforeAll(() => {
      if (fs.existsSync(docPath)) {
        docContent = fs.readFileSync(docPath, 'utf8');
      } else {
        docContent = '';
      }
    });
    
    it('should have proper markdown structure', () => {
      // Assert - should have headers
      expect(docContent).toContain('#');
      
      // Should have Overview section
      expect(docContent).toContain('Overview');
      
      // Should have Prerequisites or Requirements
      const hasPrereqs = 
        docContent.includes('Prerequisite') ||
        docContent.includes('Requirement');
      expect(hasPrereqs).toBe(true);
    });
    
    it('should include complete example commands', () => {
      // Assert - should have bitcoin-cli commands
      expect(docContent).toContain('bitcoin-cli');
      
      // Should have complete transaction creation flow
      const hasTransactionFlow = 
        docContent.includes('createrawtransaction') ||
        docContent.includes('createpsbt');
      expect(hasTransactionFlow).toBe(true);
      
      // Should show signing
      const hasSigning = 
        docContent.includes('signrawtransaction') ||
        docContent.includes('walletprocesspsbt');
      expect(hasSigning).toBe(true);
      
      // Should show broadcasting
      expect(docContent).toContain('sendrawtransaction');
    });
  });
});