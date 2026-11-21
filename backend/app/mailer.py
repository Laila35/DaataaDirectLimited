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


def app_base_url() -> str:
    load_env()
    return os.environ.get("APP_URL", "http://localhost:4200").rstrip("/")


def smtp_ready() -> bool:
    load_env()
    return bool(os.environ.get("SMTP_PASSWORD", "").strip())


def _send(mail: EmailMessage) -> bool:
    load_env()
    password = os.environ.get("SMTP_PASSWORD", "").strip()
    if not password:
        log.warning("Email not sent. SMTP_PASSWORD is not set.")
        return False
    host = os.environ.get("SMTP_HOST", "smtp.gmail.com").strip() or "smtp.gmail.com"
    port = int(os.environ.get("SMTP_PORT", "587") or "587")
    user = os.environ.get("SMTP_USER", CONTACT_TO).strip() or CONTACT_TO
    mail["From"] = user
    with smtplib.SMTP(host, port, timeout=20) as smtp:
        smtp.starttls()
        smtp.login(user, password)
        smtp.send_message(mail)
    return True


def send_contact_email(name: str, email: str, message: str) -> bool:
    mail = EmailMessage()
    mail["Subject"] = f"Website enquiry from {name}"
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
    return _send(mail)


def send_reset_email(to: str, name: str, link: str) -> bool:
    mail = EmailMessage()
    mail["Subject"] = "Reset your Daataa Direct password"
    mail["To"] = to
    greeting = name.strip() or "there"
    mail.set_content(
        "\n".join(
            [
                f"Hello {greeting},",
                "",
                "We received a request to reset the password for your Daataa Direct account.",
                "This works for both the employee sign-in and the admin sign-in.",
                "",
                "Choose a new password here. The link expires in one hour:",
                link,
                "",
                "If you did not ask for this, you can ignore this email. Your password will stay the same.",
            ]
        )
    )
    return _send(mail)
