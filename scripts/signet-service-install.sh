#!/bin/bash

# Install Signet node as a system service
# Supports both macOS (launchd) and Linux (systemd)

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔧 Signet Service Installation"
echo "=============================="
echo ""

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    echo "Detected: macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    echo "Detected: Linux"
else
    echo "❌ Unsupported OS: $OSTYPE"
    exit 1
fi

# Function to install on macOS
install_macos() {
    echo ""
    echo "Installing launchd services for macOS..."
    
    LAUNCHAGENT_DIR="$HOME/Library/LaunchAgents"
    mkdir -p "$LAUNCHAGENT_DIR"
    
    # Update plist files with current user path
    BITCOIN_PLIST="$PROJECT_ROOT/configs/launchd/com.bitcoin.signet.plist"
    ORD_PLIST="$PROJECT_ROOT/configs/launchd/com.ord.signet.plist"
    
    # Copy and update Bitcoin Core plist
    echo "📝 Installing Bitcoin Core service..."
    sed "s|/Users/michaelchristopher|$HOME|g" "$BITCOIN_PLIST" > "$LAUNCHAGENT_DIR/com.bitcoin.signet.plist"
    
    # Copy and update ord plist
    echo "📝 Installing ord service..."
    sed "s|/Users/michaelchristopher|$HOME|g" "$ORD_PLIST" > "$LAUNCHAGENT_DIR/com.ord.signet.plist"
    
    echo ""
    echo "✅ Services installed!"
    echo ""
    echo "To start services:"
    echo "  launchctl load ~/Library/LaunchAgents/com.bitcoin.signet.plist"
    echo "  launchctl load ~/Library/LaunchAgents/com.ord.signet.plist"
    echo ""
    echo "To stop services:"
    echo "  launchctl unload ~/Library/LaunchAgents/com.bitcoin.signet.plist"
    echo "  launchctl unload ~/Library/LaunchAgents/com.ord.signet.plist"
    echo ""
    echo "To check status:"
    echo "  launchctl list | grep -E 'bitcoin|ord'"
    echo ""
    echo "Services will start automatically on login."
}

# Function to install on Linux
install_linux() {
    echo ""
    echo "Installing systemd services for Linux..."
    
    # Check if systemd is available
    if ! command -v systemctl &> /dev/null; then
        echo "❌ systemd not found. Manual installation required."
        exit 1
    fi
    
    # Determine if we should use system or user services
    echo ""
    echo "Install as:"
    echo "  1) User service (recommended)"
    echo "  2) System service (requires sudo)"
    read -p "Choice (1-2): " choice
    
    case $choice in
        1)
            SERVICE_DIR="$HOME/.config/systemd/user"
            mkdir -p "$SERVICE_DIR"
            
            echo "📝 Installing user services..."
            cp "$PROJECT_ROOT/configs/systemd/bitcoind-signet.service" "$SERVICE_DIR/"
            cp "$PROJECT_ROOT/configs/systemd/ord-signet.service" "$SERVICE_DIR/"
            
            # Reload user systemd
            systemctl --user daemon-reload
            
            echo ""
            echo "✅ User services installed!"
            echo ""
            echo "To start services:"
            echo "  systemctl --user start bitcoind-signet"
            echo "  systemctl --user start ord-signet"
            echo ""
            echo "To enable auto-start:"
            echo "  systemctl --user enable bitcoind-signet"
            echo "  systemctl --user enable ord-signet"
            echo ""
            echo "To check status:"
            echo "  systemctl --user status bitcoind-signet"
            echo "  systemctl --user status ord-signet"
            ;;
            
        2)
            echo "📝 Installing system services..."
            echo "This requires sudo access..."
            
            sudo cp "$PROJECT_ROOT/configs/systemd/bitcoind-signet.service" /etc/systemd/system/
            sudo cp "$PROJECT_ROOT/configs/systemd/ord-signet.service" /etc/systemd/system/
            
            # Update service files with current user
            sudo sed -i "s/%u/$USER/g" /etc/systemd/system/bitcoind-signet.service
            sudo sed -i "s/%u/$USER/g" /etc/systemd/system/ord-signet.service
            
            # Reload systemd
            sudo systemctl daemon-reload
            
            echo ""
            echo "✅ System services installed!"
            echo ""
            echo "To start services:"
            echo "  sudo systemctl start bitcoind-signet"
            echo "  sudo systemctl start ord-signet"
            echo ""
            echo "To enable auto-start:"
            echo "  sudo systemctl enable bitcoind-signet"
            echo "  sudo systemctl enable ord-signet"
            echo ""
            echo "To check status:"
            echo "  sudo systemctl status bitcoind-signet"
            echo "  sudo systemctl status ord-signet"
            ;;
            
        *)
            echo "Invalid choice"
            exit 1
            ;;
    esac
}

# Main installation flow
case $OS in
    macos)
        install_macos
        ;;
    linux)
        install_linux
        ;;
esac

echo ""
echo "📚 Additional Commands:"
echo "----------------------"
echo "View logs:"
if [[ "$OS" == "macos" ]]; then
    echo "  tail -f ~/.bitcoin/signet/debug.log"
    echo "  tail -f ~/.local/share/ord/signet/stdout.log"
else
    echo "  journalctl --user -u bitcoind-signet -f"
    echo "  journalctl --user -u ord-signet -f"
fi
echo ""
echo "Monitor health:"
echo "  ./scripts/signet-node-health.sh"
echo ""
echo "Check status:"
echo "  ./scripts/signet-node-status.sh"