/**
 * Template loader for Embers Core integration
 * Loads Embers Core from network-specific inscription IDs
 */

export type Network = 'regtest' | 'signet' | 'testnet' | 'mainnet';

/**
 * Get the Embers Core inscription ID for the current network
 */
export function getEmbersInscriptionId(): string | null {
  const network = (process.env.VITE_BITCOIN_NETWORK || 'regtest') as Network;
  const envKey = `VITE_EMBERS_CORE_${network.toUpperCase()}_ID`;
  return process.env[envKey] || null;
}

/**
 * Get the ord URL for a specific network
 */
function getOrdUrl(network: Network): string {
  switch (network) {
    case 'regtest':
    case 'signet':
      return 'http://localhost:8080';
    case 'testnet':
      return 'https://testnet.ordinals.com';
    case 'mainnet':
      return 'https://ordinals.com';
    default:
      return 'http://localhost:8080';
  }
}

/**
 * Validate inscription ID format
 */
function isValidInscriptionId(id: string): boolean {
  return /^[a-f0-9]{64}i\d+$/.test(id) || 
         /^[a-zA-Z0-9]+\d+i\d+$/.test(id); // Allow mock IDs for testing
}

// Cache for loaded templates
const templateCache = new Map<string, string>();

/**
 * Render the template with Embers Core integration
 */
export async function renderTemplate(): Promise<string> {
  const network = (process.env.VITE_BITCOIN_NETWORK || 'regtest') as Network;
  const inscriptionId = getEmbersInscriptionId();
  
  // Check cache
  const cacheKey = `${network}:${inscriptionId}`;
  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey)!;
  }
  
  let embersScript = '';
  
  if (inscriptionId && isValidInscriptionId(inscriptionId)) {
    const ordUrl = getOrdUrl(network);
    const contentUrl = `${ordUrl}/content/${inscriptionId}`;
    
    // Add integrity check if hash is provided
    const hashKey = `VITE_EMBERS_CORE_${network.toUpperCase()}_HASH`;
    const integrity = process.env[hashKey];
    const integrityAttr = integrity ? `integrity="${integrity}"` : '';
    
    // Add version check if minimum version is specified
    const minVersion = process.env.VITE_EMBERS_MIN_VERSION;
    const versionCheck = minVersion ? `
      <script>
        window.EMBERS_MIN_VERSION = '${minVersion}';
      </script>
    ` : '';
    
    embersScript = `
      ${versionCheck}
      <script src="${contentUrl}" ${integrityAttr}></script>
      <script>
        // Fallback handling
        if (typeof EmbersCore === "undefined") {
          console.warn('EmbersCore failed to load from inscription');
          window.EmbersCore = {
            verifyPayment: function() { return 0n; },
            dedupe: function(arr) { return arr; },
            SEMVER: '0.0.0'
          };
        }
      </script>
    `;
  } else {
    // No inscription available
    embersScript = `
      <!-- Embers Core not available -->
      <script>
        // Fallback EmbersCore implementation
        if (typeof EmbersCore === "undefined") {
          window.EmbersCore = {
            verifyPayment: function() { return 0n; },
            dedupe: function(arr) { return arr; },
            SEMVER: '0.0.0'
          };
        }
      </script>
    `;
  }
  
  // Build the template
  const template = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Registration Template</title>
  ${embersScript}
</head>
<body>
  <div id="registration-status">
    <h1>Registration Status</h1>
    <div id="status-container">
      <!-- Registration status will be displayed here -->
    </div>
  </div>
  
  <script>
    // Template logic that uses EmbersCore
    (function() {
      if (window.EmbersCore && window.EmbersCore.SEMVER !== '0.0.0') {
        console.log('EmbersCore loaded successfully:', window.EmbersCore.SEMVER);
      } else {
        console.warn('Using fallback EmbersCore implementation');
      }
    })();
  </script>
</body>
</html>
  `.trim();
  
  // Cache the result
  templateCache.set(cacheKey, template);
  
  return template;
}