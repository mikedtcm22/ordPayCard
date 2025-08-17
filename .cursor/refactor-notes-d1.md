# EmbersCore Development - Refactoring Notes

## D1: Public API Surface - Refactoring Plan

### API Documentation Generation
- Consider using TypeDoc to auto-generate API documentation from TSDoc comments
- The function signatures already have JSDoc comments that could be enhanced with `@example` blocks
- Could add a `docs:api` npm script to generate HTML documentation

### Public API Test Locking
- The test currently validates the exact public exports to prevent accidental API surface expansion
- Consider adding snapshot tests for function signatures to detect breaking changes
- Could implement a contract test that validates against a JSON schema of the API

### Type Safety Improvements
- The `network` parameter could use a branded type or enum for better type safety
- Consider exporting option types as named interfaces for better documentation

### Version Management
- SEMVER could be read from package.json to maintain single source of truth
- Consider adding a changelog generator based on conventional commits

### Server Parity Validation
- Need to ensure the client implementation matches server implementation exactly
- Consider shared test fixtures between client and server tests

## D2: Build Configuration - Refactoring Plan

### Budget Reporting
- Add a `postbuild:embers-core` script that reports detailed size metrics
- Consider using `rollup-plugin-size-snapshot` for tracking size changes over time
- Create a size budget manifest file (e.g., `embers-core.size-budget.json`) with thresholds

### CI Integration
- Add GitHub Actions workflow to run build size tests on every PR
- Use `bundlesize` or `size-limit` tools for automated size checks
- Fail CI if bundle exceeds 8KB gzipped threshold
- Generate size comparison comments on PRs showing delta

### Build Optimizations
- Consider using `esbuild` instead of terser for faster builds
- Explore tree-shaking opportunities when actual parser logic is added
- Add production vs development builds with different optimization levels

### Bundle Analysis
- Add `npm run analyze:embers-core` script using `rollup-plugin-visualizer`
- Generate bundle composition reports to identify size hotspots
- Track which functions contribute most to bundle size

### Version Management (Build-specific)
- Build script could auto-inject version from package.json
- Add build timestamp and git hash for debugging production issues
- Consider separate versioning for the library independent of main app

### Testing Improvements
- Add integration test that loads the bundle in a browser-like environment
- Validate that the IIFE format works correctly when loaded via script tag
- Test that the bundle works in inscription environment (no network access)

## D3: Loader Snippet - Refactoring Plan

### Checksum Verification (Phase 3+)
- Add SHA-256 hash verification of the loaded script content
- Store expected hash in parent inscription or as a loader parameter
- Reject scripts that don't match the expected hash
- Consider using SubtleCrypto API for browser-native hashing

### Caching Strategy
- Implement localStorage caching of loaded scripts with version/height key
- Check cache before fetching from network
- Add cache invalidation based on block height or timestamp
- Consider IndexedDB for larger script storage

### Loading Performance
- Add support for preloading/prefetching the script
- Implement progressive loading with initial minimal API
- Consider using Web Workers for script parsing in background

### Error Recovery
- Implement retry logic with exponential backoff
- Provide fallback to a known good version if latest fails
- Add telemetry/monitoring hooks for production debugging

### Security Enhancements
- Implement Content Security Policy (CSP) compatible loading
- Add script isolation using sandboxed iframes if needed
- Validate inscription IDs format before fetching

### Developer Experience
- Add TypeScript type definitions for the loader
- Create a minified standalone version for embedding
- Provide debug mode with verbose logging
- Add performance timing metrics

### Network Optimization
- Support batch fetching of children metadata
- Implement parallel fetching of content if multiple versions needed
- Add support for compressed content (gzip)

### Version Management
- Support loading specific versions by height or ID
- Add version compatibility checks
- Implement graceful degradation for older browsers

## Progress Summary
- D1 ✅: Established public API surface with verifyPayment, dedupe, and SEMVER exports
- D2 ✅: Created build configuration producing 0.33KB gzipped bundle (well under 8KB limit)
- D3 ✅: Implemented loader snippet that fetches and loads latest child inscription

## Next Steps
- Track E: Tooling & examples (E1: bitcoin-cli OP_RETURN examples, E2: wallet troubleshooting guide)
- Port server parser logic to client for actual functionality
- Consider implementing the refactoring improvements during future iterations