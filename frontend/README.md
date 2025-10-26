# DevOps Butler Frontend

This is the frontend build setup for DevOps Butler using Vite.

## Directory Structure

```
frontend/
├── src/           # Source files (HTML, JS, CSS)
│   ├── js/       # JavaScript files
│   ├── css/      # CSS files
│   └── *.html    # HTML pages
├── package.json  # Node dependencies
├── vite.config.js # Vite configuration
└── README.md     # This file
```

## Development

### Install Dependencies

```bash
cd frontend
npm install
```

### Development Server

Start the Vite dev server (with hot reload):

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000` with automatic proxying to the backend API at `http://localhost:8000`.

### Make Changes

1. Edit files in `frontend/src/`
2. Changes will be automatically reflected in the browser (hot reload)
3. The backend at `http://localhost:8000` will serve the API endpoints

## Building for Production

Build the frontend to the `static/` directory:

```bash
npm run build
```

This will:
- Bundle and optimize all assets
- Output to `../static/` directory (which the FastAPI backend serves)
- Minify CSS and JavaScript
- Generate optimized HTML files

After building, restart your FastAPI backend to serve the new static files.

## File Organization

- **HTML files**: Located in `src/` directory
- **JavaScript**: Organized in `src/js/` directory
- **CSS**: Organized in `src/css/` directory

## Making Changes to the Frontend

1. **Modify HTML**: Edit files in `frontend/src/*.html`
2. **Modify JavaScript**: Edit files in `frontend/src/js/*.js`
3. **Modify CSS**: Edit files in `frontend/src/css/*.css`
4. **Build**: Run `npm run build` to compile to the `static/` directory
5. **Test**: The backend will serve the built files from `static/`

## Development Workflow

1. Start the backend: `python orchestrator.py` (runs on port 8000)
2. Start the frontend dev server: `npm run dev` (runs on port 3000)
3. Develop in `frontend/src/` - changes hot-reload automatically
4. When ready for production: `npm run build`
5. The backend serves the built files from `static/`

## Notes

- During development, Vite handles hot module replacement
- For production, files are built to `static/` which the FastAPI backend serves
- API calls are proxied during development to avoid CORS issues
- The build process optimizes and minifies assets for production




