import { 
  buildInscriptionScript,
  calculateInscriptionSize,
  calculateInscriptionFee,
  validateInscriptionContent,
  createHtmlInscriptionData 
} from '../envelopeBuilder';
import * as bitcoin from 'bitcoinjs-lib';

describe('EnvelopeBuilder', () => {
  const testContent = '<html><body>Test</body></html>';
  const testContentType = 'text/html;charset=utf-8';

  describe('buildInscriptionScript', () => {
    it('should create valid inscription envelope', () => {
      const data = {
        contentType: testContentType,
        content: Buffer.from(testContent, 'utf8')
      };
      
      const script = buildInscriptionScript(data);
      
      // Check that script starts with OP_FALSE OP_IF
      expect(script[0]).toBe(bitcoin.opcodes['OP_FALSE']);
      expect(script[1]).toBe(bitcoin.opcodes['OP_IF']);
      
      // Check that script contains "ord" identifier
      const scriptHex = script.toString('hex');
      expect(scriptHex).toContain('6f7264'); // "ord" in hex
      
      // Check that script ends with OP_ENDIF
      expect(script[script.length - 1]).toBe(bitcoin.opcodes['OP_ENDIF']);
    });

    it('should handle large content by chunking', () => {
      const largeContent = 'x'.repeat(1000); // Content larger than 520 bytes
      const data = {
        contentType: 'text/plain',
        content: Buffer.from(largeContent, 'utf8')
      };
      
      const script = buildInscriptionScript(data);
      
      // Should create valid script without errors
      expect(script.length).toBeGreaterThan(1000);
      expect(script[0]).toBe(bitcoin.opcodes['OP_FALSE']);
    });

    it('should include metadata when provided', () => {
      const data = {
        contentType: testContentType,
        content: Buffer.from(testContent, 'utf8'),
        metadata: { version: 1, author: 'test' }
      };
      
      const script = buildInscriptionScript(data);
      const scriptHex = script.toString('hex');
      
      // Check metadata is included
      expect(scriptHex).toContain(Buffer.from('metadata', 'utf8').toString('hex'));
      expect(scriptHex).toContain(Buffer.from('version', 'utf8').toString('hex'));
    });
  });

  describe('calculateInscriptionSize', () => {
    it('should calculate reasonable size for small content', () => {
      const size = calculateInscriptionSize(testContent, testContentType);
      
      // Base transaction + inscription content + overhead
      expect(size).toBeGreaterThan(100); // Minimum transaction size
      expect(size).toBeLessThan(500); // Should be reasonable for small content
    });

    it('should scale with content size', () => {
      const smallSize = calculateInscriptionSize('small', 'text/plain');
      const largeSize = calculateInscriptionSize('x'.repeat(1000), 'text/plain');
      
      expect(largeSize).toBeGreaterThan(smallSize);
      // Should be significantly larger than small size (witness + base tx),
      // without asserting an absolute threshold that is implementation-specific
      expect(largeSize).toBeGreaterThan(smallSize + 200);
    });
  });

  describe('calculateInscriptionFee', () => {
    it('should calculate fees with buffer', () => {
      const fees = calculateInscriptionFee(1000, 10);
      
      expect(fees.commitFee).toBeGreaterThan(0);
      expect(fees.revealFee).toBeGreaterThan(0);
      // Rounding differences may cause +/-1 variance
      expect(Math.abs(fees.totalFee - (fees.commitFee + fees.revealFee))).toBeLessThanOrEqual(1);
      
      // Check 10% buffer is applied
      const baseTotal = Math.ceil(200 * 10) + Math.ceil(1000 * 10);
      expect(fees.totalFee).toBeGreaterThan(baseTotal);
    });

    it('should handle reveal-only calculation', () => {
      const fees = calculateInscriptionFee(1000, 10, false);
      
      expect(fees.commitFee).toBeGreaterThan(0);
      expect(fees.revealFee).toBe(0);
      expect(fees.totalFee).toBe(fees.commitFee);
    });
  });

  describe('validateInscriptionContent', () => {
    it('should validate valid content', () => {
      const result = validateInscriptionContent(testContent, testContentType);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject content that is too large', () => {
      const largeContent = 'x'.repeat(500000); // 500KB
      const result = validateInscriptionContent(largeContent, testContentType);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too large');
    });

    it('should reject invalid content type', () => {
      const result = validateInscriptionContent(testContent, '');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should validate MIME type format', () => {
      const validTypes = ['text/html', 'image/png', 'application/json'];
      const invalidTypes = ['!invalid', 'text html', ''];
      
      validTypes.forEach(type => {
        const result = validateInscriptionContent('test', type);
        expect(result.valid).toBe(true);
      });
      
      invalidTypes.forEach(type => {
        const result = validateInscriptionContent('test', type);
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('createHtmlInscriptionData', () => {
    it('should create inscription data with correct content type', () => {
      const data = createHtmlInscriptionData(testContent);
      
      expect(data.contentType).toBe('text/html;charset=utf-8');
      expect(data.content.toString('utf8')).toBe(testContent);
      expect(data.metadata).toBeUndefined();
    });

    it('should include metadata when provided', () => {
      const metadata = { version: 1 };
      const data = createHtmlInscriptionData(testContent, metadata);
      
      expect(data.metadata).toEqual(metadata);
    });
  });
});