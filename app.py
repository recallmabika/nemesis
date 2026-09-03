import json
import logging
import os
import re
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask import Flask, Response, jsonify, render_template, request, url_for

# Load local environment variables from .env file if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "nemesis-dev-secret-key-default")
app.config["TEMPLATES_AUTO_RELOAD"] = True

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("nemesis")

SITE_URL = os.environ.get("SITE_URL", "https://nemesis.co.zw")
SITE_NAME = "NEMESIS"
DEFAULT_DESCRIPTION = (
    "NEMESIS builds full-stack software products — marketplaces, real estate "
    "intelligence, network security, and accommodation management — then "
    "automates and hardens them with DevSecOps. Based in Harare, Zimbabwe."
)

# SMTP / Email Configuration
SMTP_HOST = os.environ.get("SMTP_HOST", "")
_port_raw = os.environ.get("SMTP_PORT", "465")
_port_match = re.search(r"\d+", str(_port_raw))
SMTP_PORT = int(_port_match.group(0)) if _port_match else 465
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_USE_SSL = os.environ.get("SMTP_USE_SSL", "True").lower() in ("true", "1", "yes")
SMTP_USE_TLS = os.environ.get("SMTP_USE_TLS", "False").lower() in ("true", "1", "yes")
CONTACT_RECIPIENT_EMAIL = os.environ.get("CONTACT_RECIPIENT_EMAIL", "info@nemesis.co.zw,developers@nemesis.co.zw")
CONTACT_SENDER_EMAIL = os.environ.get("CONTACT_SENDER_EMAIL", SMTP_USER or "developers@nemesis.co.zw")
CONTACT_SENDER_NAME = os.environ.get("CONTACT_SENDER_NAME", "NEMESIS Client Inquiries")
INQUIRIES_LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "inquiries.log")

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


def log_inquiry(payload, delivery_status="PENDING", error_msg=None):
    """Safely append the inquiry payload to inquiries.log so no lead is ever lost."""
    try:
        record = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "delivery_status": delivery_status,
            "error": error_msg,
            "data": payload
        }
        with open(INQUIRIES_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(record) + "\n")
    except Exception as e:
        logger.error(f"Failed to write to inquiries.log: {e}")


