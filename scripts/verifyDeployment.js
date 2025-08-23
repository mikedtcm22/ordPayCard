#!/usr/bin/env node
"use strict";
/**
 * Deployment verification script
 * Fetches and validates inscription content post-deploy with checksum
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationError = void 0;
exports.verifyDeployment = verifyDeployment;
const crypto = __importStar(require("crypto"));
class VerificationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'VerificationError';
    }
}
exports.VerificationError = VerificationError;
/**
 * Get inscription URL based on network
 * @param inscriptionId Inscription ID
 * @param network Bitcoin network
 * @returns Full URL to fetch inscription content
 */
function getInscriptionUrl(inscriptionId, network) {
    const baseUrls = {
        mainnet: 'https://ordinals.com',
        testnet: 'https://testnet.ordinals.com',
        signet: 'https://signet.ordinals.com',
        regtest: 'http://localhost:8080'
    };
    const baseUrl = baseUrls[network] || baseUrls['mainnet'];
    return `${baseUrl}/content/${inscriptionId}`;
}
/**
 * Extract txid from inscription ID
 * @param inscriptionId Inscription ID (format: txidi0)
 * @returns Transaction ID
 */
function extractTxid(inscriptionId) {
    // Remove the 'i0' suffix if present
    const match = inscriptionId.match(/^([a-f0-9]{64})i\d+$/);
    if (match && match[1]) {
        return match[1];
    }
    // If no suffix, assume it's already a txid
    if (/^[a-f0-9]{64}$/.test(inscriptionId)) {
        return inscriptionId;
    }
    // Generate a placeholder txid for invalid formats
    return '0'.repeat(64);
}
/**
 * Validate inscription ID format
 * @param inscriptionId Inscription ID to validate
 * @returns True if valid
 */
function isValidInscriptionId(inscriptionId) {
    // Must be either a txid (64 hex chars) or txid + i + number
    return /^[a-f0-9]{64}(i\d+)?$/.test(inscriptionId);
}
/**
 * Fetch content with retries
 * @param url URL to fetch
 * @param maxRetries Maximum retry attempts
 * @param retryDelay Initial retry delay in ms
 * @param attempt Current attempt number
 * @returns Content as string
 */
async function fetchWithRetry(url, maxRetries, retryDelay, attempt = 0) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.text();
    }
    catch (error) {
        if (attempt < maxRetries - 1) {
            const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
            console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(url, maxRetries, retryDelay, attempt + 1);
        }
        throw new Error(`Failed to fetch inscription after ${maxRetries - 1} retries`);
    }
}
/**
 * Verify deployment by fetching and validating inscription content
 * @param options Verification options
 * @returns Verification result
 */
async function verifyDeployment(options = {}) {
    // Parse command line arguments if provided
    if (options.argv) {
        const args = options.argv.slice(2);
        for (let i = 0; i < args.length; i++) {
            if (args[i] === '--inscription' && args[i + 1]) {
                options.inscriptionId = args[i + 1];
                i++;
            }
            else if (args[i] === '--network' && args[i + 1]) {
                options.network = args[i + 1];
                i++;
            }
            else if (args[i] === '--json') {
                options.json = true;
            }
            else if (args[i] === '--checksum' && args[i + 1]) {
                options.expectedChecksum = args[i + 1];
                i++;
            }
        }
    }
    // Get inscription ID from options or environment
    const network = options.network || process.env['BITCOIN_NETWORK'] || 'mainnet';
    const envKey = `EMBERS_INSCRIPTION_ID_${network.toUpperCase()}`;
    const inscriptionId = options.inscriptionId || process.env[envKey];
    if (!inscriptionId) {
        throw new VerificationError(`Missing inscription ID. Provide via --inscription flag or ${envKey} environment variable`);
    }
    if (!isValidInscriptionId(inscriptionId)) {
        throw new VerificationError('Invalid inscription ID format');
    }
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 1000;
    const url = getInscriptionUrl(inscriptionId, network);
    try {
        // Fetch inscription content with retries
        const content = await fetchWithRetry(url, maxRetries, retryDelay);
        // Compute checksum
        const checksum = crypto
            .createHash('sha256')
            .update(content)
            .digest('hex');
        // Verify checksum if expected value provided
        if (options.expectedChecksum && checksum !== options.expectedChecksum) {
            console.error(`Checksum mismatch!`);
            console.error(`Expected: ${options.expectedChecksum}`);
            console.error(`Actual: ${checksum}`);
            if (options.isCLI) {
                process.exit(1);
            }
            throw new VerificationError('checksum mismatch');
        }
        const result = {
            success: true,
            inscriptionId,
            txid: extractTxid(inscriptionId),
            byteLength: Buffer.byteLength(content),
            checksum,
            network
        };
        // Output results
        if (options.json) {
            process.stdout.write(JSON.stringify(result, null, 2));
        }
        else {
            console.log('Verification successful');
            console.log(`Inscription ID: ${inscriptionId}`);
            console.log(`Transaction ID: ${result.txid}`);
            console.log(`Network: ${network}`);
            console.log(`Size: ${result.byteLength} bytes`);
            console.log(`Checksum: ${checksum}`);
        }
        return result;
    }
    catch (error) {
        if (options.isCLI) {
            console.error(`Verification failed: ${error}`);
            process.exit(1);
        }
        throw error;
    }
}
// CLI execution
if (require.main === module) {
    verifyDeployment({
        argv: process.argv,
        isCLI: true
    }).catch(error => {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    });
}
