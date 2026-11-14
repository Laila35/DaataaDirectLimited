import logging
import os
import smtplib
from email.message import EmailMessage
from pathlib import Path

CONTACT_TO = "humanresources.daataadirect@gmail.com"
log = logging.getLogger("daataa.mail")


def load_env() -> None:
    path = Path(__file__).resolve().parents[1] / ".env"
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        text = line.strip()
        if not text or text.startswith("#") or "=" not in text:
            continue
        key, value = text.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def send_contact_email(name: str, email: str, message: str) -> bool:
    load_env()
    password = os.environ.get("SMTP_PASSWORD", "").strip()
    if not password:
        log.warning("Contact message saved. SMTP_PASSWORD is not set, so it was not emailed.")
        return False
    host = os.environ.get("SMTP_HOST", "smtp.gmail.com").strip() or "smtp.gmail.com"
    port = int(os.environ.get("SMTP_PORT", "587") or "587")
    user = os.environ.get("SMTP_USER", CONTACT_TO).strip() or CONTACT_TO
    mail = EmailMessage()
    mail["Subject"] = f"Website enquiry from {name}"
    mail["From"] = user
    mail["To"] = CONTACT_TO
    mail["Reply-To"] = email
    mail.set_content(
        "\n".join(
            [
                "A new message arrived from the Daataa Direct contact form.",
                "",
                f"Name: {name}",
                f"Email: {email}",
                "",
                message,
            ]
        )
    )
    with smtplib.SMTP(host, port, timeout=20) as smtp:
        smtp.starttls()
        smtp.login(user, password)
        smtp.send_message(mail)
    return True
