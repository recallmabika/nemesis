from datetime import datetime
from flask import Flask, render_template, request, Response, url_for

app = Flask(__name__)

SITE_URL = "https://nemesis.co.zw"
SITE_NAME = "NEMESIS"
DEFAULT_DESCRIPTION = (
    "NEMESIS builds full-stack software products — marketplaces, real estate "
    "intelligence, network security, and accommodation management — then "
    "automates and hardens them with DevSecOps. Based in Harare, Zimbabwe."
)


@app.context_processor
def inject_globals():
    return {
        "current_year": datetime.utcnow().year,
        "site_url": SITE_URL,
        "site_name": SITE_NAME,
        "default_description": DEFAULT_DESCRIPTION,
        "canonical_url": SITE_URL + request.path,
    }


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/robots.txt")
def robots_txt():
    lines = [
        "User-agent: *",
        "Allow: /",
        "",
        f"Sitemap: {SITE_URL}/sitemap.xml",
    ]
    return Response("\n".join(lines), mimetype="text/plain")


@app.route("/sitemap.xml")
def sitemap_xml():
    # Add a <url> block here for every route as the site grows past one page.
    pages = [
        {"loc": f"{SITE_URL}/", "priority": "1.0", "changefreq": "weekly"},
    ]
    xml_parts = ['<?xml version="1.0" encoding="UTF-8"?>',
                 '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for p in pages:
        xml_parts.append(
            f"<url><loc>{p['loc']}</loc>"
            f"<changefreq>{p['changefreq']}</changefreq>"
            f"<priority>{p['priority']}</priority></url>"
        )
    xml_parts.append("</urlset>")
    return Response("\n".join(xml_parts), mimetype="application/xml")


@app.after_request
def add_headers(response):
    # Basic hardening + caching headers that also feed into page-speed (a ranking factor)
    response.headers["X-Content-Type-Options"] = "nosniff"
    if request.path.startswith("/static/"):
        response.headers["Cache-Control"] = "public, max-age=604800"
    return response


# cPanel/Passenger looks for a variable named `application`
application = app

if __name__ == "__main__":
    # For local testing only. In production use gunicorn (see README).
    app.run(host="0.0.0.0", port=5000, debug=False)
