"use strict";
/**
 * Deployment helpers with optional ord CLI integration
 * Supports real inscription when ORD_INTEGRATION=1 is set
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
exports.DeployHelpers = void 0;
const child_process_1 = require("child_process");
const crypto = __importStar(require("crypto"));
class DeployHelpers {
    /**
     * Get ord integration configuration from environment
     * @returns Configuration for ord integration
     */
    getOrdConfig() {
        const integration = process.env['ORD_INTEGRATION'];
        const enabled = integration === '1' || integration === 'true';
        const result = {
            enabled,
            mode: enabled ? 'real' : 'mock'
        };
        if (process.env['ORD_WALLET']) {
            result.wallet = process.env['ORD_WALLET'];
        }
        if (process.env['ORD_NETWORK']) {
            result.network = process.env['ORD_NETWORK'];
        }
        return result;
    }
    /**
     * Check if ord CLI is available
     * @returns True if ord CLI can be executed
     */
    isOrdAvailable() {
        const config = this.getOrdConfig();
        // Don't check if integration is disabled
        if (!config.enabled) {
            return false;
        }
        try {
            (0, child_process_1.execSync)('ord --version', { encoding: 'utf8' });
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Validate ord environment variables
     * @returns Validation result with any errors
     */
    validateOrdEnvironment() {
        const config = this.getOrdConfig();
        const errors = [];
        // Skip validation if ord is disabled
        if (!config.enabled) {
            return { valid: true, errors: [] };
        }
        // Check required environment variables
        if (!config.wallet) {
            errors.push('ORD_WALLET not set');
        }
        if (!config.network) {
            errors.push('ORD_NETWORK not set');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Deploy with ord CLI or fallback to mock
     * @param options Deployment options
     * @returns Deployment result
     */
    async deployWithOrd(options) {
        const config = this.getOrdConfig();
        // Handle dry-run mode
        if (options.dryRun) {
            // Check ord availability even in dry-run
            if (config.enabled) {
                this.isOrdAvailable();
            }
            return {
                success: true,
                mode: 'dry-run',
                network: options.network
            };
        }
        // Check if ord integration is enabled and available
        if (config.enabled && this.isOrdAvailable()) {
            return this.deployWithRealOrd(options);
        }
        // Fallback to mock
        return this.deployWithMock(options, config.enabled);
    }
    /**
     * Deploy using real ord CLI
     * @param options Deployment options
     * @returns Deployment result from ord
     */
    async deployWithRealOrd(options) {
        try {
            // Build ord command
            const networkFlag = this.getNetworkFlag(options.network);
            const wallet = options.wallet || process.env['ORD_WALLET'] || 'ord';
            const cmd = `ord wallet inscribe ${networkFlag} --wallet ${wallet} --file ${options.filePath}`;
            // Add mainnet warning
            let warning;
            if (options.network === 'mainnet') {
                warning = 'Mainnet inscription - this will cost real Bitcoin!';
            }
            // Execute ord command
            const output = (0, child_process_1.execSync)(cmd, { encoding: 'utf8' });
            // Parse ord output (assumes JSON format)
            const result = JSON.parse(output);
            const deployResult = {
                success: true,
                inscriptionId: result.inscription,
                txid: result.txid,
                fees: result.fees,
                mode: 'real',
                network: options.network
            };
            if (warning) {
                deployResult.warning = warning;
            }
            return deployResult;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            // Provide actionable hints based on error
            let hint = 'Check ord logs for details';
            if (errorMessage.includes('Insufficient funds')) {
                hint = 'Check wallet balance and fund the wallet';
            }
            else if (errorMessage.includes('not found')) {
                hint = 'Ensure ord is installed and in PATH';
            }
            return {
                success: false,
                mode: 'real',
                network: options.network,
                error: errorMessage,
                hint
            };
        }
    }
    /**
     * Deploy using mock inscription
     * @param options Deployment options
     * @param wasEnabled Whether ord integration was enabled
     * @returns Mock deployment result
     */
    async deployWithMock(options, wasEnabled) {
        // Generate mock inscription ID
        const randomBytes = crypto.randomBytes(32);
        const txid = randomBytes.toString('hex');
        const inscriptionId = `${txid}i0`;
        // Add warning if ord was requested but unavailable
        let warning;
        if (wasEnabled) {
            warning = 'ord CLI not available, using mock inscription';
        }
        // Simulate inscription (skip file check for testing)
        // In real deployment, would check if file exists
        const deployResult = {
            success: true,
            inscriptionId,
            txid,
            fees: 1000, // Mock fee
            mode: 'mock',
            network: options.network
        };
        if (warning) {
            deployResult.warning = warning;
        }
        return deployResult;
    }
    /**
     * Get network flag for ord command
     * @param network Bitcoin network
     * @returns Network flag for ord CLI
     */
    getNetworkFlag(network) {
        switch (network) {
            case 'signet':
                return '--signet';
            case 'testnet':
                return '--testnet';
            case 'regtest':
                return '--regtest';
            case 'mainnet':
                return ''; // No flag for mainnet
            default:
                return '--signet'; // Default to signet
        }
    }
}
exports.DeployHelpers = DeployHelpers;