def dispatch_email(name, email, category, details):
    """Sends inquiry notification email via configured SMTP server."""
    if not SMTP_HOST or not SMTP_PASSWORD:
        logger.warning("SMTP credentials not fully configured in .env. Inquiry logged to inquiries.log.")
        return False, "SMTP credentials not configured"

    subject = f"[NEMESIS Inquiry] {category} — {name}"
    
    # Plain text version
    text_body = (
        f"NEW INQUIRY RECEIVED — NEMESIS WEBSITE\n"
        f"=======================================\n\n"
        f"Date:       {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC\n"
        f"Client:     {name}\n"
        f"Email:      {email}\n"
        f"Category:   {category}\n\n"
        f"PROJECT DETAILS:\n"
        f"----------------\n"
        f"{details}\n\n"
        f"--\n"
        f"Sent from NEMESIS Web Engine (https://nemesis.co.zw)\n"
    )

    # Rich branded HTML version
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0d10; color: #e1e4ea; margin: 0; padding: 24px; }}
        .card {{ max-width: 600px; margin: 0 auto; background: #12151a; border: 1px solid #232730; padding: 32px; border-radius: 0; }}
        .header {{ border-bottom: 2px solid #C9A84C; padding-bottom: 16px; margin-bottom: 24px; }}
        .brand {{ font-size: 20px; font-weight: 700; letter-spacing: 0.12em; color: #ffffff; text-transform: uppercase; }}
        .tag {{ font-size: 11px; letter-spacing: 0.15em; color: #C9A84C; text-transform: uppercase; margin-top: 4px; display: block; }}
        .field {{ margin-bottom: 16px; }}
        .label {{ font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #8a929f; margin-bottom: 4px; }}
        .value {{ font-size: 15px; color: #ffffff; font-weight: 500; }}
        .value a {{ color: #C9A84C; text-decoration: none; }}
        .message-box {{ background: #0b0d10; border: 1px solid #1e222a; padding: 18px; margin-top: 20px; font-family: monospace; font-size: 13.5px; line-height: 1.6; white-space: pre-wrap; color: #f0f2f5; }}
        .footer {{ margin-top: 28px; font-size: 11px; color: #606877; border-top: 1px solid #1e222a; padding-top: 14px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="brand">NEMESIS</div>
          <span class="tag">New Client Inquiry</span>
        </div>
        <div class="field">
          <div class="label">Client / Company</div>
          <div class="value">{name}</div>
        </div>
        <div class="field">
          <div class="label">Email Address</div>
          <div class="value"><a href="mailto:{email}">{email}</a></div>
        </div>
        <div class="field">
          <div class="label">Discipline / Category</div>
          <div class="value">{category}</div>
        </div>
        <div class="field">
          <div class="label">Project Brief / Details</div>
          <div class="message-box">{details}</div>
        </div>
        <div class="footer">
          Received via https://nemesis.co.zw at {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC
        </div>
      </div>
    </body>
    </html>
    """

    # Parse recipient list (supports comma-separated emails)
    recipient_list = [r.strip() for r in CONTACT_RECIPIENT_EMAIL.split(",") if r.strip()]
    if not recipient_list:
        recipient_list = ["info@nemesis.co.zw"]

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{CONTACT_SENDER_NAME} <{CONTACT_SENDER_EMAIL}>"
    msg["To"] = ", ".join(recipient_list)
    msg["Reply-To"] = email

    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    # The SMTP envelope sender must match the authenticated account on strict cPanel servers
    envelope_from = SMTP_USER or CONTACT_SENDER_EMAIL

    try:
        if SMTP_USE_SSL:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=12) as server:
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(envelope_from, recipient_list, msg.as_string())
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=12) as server:
                if SMTP_USE_TLS:
                    server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(envelope_from, recipient_list, msg.as_string())
        logger.info(f"Inquiry email successfully dispatched to {recipient_list}")
        return True, None
    except Exception as e:
        logger.error(f"Failed to send email via SMTP: {e}")
        return False, str(e)


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


@app.route("/our-work")
def our_work():
    return render_template("our_work.html")


@app.route("/maintenance")
def maintenance():
    return render_template("maintenance.html")



@app.route("/api/inquiry", methods=["POST"])
def submit_inquiry():
    """Receives, validates, and dispatches customer inquiries."""
    data = request.get_json(silent=True) or request.form.to_dict() or {}

    # Anti-bot honeypot check
    if data.get("website"):
        logger.info("Bot honeypot triggered; discarding silently.")
        return jsonify({"success": True, "message": "Inquiry received."}), 200

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    category = (data.get("category") or "System Development / Full-Stack").strip()
    details = (data.get("details") or "").strip()

    # Validation
    if not name:
        return jsonify({"success": False, "error": "Please enter your name or company."}), 400

    if not email or not EMAIL_REGEX.match(email):
        return jsonify({"success": False, "error": "Please provide a valid email address."}), 400

    if not details or len(details) < 5:
        return jsonify({"success": False, "error": "Please share a few details about your project or inquiry."}), 400

    payload = {
        "name": name,
        "email": email,
        "category": category,
        "details": details,
        "ip": request.remote_addr,
        "user_agent": request.headers.get("User-Agent")
    }

    # Dispatch email
    sent, error = dispatch_email(name, email, category, details)

    # Always log locally so no data is ever lost
    log_inquiry(payload, delivery_status="SENT" if sent else "LOGGED_LOCAL", error_msg=error)

    if not sent:
        logger.warning(f"Inquiry saved locally but email dispatch failed: {error}")
        return jsonify({
            "success": False,
            "error": "We received your inquiry locally, but the mail delivery service encountered an issue. Please contact us directly at developers@nemesis.co.zw or +263 78 430 7902."
        }), 500

    return jsonify({
        "success": True,
        "message": "Thank you! Your inquiry has been received. Our engineering team will review it and follow up shortly."
    }), 200


@app.route("/robots.txt")
def robots_txt():
    lines = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /api/",
        "",
        f"Sitemap: {SITE_URL}/sitemap.xml",
        f"Host: {SITE_URL.replace('https://', '').replace('http://', '')}",
    ]
    return Response("\n".join(lines), mimetype="text/plain")


@app.route("/sitemap.xml")
def sitemap_xml():
    today = datetime.utcnow().strftime("%Y-%m-%d")
    pages = [
        {"loc": f"{SITE_URL}/", "priority": "1.0", "changefreq": "weekly", "lastmod": today},
        {"loc": f"{SITE_URL}/our-work", "priority": "0.9", "changefreq": "weekly", "lastmod": today},
    ]
    xml_parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ]
    for p in pages:
        xml_parts.append(
            f"<url>"
            f"<loc>{p['loc']}</loc>"
            f"<lastmod>{p['lastmod']}</lastmod>"
            f"<changefreq>{p['changefreq']}</changefreq>"
            f"<priority>{p['priority']}</priority>"
            f"</url>"
        )
    xml_parts.append("</urlset>")
    return Response("\n".join(xml_parts), mimetype="application/xml")


@app.after_request
def add_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    if request.path.startswith("/static/"):
        response.headers["Cache-Control"] = "public, max-age=604800"
    return response


# cPanel/Passenger looks for a variable named `application`
application = app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("FLASK_DEBUG", "False").lower() in ("true", "1", "yes")
    app.run(host="0.0.0.0", port=port, debug=debug)
