# Maskani App - Batch Files Guide

## Available Files

### `start-maskani.bat` - Quick Start
- **Purpose**: Fast daily development startup
- **Usage**: Double-click to run or execute from command line
- **Features**:
  - Quick and direct startup
  - Auto-installs dependencies if needed
  - Runs development server on port 8081
  - Shows useful information and links

### `maskani-tools.bat` - Complete Tools Suite
- **Purpose**: Advanced project management and development tools
- **Usage**: Double-click and choose from interactive menu
- **Main Tools**:
  1. Run Web Application (`npm run dev`)
  2. Run Desktop Application (`npm run electron-dev`)
  3. Install/Update Dependencies
  4. Check and Fix Project (TypeScript + ESLint)
  5. Build for Production
  6. Build Desktop Applications
  7. Clean Project (delete node_modules, dist folders)
  8. Advanced Tools (npm fix, security audit, etc.)
  9. System Information

## Quick Usage

**For daily development:**
```
start-maskani.bat
```

**For project management:**
```
maskani-tools.bat
```

## Requirements

- Node.js (version 16 or newer)
- npm (comes with Node.js)
- Internet connection (for first-time dependency installation)

## Troubleshooting

**Problem**: "Node.js is not installed"
**Solution**: Install Node.js from https://nodejs.org

**Problem**: "Failed to install dependencies"
**Solution**: 
1. Check internet connection
2. Use `maskani-tools.bat` → option 8 → "Fix npm Issues"

**Problem**: App not working after updates
**Solution**:
1. Use `maskani-tools.bat` → option 7 → "Clean Project"
2. Then option 3 → "Install Dependencies"