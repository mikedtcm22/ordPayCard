# Inscription Template Automated Testing

This directory contains automated testing tools for the SatSpray membership card inscription template.

## Setup

### 1. Get Hiro API Key
1. Visit https://docs.hiro.so/ordinals
2. Sign up for a free account
3. Generate an API key for ordinals inscriptions
4. Copy the API key

### 2. Set Environment Variable
```bash
export HIRO_API_KEY="your_actual_api_key_here"
```

### 3. Test API Connection
```bash
./test_api_connection.sh
```

## Directory Structure

```
inscription-testing/
├── templates/           # Template files
│   └── membershipCard_base.html  # Base template
├── tests/              # Test files
├── results/            # Test results and reports
├── logs/               # Log files
├── automated_test.sh   # Main testing script
├── test_api_connection.sh  # API connection test
└── README.md           # This file
```

## Usage

### Quick Test
```bash
# Test API connection only
./test_api_connection.sh

# Run full automated test suite
./automated_test.sh
```

### Manual Testing
```bash
# Create a single test template
./automated_test.sh test_single "850000" '[{"schema":"satspray.topup.v1","amount":100000,"block":850000,"paid_to":"tb1q..."}]' "tb1q..." "100000"
```

## Test Cases

The automated test suite includes:

1. **Fresh Top-up**: 100,000 sats, no decay (block 850000)
2. **Partial Decay**: 100,000 sats, 100 blocks decay (block 850100)
3. **Multiple Receipts**: Multiple top-ups with different timings
4. **Expired Card**: Fully decayed card (0 balance)

## Expected Results

Each test will:
1. Create a test template with specific data
2. Upload it via Hiro API
3. Wait for inscription confirmation
4. Validate the inscribed content matches original
5. Test balance calculation logic
6. Generate a test report

## Output Files

- `results/successful_inscriptions.txt` - List of successful inscription IDs
- `results/failed_inscriptions.txt` - List of failed inscription IDs
- `results/test_report_YYYYMMDD_HHMMSS.md` - Detailed test report
- `templates/*.html` - Generated test templates
- `tests/*.html` - Balance calculation test files

## Troubleshooting

### API Key Issues
- Ensure `HIRO_API_KEY` is set correctly
- Verify the API key has ordinals inscription permissions
- Check Hiro account status

### Network Issues
- Tests run on Signet network (testnet)
- Ensure stable internet connection
- API has rate limits - tests include delays

### Template Issues
- Templates are self-contained (no external dependencies)
- SVG assets are embedded inline
- JavaScript is ES5 compatible

## Configuration

Edit `automated_test.sh` to modify:
- `FEE_RATE`: Inscription fee rate (default: 1 sats/vB)
- `NETWORK`: Target network (default: signet)
- `HIRO_API_URL`: API endpoint (default: https://api.hiro.so/ordinals/v1)

## Next Steps

After successful testing:
1. Review test reports in `results/` directory
2. Validate inscription content integrity
3. Test balance calculation accuracy
4. Proceed to mainnet deployment when ready 