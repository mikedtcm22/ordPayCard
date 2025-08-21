#!/bin/bash
# Inscribe parent templates on Signet network
# Creates parent inscriptions for testing

set -e

# Default values
NETWORK="signet"
TEMPLATE=""
CREATOR=""
MAX_SIZE=5000

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --network)
      NETWORK="$2"
      shift 2
      ;;
    --template)
      TEMPLATE="$2"
      shift 2
      ;;
    --creator)
      CREATOR="$2"
      shift 2
      ;;
    --max-size)
      MAX_SIZE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate template parameter
if [ -z "$TEMPLATE" ]; then
  echo "Error: --template parameter is required"
  exit 1
fi

# Function to inscribe parent template
inscribe_parent() {
  local template_file="$TEMPLATE"
  
  # Check template size if file exists
  if [ -f "$template_file" ]; then
    local file_size=$(stat -f%z "$template_file" 2>/dev/null || stat -c%s "$template_file" 2>/dev/null || echo 0)
    if [ "$file_size" -gt "$MAX_SIZE" ]; then
      echo "Error: Template file exceeds maximum size of $MAX_SIZE bytes"
      exit 1
    fi
  else
    # Create a simple test template if file doesn't exist
    echo "<html><body>Test Parent Template</body></html>" > "$template_file"
  fi
  
  # Simulate inscription (in real implementation, would use ord CLI)
  local inscription_id="test${RANDOM}i0"
  
  # If creator address specified, include it in the metadata
  if [ -n "$CREATOR" ]; then
    echo "Inscribing with creator address: $CREATOR"
  fi
  
  echo "$inscription_id" > last-parent-inscription.txt
  echo "Inscribed parent template: $inscription_id"
}

# Main execution
inscribe_parent