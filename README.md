# NEMESIS

> Full-stack software development and DevSecOps, built out of Harare, Zimbabwe.  
> Live site: [nemesis.co.zw](https://nemesis.co.zw)

---

## Overview

NEMESIS is the company marketing site. It is a server-rendered Flask application with a hand-crafted CSS design system — no UI framework, no component library. The site presents the company's services, engineering process, selected work, and a contact section.

Key design constraints:
- Monochrome black/white palette with a single gold accent (`#b8933e`)
- Zero border-radius geometry throughout
- Editorial Swiss-typographic aesthetic — Instrument Serif for headings, Inter for body, JetBrains Mono for metadata labels
- No JavaScript frameworks — vanilla ES modules only
- SEO-ready: canonical URLs, sitemap, robots.txt, structured meta tags

---

## Stack

| Layer | Technology |
|---|---|
| Web framework | [Flask 3.0](https://flask.palletsprojects.com/) |
| Production server | [Gunicorn 22](https://gunicorn.org/) |
| CSS pipeline | [Tailwind CLI 3.4](https://tailwindcss.com/) (utility purge only) + hand-authored `theme.css` |
| Templating | Jinja2 (via Flask) |
| JavaScript | Vanilla ES modules — no bundler |
| Hosting | cPanel shared hosting with Passenger WSGI |
| Python | 3.10+ |

---

## Project Structure

```
nemesis/
├── app.py                   # Flask application — routes, headers, sitemap, robots.txt
├── requirements.txt         # Python dependencies (Flask, Gunicorn)
├── package.json             # Node dev dependencies (Tailwind CLI only)
├── tailwind.config.js       # Tailwind purge config — scans templates + static/js
│
├── templates/
│   ├── base.html            # Base layout — <head>, nav, footer, font imports
│   ├── index.html           # Main page — all sections (hero → contact)
│   └── maintenance.html     # Fallback maintenance page
│
└── static/
    ├── src/
    │   └── input.css        # Tailwind entry point (imports + base directives)
    ├── css/
    │   ├── theme.css        # Primary design system — all custom styles (≈2 100 lines)
    │   ├── hero.css         # Hero-specific animations and 3D canvas styles
    │   ├── base.css         # CSS reset and root tokens (--ink, --paper, --gold…)
    │   └── output.css       # Tailwind purged output (auto-generated, do not edit)
    ├── js/
    │   ├── site.js          # Core interactivity — orbital process diagram, nav, scroll reveals
    │   ├── hero.js          # Hero section — signal SVG animation, slideshow
    │   ├── hero_3d.js       # Three.js-based 3D canvas (hero background)
    │   └── main.js          # Bootstrap entry — theme toggle, scroll events
    └── img/                 # All images and logos
```

---

## Local Development

### Prerequisites

- Python 3.10+
- Node.js 18+ and npm

### 1. Clone and set up Python environment

```bash
git clone <repo-url>
cd nemesis

python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Install Node dependencies

```bash
npm install
```

### 3. Start the CSS watcher

This watches `static/src/input.css` and regenerates `static/css/output.css` on every save:

```bash
npm run watch-css
```

### 4. Run the development server

```bash
py app.py
# or
python app.py
```

The site is served at **http://127.0.0.1:5000**

> **Note**: The dev server runs on port 5000 by default. To use a different port: `py app.py -p 5001`

---

## CSS Pipeline

Styles are split across four files, all linked in `base.html` in this order:

1. **`base.css`** — CSS custom properties (design tokens), resets, and root-level typography rules.
2. **`output.css`** — Tailwind utility classes, purged to only what is referenced in templates and JS files.
3. **`theme.css`** — The primary stylesheet. All section layouts, component styles, animations, hover states, dark/light mode overrides, and media queries live here. **This is the file you edit most.**
4. **`hero.css`** — Hero section only. Isolated to prevent cascade leakage.

### Building CSS for production

```bash
npm run build-css
```

This minifies and purges `output.css`. Run before any production deployment.

---

## Design Tokens

All visual constants are defined as CSS custom properties in `base.css`:

| Token | Role |
|---|---|
| `--ink` | Primary text / foreground |
| `--ink-70` | Secondary text |
| `--ink-45` | Muted / metadata text |
| `--paper` | Page background |
| `--surface` | Elevated surface (cards, panels) |
| `--line` | Hairline separator (subtle) |
| `--line-strong` | Visible separator |
| `--gold` | Brand accent (`#b8933e`) |

Dark mode is toggled via `data-theme="dark"` on the `<html>` element, controlled by `main.js`.

---

## Production Deployment (cPanel / Passenger)

The app is deployed on cPanel shared hosting using Passenger WSGI. Passenger looks for an `application` variable — which is already exported at the bottom of `app.py`:

```python
application = app
```

### Deployment checklist

1. Build minified CSS: `npm run build-css`
2. Upload all files to the server (excluding `venv/`, `node_modules/`, `__pycache__/`)
3. In cPanel, set the **Application Startup File** to `app.py`
4. Set **Application URL** to your domain root
5. Ensure the virtual environment is configured to point to your server's Python 3.10+ path
6. Restart the application via cPanel → Setup Python App

### Running with Gunicorn (alternative)

```bash
gunicorn app:app --bind 0.0.0.0:5000 --workers 2
```

---

## Routes

| Route | Handler | Description |
|---|---|---|
| `/` | `index()` | Main marketing page |
| `/robots.txt` | `robots_txt()` | Crawler directives + sitemap link |
| `/sitemap.xml` | `sitemap_xml()` | XML sitemap for search engines |

Static files at `/static/*` are served with a 7-day `Cache-Control` header automatically via the `add_headers` after-request hook.

---

## Adding a New Page

1. Create `templates/your-page.html` extending `base.html`
2. Add a route in `app.py`
3. Add the URL to the `pages` list in `sitemap_xml()` with appropriate priority and changefreq
4. Add any page-specific styles to `theme.css` under a clearly commented section block

---

## Contributing

- Keep all custom styles in `theme.css`, not inline or in `output.css`
- Do not edit `output.css` — it is auto-generated by the Tailwind CLI
- Follow the zero-radius, monochrome-first design constraint — no color fills outside of `--gold`
- JavaScript: no external libraries, no bundler — vanilla ES modules only
- Test dark mode and light mode before committing any visual changes

---

## License

Proprietary — NEMESIS, Harare, Zimbabwe. All rights reserved.
