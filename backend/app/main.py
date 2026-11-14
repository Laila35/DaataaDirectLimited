import json
import logging
import os
import re
from datetime import datetime
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from .ats import score_application
from .mailer import send_contact_email
from .database import Base, SessionLocal, engine, get_db
from .models import Application, ContactMessage, Employee, Faq, Job, Review, Setting, User, WhatsAppMessage
from .security import create_session, get_current_user, hash_password, optional_user, require_admin, verify_password
from .seed import seed
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app = FastAPI(title="Daataa Direct API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
class LoginBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
class RegisterBody(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    employee_code: str = ""
    department: str = "Other"
    password: str = Field(min_length=8)
WHATSAPP_NUMBER = "923198090911"
class WhatsAppBody(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    visitor: str
    name: str = ""
    email: str = ""
    page: str = ""
    phone: str = ""
class WhatsAppEditBody(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    visitor: str
class ContactBody(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    email: EmailStr
    message: str = Field(min_length=8)
class JobBody(BaseModel):
    title: str
    department: str
    employment_type: str = "Full-time"
    level: str = "Mid level"
    workplace: str = "Hybrid"
    summary: str
    responsibilities: list[str] = []
    requirements: list[str] = []
    opens_at: str = ""
    closes_at: str = ""
    active: bool = True
class AboutStepBody(BaseModel):
    title: str
    text: str
class AboutBody(BaseModel):
    kicker: str
    title: str
    intro: str
    detail: str
    work_title: str
    steps: list[AboutStepBody]
class StatusBody(BaseModel):
    status: str
class EmployeeBody(BaseModel):
    name: str
    email: EmailStr
    department: str
    role_title: str
    status: str = "Active"
class SettingsBody(BaseModel):
    company_name: str
    accent: str
    contact_email: str
    careers_open: bool
class FaqBody(BaseModel):
    question: str = Field(min_length=1, max_length=300)
    answer: str = Field(min_length=1, max_length=2000)
class ReviewBody(BaseModel):
    quote: str = Field(min_length=1, max_length=1000)
    role: str = Field(min_length=1, max_length=120)
    place: str = Field(default="", max_length=120)
    stars: int = Field(default=5, ge=1, le=5)
def job_out(job: Job) -> dict:
    return {
        "id": job.id,
        "title": job.title,
        "department": job.department,
        "employment_type": job.employment_type,
        "level": job.level,
        "summary": job.summary,
        "responsibilities": json.loads(job.responsibilities or "[]"),
        "requirements": json.loads(job.requirements or "[]"),
        "active": bool(job.active),
        "workplace": job.workplace or "Hybrid",
        "opens_at": job.opens_at or "",
        "closes_at": job.closes_at or "",
        "closed": job_closed(job),
    }
ABOUT_DEFAULTS = {
    "about_kicker": "Daataa Direct Limited",
    "about_title": "About us",
    "about_intro": "Daataa Direct Limited is a data and direct marketing company based in Rawalpindi. We help businesses understand their customers and reach them with clear, measurable campaigns. The work is delivered remotely.",
    "about_detail": "Our hours are 11am to 8pm, Pakistan time. We reply within one working day.",
    "about_work_title": "How we work",
    "about_steps": json.dumps([
        {"title": "Listen", "text": "We learn your goals, your audience and the data you already hold."},
        {"title": "Build", "text": "We design the campaign or platform and test it on a small group first."},
        {"title": "Launch", "text": "We go live with tracking in place so every result is visible."},
        {"title": "Improve", "text": "We review the numbers with you and refine what works."},
    ]),
}
def about_out(db: Session) -> dict:
    rows = {row.key: row.value for row in db.query(Setting).all()}
    raw_steps = rows.get("about_steps") or ABOUT_DEFAULTS["about_steps"]
    try:
        steps = json.loads(raw_steps)
    except json.JSONDecodeError:
        steps = json.loads(ABOUT_DEFAULTS["about_steps"])
    return {
        "kicker": rows.get("about_kicker", ABOUT_DEFAULTS["about_kicker"]),
        "title": rows.get("about_title", ABOUT_DEFAULTS["about_title"]),
        "intro": rows.get("about_intro", ABOUT_DEFAULTS["about_intro"]),
        "detail": rows.get("about_detail", ABOUT_DEFAULTS["about_detail"]),
        "work_title": rows.get("about_work_title", ABOUT_DEFAULTS["about_work_title"]),
        "steps": [
            {"n": str(index + 1), "title": step.get("title", ""), "text": step.get("text", "")}
            for index, step in enumerate(steps)
            if step.get("title") or step.get("text")
        ],
    }
def application_out(row: Application) -> dict:
    return {
        "id": row.id,
        "job_id": row.job_id,
        "position": row.position,
        "first_name": row.first_name,
        "last_name": row.last_name,
        "name": f"{row.first_name} {row.last_name}".strip(),
        "email": row.email,
        "phone": row.phone,
        "street": row.street,
        "city": row.city,
        "region": row.region,
        "postal_code": row.postal_code,
        "country": row.country,
        "linkedin": row.linkedin,
        "website": row.website,
        "github": row.github,
        "other_link": row.other_link,
        "experience": row.experience,
        "employer": row.employer,
        "salary": row.salary,
        "available_from": row.available_from,
        "cv_filename": row.cv_filename,
        "cover_letter": row.cover_letter,
        "heard_from": row.heard_from,
        "status": row.status,
        "match_score": row.match_score or 0,
        "screen_decision": row.screen_decision or "",
        "screen_message": row.screen_message or "",
        "matched_skills": _json_list(row.matched_skills),
        "missing_skills": _json_list(row.missing_skills),
        "created_at": row.created_at.isoformat(),
    }
def _json_list(raw: str | None) -> list:
    try:
        value = json.loads(raw or "[]")
    except json.JSONDecodeError:
        return []
    return value if isinstance(value, list) else []
def remove_cv(filename: str) -> None:
    if not filename:
        return
    path = os.path.join(UPLOAD_DIR, os.path.basename(filename))
    if os.path.isfile(path):
        os.remove(path)
def user_out(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role,
        "department": user.department,
        "employee_code": user.employee_code,
    }
def parse_when(value: str) -> datetime | None:
    text = (value or "").strip()
    if not text:
        return None
    try:
        return datetime.fromisoformat(text)
    except ValueError:
        return None
def job_closed(job: Job, now: datetime | None = None) -> bool:
    now = now or datetime.now()
    if not job.active:
        return True
    closes = parse_when(job.closes_at or "")
    return bool(closes and closes <= now)
def job_open(job: Job, now: datetime | None = None) -> bool:
    now = now or datetime.now()
    if job_closed(job, now):
        return False
    opens = parse_when(job.opens_at or "")
    return not opens or opens <= now
def settle_jobs(db: Session) -> None:
    now = datetime.now()
    changed = False
    for row in db.query(Job).filter(Job.active == 1).all():
        closes = parse_when(row.closes_at or "")
        if closes and closes <= now:
            row.active = 0
            changed = True
    if changed:
        db.commit()
def apply_window(row: Job, opens_at: str, closes_at: str, active: bool) -> None:
    opens = (opens_at or "").strip()
    closes = (closes_at or "").strip()
    if not opens or not closes:
        raise HTTPException(status_code=422, detail="Add an opening time and a closing time.")
    opened = parse_when(opens)
    closed = parse_when(closes)
    if opened is None or closed is None:
        raise HTTPException(status_code=422, detail="Use a valid opening time and closing time.")
    if closed <= opened:
        raise HTTPException(status_code=422, detail="The closing time must be after the opening time.")
    row.opens_at = opens
    row.closes_at = closes
    row.active = 1 if active and closed > datetime.now() else 0
def ensure_job_workplace() -> None:
    if not str(engine.url).startswith("sqlite"):
        return
    with engine.connect() as conn:
        cols = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(jobs)").fetchall()}
        if cols and "workplace" not in cols:
            conn.exec_driver_sql("ALTER TABLE jobs ADD COLUMN workplace VARCHAR(40) DEFAULT 'Hybrid'")
        if cols and "opens_at" not in cols:
            conn.exec_driver_sql("ALTER TABLE jobs ADD COLUMN opens_at VARCHAR(40) DEFAULT ''")
        if cols and "closes_at" not in cols:
            conn.exec_driver_sql("ALTER TABLE jobs ADD COLUMN closes_at VARCHAR(40) DEFAULT ''")
        conn.commit()
def ensure_whatsapp_columns() -> None:
    if not str(engine.url).startswith("sqlite"):
        return
    with engine.connect() as conn:
        cols = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(whatsapp_messages)").fetchall()}
        if cols and "visitor" not in cols:
            conn.exec_driver_sql("ALTER TABLE whatsapp_messages ADD COLUMN visitor VARCHAR(64) DEFAULT ''")
        if cols and "edited" not in cols:
            conn.exec_driver_sql("ALTER TABLE whatsapp_messages ADD COLUMN edited INTEGER DEFAULT 0")
        if cols and "phone" not in cols:
            conn.exec_driver_sql("ALTER TABLE whatsapp_messages ADD COLUMN phone VARCHAR(20) DEFAULT '923198090911'")
        conn.commit()
def clean_visitor(value: str) -> str:
    key = value.strip()
    if not re.fullmatch(r"[A-Za-z0-9-]{16,64}", key):
        raise HTTPException(status_code=422, detail="Chat session is not valid")
    return key
def wa_out(row: WhatsAppMessage) -> dict:
    return {
        "id": row.id,
        "message": row.message,
        "created_at": row.created_at,
        "edited": bool(row.edited),
    }
def ensure_application_screen() -> None:
    columns = {
        "match_score": "INTEGER DEFAULT 0",
        "screen_decision": "VARCHAR(20) DEFAULT ''",
        "screen_message": "TEXT DEFAULT ''",
        "matched_skills": "TEXT DEFAULT '[]'",
        "missing_skills": "TEXT DEFAULT '[]'",
    }
    with engine.begin() as conn:
        if str(engine.url).startswith("sqlite"):
            existing = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(applications)").fetchall()}
            for name, ddl in columns.items():
                if existing and name not in existing:
                    conn.exec_driver_sql(f"ALTER TABLE applications ADD COLUMN {name} {ddl}")
            return
        for name, ddl in columns.items():
            try:
                conn.exec_driver_sql(f"ALTER TABLE applications ADD COLUMN {name} {ddl}")
            except Exception:
                pass
@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_job_workplace()
    ensure_application_screen()
    ensure_whatsapp_columns()
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()

@app.get("/", include_in_schema=False)
def root():
    return {"service": "Daataa Direct API", "status": "ok", "health": "/api/health"}
@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)
@app.get("/.well-known/appspecific/com.chrome.devtools.json", include_in_schema=False)
def chrome_devtools():
    return {}
@app.get("/api/health")
def health():
    return {"ok": True, "service": "daataa-direct"}
@app.post("/api/auth/login")
def login(body: LoginBody, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_session(db, user)
    return {"token": token, "user": user_out(user)}
@app.post("/api/auth/register")
def register(body: RegisterBody, db: Session = Depends(get_db)):
    email = body.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = User(
        email=email,
        password_hash=hash_password(body.password),
        first_name=body.first_name.strip(),
        last_name=body.last_name.strip(),
        role="employee",
        employee_code=body.employee_code.strip(),
        department=body.department,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_session(db, user)
    return {"token": token, "user": user_out(user)}
@app.get("/api/auth/me")
def me(user: User = Depends(get_current_user)):
    return user_out(user)
@app.get("/api/jobs")
def list_jobs(scope: str = "", db: Session = Depends(get_db), user: User | None = Depends(optional_user)):
    settle_jobs(db)
    rows = db.query(Job).order_by(Job.id).all()
    if scope == "all":
        if user is None or user.role != "admin":
            raise HTTPException(status_code=401, detail="Sign in required")
        return [job_out(row) for row in rows]
    return [job_out(row) for row in rows if job_open(row)]
@app.get("/api/jobs/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):
    row = db.query(Job).filter(Job.id == job_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Role not found")
    return job_out(row)
@app.post("/api/jobs")
def create_job(body: JobBody, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    row = Job(
        title=body.title.strip(),
        department=body.department.strip(),
        employment_type=body.employment_type,
        level=body.level,
        summary=body.summary.strip(),
        responsibilities=json.dumps([line.strip() for line in body.responsibilities if line.strip()]),
        requirements=json.dumps([line.strip() for line in body.requirements if line.strip()]),
        workplace=body.workplace.strip() or "Hybrid",
        active=1,
    )
    apply_window(row, body.opens_at, body.closes_at, body.active)
    db.add(row)
    db.commit()
    db.refresh(row)
    return job_out(row)
@app.put("/api/jobs/{job_id}")
def update_job(job_id: int, body: JobBody, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    row = db.query(Job).filter(Job.id == job_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Role not found")
    row.title = body.title.strip()
    row.department = body.department.strip()
    row.employment_type = body.employment_type
    row.level = body.level
    row.summary = body.summary.strip()
    row.responsibilities = json.dumps([line.strip() for line in body.responsibilities if line.strip()])
    row.requirements = json.dumps([line.strip() for line in body.requirements if line.strip()])
    row.workplace = body.workplace.strip() or "Hybrid"
    apply_window(row, body.opens_at, body.closes_at, body.active)
    db.commit()
    return job_out(row)
@app.delete("/api/jobs/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    row = db.query(Job).filter(Job.id == job_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Role not found")
    now = datetime.now().replace(second=0, microsecond=0)
    stamp = now.strftime("%Y-%m-%dT%H:%M")
    closes = parse_when(row.closes_at or "")
    if closes is None or closes > now:
        row.closes_at = stamp
    if not (row.opens_at or "").strip():
        row.opens_at = stamp
    row.active = 0
    db.commit()
    return {"ok": True}
@app.post("/api/applications")
async def create_application(
    position: str = Form(...),
    first_name: str = Form(...),
    last_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    street: str = Form(""),
    city: str = Form(""),
    region: str = Form(""),
    postal_code: str = Form(""),
    country: str = Form(""),
    linkedin: str = Form(""),
    website: str = Form(""),
    github: str = Form(""),
    other_link: str = Form(""),
    experience: str = Form(""),
    employer: str = Form(""),
    salary: str = Form(""),
    available_from: str = Form(""),
    cover_letter: str = Form(""),
    heard_from: str = Form(""),
    cv: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
):
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise HTTPException(status_code=422, detail="Enter a valid email address")
    filename = ""
    cv_bytes = b""
    if cv is not None and cv.filename:
        if not re.search(r"\.(pdf|docx?)$", cv.filename, re.I):
            raise HTTPException(status_code=422, detail="CV must be a PDF, DOC or DOCX file")
        cv_bytes = await cv.read()
        if len(cv_bytes) > 5 * 1024 * 1024:
            raise HTTPException(status_code=422, detail="CV is larger than 5 MB")
        safe = re.sub(r"[^A-Za-z0-9._-]", "_", cv.filename)
        filename = f"{int(datetime.utcnow().timestamp())}_{safe}"
        with open(os.path.join(UPLOAD_DIR, filename), "wb") as handle:
            handle.write(cv_bytes)
    settle_jobs(db)
    matches = db.query(Job).filter(Job.title == position.strip()).all()
    job = next((row for row in matches if job_open(row)), None)
    if matches and job is None:
        raise HTTPException(status_code=422, detail="Applications for this role are closed.")
    screen = score_application(
        cv_bytes=cv_bytes,
        cv_name=cv.filename if cv is not None and cv.filename else "",
        job=job,
        position=position,
        experience=experience,
        cover_letter=cover_letter,
        employer=employer,
    )
    row = Application(
        job_id=job.id if job else None,
        position=position.strip(),
        first_name=first_name.strip(),
        last_name=last_name.strip(),
        email=email.strip().lower(),
        phone=phone.strip(),
        street=street.strip(),
        city=city.strip(),
        region=region.strip(),
        postal_code=postal_code.strip(),
        country=country.strip(),
        linkedin=linkedin.strip(),
        website=website.strip(),
        github=github.strip(),
        other_link=other_link.strip(),
        experience=experience.strip(),
        employer=employer.strip(),
        salary=salary.strip(),
        available_from=available_from.strip(),
        cv_filename=filename,
        cover_letter=cover_letter.strip(),
        heard_from=heard_from.strip(),
        status=screen["status"],
        match_score=screen["match_score"],
        screen_decision=screen["screen_decision"],
        screen_message=screen["screen_message"],
        matched_skills=json.dumps(screen["matched_skills"]),
        missing_skills=json.dumps(screen["missing_skills"]),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return application_out(row)
@app.get("/api/applications")
def list_applications(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    rows = db.query(Application).order_by(Application.created_at.desc()).all()
    return [application_out(row) for row in rows]
@app.get("/api/applications/{application_id}/cv")
def download_application_cv(application_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    row = db.query(Application).filter(Application.id == application_id).first()
    if row is None or not row.cv_filename:
        raise HTTPException(status_code=404, detail="CV not found")
    path = os.path.join(UPLOAD_DIR, os.path.basename(row.cv_filename))
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="CV file is missing")
    original = re.sub(r"^\d+_", "", os.path.basename(row.cv_filename)) or "cv"
    return FileResponse(path, filename=original)
@app.put("/api/applications/{application_id}")
def update_application(application_id: int, body: StatusBody, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    allowed = {"New", "Review", "Interview", "Hired", "Rejected"}
    if body.status not in allowed:
        raise HTTPException(status_code=422, detail="Unknown status")
    row = db.query(Application).filter(Application.id == application_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Application not found")
    row.status = body.status
    db.commit()
    return application_out(row)
@app.delete("/api/applications/{application_id}")
def delete_application(application_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    row = db.query(Application).filter(Application.id == application_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Application not found")
    remove_cv(row.cv_filename)
    db.delete(row)
    db.commit()
    return {"ok": True}
@app.get("/api/employees")
def list_employees(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    rows = db.query(Employee).order_by(Employee.name).all()
    return [
        {"id": row.id, "name": row.name, "email": row.email, "department": row.department, "role_title": row.role_title, "status": row.status}
        for row in rows
    ]
@app.post("/api/employees")
def create_employee(body: EmployeeBody, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    row = Employee(name=body.name.strip(), email=body.email.lower(), department=body.department, role_title=body.role_title, status=body.status)
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id, "name": row.name, "email": row.email, "department": row.department, "role_title": row.role_title, "status": row.status}
@app.put("/api/employees/{employee_id}")
def update_employee(employee_id: int, body: EmployeeBody, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    row = db.query(Employee).filter(Employee.id == employee_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    row.name = body.name.strip()
    row.email = body.email.lower()
    row.department = body.department
    row.role_title = body.role_title
    row.status = body.status
    db.commit()
    return {"id": row.id, "name": row.name, "email": row.email, "department": row.department, "role_title": row.role_title, "status": row.status}
@app.delete("/api/employees/{employee_id}")
def delete_employee(employee_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    row = db.query(Employee).filter(Employee.id == employee_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    db.delete(row)
    db.commit()
    return {"ok": True}
@app.get("/api/stats")
def stats(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    settle_jobs(db)
    return {
        "open_roles": sum(1 for row in db.query(Job).all() if job_open(row)),
        "applications": db.query(Application).count(),
        "employees": db.query(Employee).count(),
        "new_applications": db.query(Application).filter(Application.status == "New").count(),
    }
@app.get("/api/whatsapp")
def list_whatsapp(visitor: str, db: Session = Depends(get_db)):
    key = clean_visitor(visitor)
    rows = (
        db.query(WhatsAppMessage)
        .filter(WhatsAppMessage.visitor == key)
        .order_by(WhatsAppMessage.id)
        .all()
    )
    return [wa_out(row) for row in rows]
@app.post("/api/whatsapp")
def save_whatsapp(body: WhatsAppBody, db: Session = Depends(get_db)):
    row = WhatsAppMessage(
        visitor=clean_visitor(body.visitor),
        name=body.name.strip()[:160],
        email=body.email.strip().lower()[:255],
        message=body.message.strip(),
        page=body.page.strip()[:255],
        phone=WHATSAPP_NUMBER,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return wa_out(row)
@app.put("/api/whatsapp/{message_id}")
def edit_whatsapp(message_id: int, body: WhatsAppEditBody, db: Session = Depends(get_db)):
    row = (
        db.query(WhatsAppMessage)
        .filter(WhatsAppMessage.id == message_id, WhatsAppMessage.visitor == clean_visitor(body.visitor))
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Message not found")
    row.message = body.message.strip()
    row.edited = 1
    db.commit()
    db.refresh(row)
    return wa_out(row)
@app.delete("/api/whatsapp/{message_id}")
def delete_whatsapp(message_id: int, visitor: str, db: Session = Depends(get_db)):
    row = (
        db.query(WhatsAppMessage)
        .filter(WhatsAppMessage.id == message_id, WhatsAppMessage.visitor == clean_visitor(visitor))
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Message not found")
    db.delete(row)
    db.commit()
    return {"ok": True}
@app.post("/api/contact")
def contact(body: ContactBody, db: Session = Depends(get_db)):
    name = body.name.strip()
    email = body.email.lower()
    message = body.message.strip()
    row = ContactMessage(name=name, email=email, message=message)
    db.add(row)
    db.commit()
    emailed = False
    try:
        emailed = send_contact_email(name, email, message)
    except Exception:
        logging.getLogger("daataa.mail").exception("Contact email could not be sent")
    return {"ok": True, "emailed": emailed}
@app.get("/api/about")
def get_about(db: Session = Depends(get_db)):
    return about_out(db)
@app.put("/api/about")
def update_about(body: AboutBody, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    values = {
        "about_kicker": body.kicker.strip(),
        "about_title": body.title.strip(),
        "about_intro": body.intro.strip(),
        "about_detail": body.detail.strip(),
        "about_work_title": body.work_title.strip(),
        "about_steps": json.dumps([
            {"title": step.title.strip(), "text": step.text.strip()}
            for step in body.steps
            if step.title.strip() or step.text.strip()
        ]),
    }
    for key, value in values.items():
        row = db.query(Setting).filter(Setting.key == key).first()
        if row is None:
            db.add(Setting(key=key, value=value))
        else:
            row.value = value
    db.commit()
    return about_out(db)
@app.get("/api/settings")
def get_settings(db: Session = Depends(get_db)):
    rows = {row.key: row.value for row in db.query(Setting).all()}
    return {
        "company_name": rows.get("company_name", "Daataa Direct Limited"),
        "accent": rows.get("accent", "#a384f5"),
        "contact_email": rows.get("contact_email", "humanresources.daataadirect@gmail.com"),
        "careers_open": rows.get("careers_open", "true") == "true",
    }
@app.put("/api/settings")
def update_settings(body: SettingsBody, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", body.accent):
        raise HTTPException(status_code=422, detail="Accent colour must be a hex value like #a384f5")
    values = {
        "company_name": body.company_name.strip(),
        "accent": body.accent.lower(),
        "contact_email": body.contact_email.strip(),
        "careers_open": "true" if body.careers_open else "false",
    }
    for key, value in values.items():
        row = db.query(Setting).filter(Setting.key == key).first()
        if row is None:
            db.add(Setting(key=key, value=value))
        else:
            row.value = value
    db.commit()
    return get_settings(db)
def faq_out(row: Faq) -> dict:
    return {"id": row.id, "question": row.question, "answer": row.answer}
def review_out(row: Review) -> dict:
    return {"id": row.id, "quote": row.quote, "role": row.role, "place": row.place, "stars": row.stars}
@app.get("/api/faqs")
def list_faqs(db: Session = Depends(get_db)):
    rows = db.query(Faq).order_by(Faq.sort_order, Faq.id).all()
    return [faq_out(row) for row in rows]
@app.post("/api/faqs")
def create_faq(body: FaqBody, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    order = (db.query(Faq).count() or 0) + 1
    row = Faq(question=body.question.strip(), answer=body.answer.strip(), sort_order=order)
    db.add(row)
    db.commit()
    db.refresh(row)
    return faq_out(row)
@app.put("/api/faqs/{faq_id}")
def update_faq(faq_id: int, body: FaqBody, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    row = db.query(Faq).filter(Faq.id == faq_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="FAQ not found")
    row.question = body.question.strip()
    row.answer = body.answer.strip()
    db.commit()
    db.refresh(row)
    return faq_out(row)
@app.delete("/api/faqs/{faq_id}")
def delete_faq(faq_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    row = db.query(Faq).filter(Faq.id == faq_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="FAQ not found")
    db.delete(row)
    db.commit()
    return {"ok": True}
@app.get("/api/reviews")
def list_reviews(db: Session = Depends(get_db)):
    rows = db.query(Review).order_by(Review.sort_order, Review.id).all()
    return [review_out(row) for row in rows]
@app.post("/api/reviews")
def create_review(body: ReviewBody, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    order = (db.query(Review).count() or 0) + 1
    row = Review(quote=body.quote.strip(), role=body.role.strip(), place=body.place.strip(), stars=body.stars, sort_order=order)
    db.add(row)
    db.commit()
    db.refresh(row)
    return review_out(row)
@app.put("/api/reviews/{review_id}")
def update_review(review_id: int, body: ReviewBody, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    row = db.query(Review).filter(Review.id == review_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Review not found")
    row.quote = body.quote.strip()
    row.role = body.role.strip()
    row.place = body.place.strip()
    row.stars = body.stars
    db.commit()
    db.refresh(row)
    return review_out(row)
@app.delete("/api/reviews/{review_id}")
def delete_review(review_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    row = db.query(Review).filter(Review.id == review_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Review not found")
    db.delete(row)
    db.commit()
    return {"ok": True}
