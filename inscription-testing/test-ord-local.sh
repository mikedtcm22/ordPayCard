#!/bin/bash

# Test script for local ord server
# This script helps test the recursive inscription functionality

echo "=== Recursive Inscription Test Script ==="
echo ""

# Function to check if ord is installed
check_ord() {
    if ! command -v ord &> /dev/null; then
        echo "❌ ord is not installed. Please install ord first."
        echo "Visit: https://github.com/ordinals/ord"
        exit 1
    fi
    
    echo "✅ ord is installed: $(ord --version)"
}

# Function to start local ord server
start_ord_server() {
    echo ""
    echo "Starting local ord server..."
    echo "Run this command in a separate terminal:"
    echo ""
    echo "ord --regtest server --http-port 8080 --enable-index-runes --enable-json-api"
    echo ""
    echo "For Signet testing, use:"
    echo "ord --signet server --http-port 8080 --enable-index-runes --enable-json-api"
    echo ""
}

# Function to create test parent inscription
create_parent_inscription() {
    echo ""
    echo "To create a parent inscription:"
    echo ""
    echo "1. First, ensure you have a funded wallet:"
    echo "   ord --regtest wallet create"
    echo "   ord --regtest wallet receive"
    echo ""
    echo "2. Fund the wallet (for regtest):"
    echo "   # Generate blocks to the received address"
    echo ""
    echo "3. Create the parent inscription:"
    echo "   ord --regtest wallet inscribe --fee-rate 1 --file client/src/templates/inscription/membershipCard-recursive.html"
    echo ""
    echo "4. Note the inscription ID (format: <txid>i<index>)"
    echo ""
}

# Function to create test receipt inscriptions
create_receipt_inscriptions() {
    echo ""
    echo "To create child receipt inscriptions:"
    echo ""
    echo "1. Create receipt JSON files:"
    
    cat > receipt1.json << 'EOF'
{
  "schema": "satspray.topup.v1",
  "parent": "PARENT_INSCRIPTION_ID",
  "amount": 100000,
  "block": 100,
  "paid_to": "bcrt1qtest...",
  "txid": "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
EOF

    cat > receipt2.json << 'EOF'
{
  "schema": "satspray.topup.v1",
  "parent": "PARENT_INSCRIPTION_ID",
  "amount": 50000,
  "block": 150,
  "paid_to": "bcrt1qtest...",
  "txid": "fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321"
}
EOF

    echo "   Created receipt1.json and receipt2.json"
    echo ""
    echo "2. Update the parent ID and treasury address in the JSON files"
    echo ""
    echo "3. Inscribe as children:"
    echo "   ord --regtest wallet inscribe --fee-rate 1 --parent PARENT_ID --file receipt1.json"
    echo "   ord --regtest wallet inscribe --fee-rate 1 --parent PARENT_ID --file receipt2.json"
    echo ""
}

# Function to test recursive endpoints
test_recursive_endpoints() {
    echo ""
    echo "Testing recursive endpoints..."
    echo ""
    
    # Test blockheight endpoint
    echo "1. Testing /r/blockheight:"
    curl -s http://localhost:8080/r/blockheight
    echo ""
    echo ""
    
    # Test with a known inscription
    echo "2. To test children endpoint, use:"
    echo "   curl http://localhost:8080/r/children/INSCRIPTION_ID/inscriptions/0"
    echo ""
    
    echo "3. To test content endpoint, use:"
    echo "   curl http://localhost:8080/r/content/INSCRIPTION_ID"
    echo ""
}

# Function to view inscription in browser
view_inscription() {
    echo ""
    echo "To view your inscription in the browser:"
    echo ""
    echo "1. Open: http://localhost:8080/inscription/YOUR_INSCRIPTION_ID"
    echo ""
    echo "2. Open browser console to see debug logs"
    echo ""
    echo "3. Call window.cardStatus() in console to test the API"
    echo ""
}

# Main menu
main() {
    check_ord
    
    echo ""
    echo "What would you like to do?"
    echo ""
    echo "1. View ord server start command"
    echo "2. View parent inscription creation steps"
    echo "3. Create test receipt JSON files"
    echo "4. Test recursive endpoints"
    echo "5. View inscription in browser instructions"
    echo "6. Run all steps (guide)"
    echo ""
    
    read -p "Enter your choice (1-6): " choice
    
    case $choice in
        1) start_ord_server ;;
        2) create_parent_inscription ;;
        3) create_receipt_inscriptions ;;
        4) test_recursive_endpoints ;;
        5) view_inscription ;;
        6)
            start_ord_server
            create_parent_inscription
            create_receipt_inscriptions
            test_recursive_endpoints
            view_inscription
            ;;
        *) echo "Invalid choice" ;;
    esac
}

# Run main function
main