# Frontend Build Guide

## Quick Start

### Initial Setup

1. **Install Node.js dependencies** (one-time setup):
   ```bash
   cd frontend
   npm install
   ```

### Development Mode

1. **Start the backend** (in one terminal):
   ```bash
   python orchestrator.py
   ```

2. **Start the frontend dev server** (in another terminal):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the app**: Open `http://localhost:3000` in your browser
   - Frontend runs on port 3000 (Vite dev server)
   - Backend API runs on port 8000
   - Vite automatically proxies API calls

### Making Changes

1. Edit files in `frontend/src/`:
   - HTML: `frontend/src/*.html`
   - JavaScript: `frontend/src/js/*.js`
   - CSS: `frontend/src/css/*.css`

2. Changes are **automatically reflected** in the browser (hot reload)

### Building for Production

1. **Build the frontend**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Restart the backend** to serve the new static files:
   ```bash
   python orchestrator.py
   ```

3. The built files are in `static/` directory

## Rebuilding from Scratch

If you want to completely rebuild the frontend:

1. **Delete the current static files** (optional):
   ```bash
   rm -rf static/*.html static/*.js static/*.css
   ```

2. **Install dependencies** (if not already done):
   ```bash
   cd frontend
   npm install
   ```

3. **Build**:
   ```bash
   npm run build
   ```

4. **Verify**: Check that files are in `static/` directory

## Project Structure

```
Devops_Butler/
├── frontend/          # Frontend source (development)
│   ├── src/          # Source files
│   │   ├── js/      # JavaScript modules
│   │   ├── css/     # Stylesheets
│   │   └── *.html   # HTML pages
│   ├── package.json  # Dependencies
│   └── vite.config.js # Build config
└── static/            # Built files (production)
    ├── *.html        # Built HTML
    ├── js/           # Built JavaScript
    └── css/          # Built CSS
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (outputs to `static/`)
- `npm run preview` - Preview production build locally

## Troubleshooting

### Port already in use
If port 3000 is busy, Vite will automatically try the next available port.

### Build errors
1. Make sure all dependencies are installed: `npm install`
2. Check for syntax errors in your source files
3. Verify paths in HTML files match the directory structure

### Changes not reflecting
1. Make sure you're editing files in `frontend/src/`, not `static/`
2. Run `npm run build` after making changes
3. Restart the backend server




