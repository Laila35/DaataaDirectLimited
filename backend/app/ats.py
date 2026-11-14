import io
import re
import zipfile
from xml.etree import ElementTree

from .models import Job

STOP = {
    "a", "an", "and", "or", "the", "to", "of", "in", "on", "for", "with", "as", "at", "by", "from",
    "is", "are", "be", "our", "your", "you", "we", "that", "this", "such", "than", "more", "most",
    "per", "via", "into", "over", "able", "plus", "using", "use", "used", "work", "working", "role",
}
GENERIC = {
    "strong", "skills", "skill", "experience", "experienced", "years", "year", "clear", "good",
    "written", "spoken", "comfortable", "previous", "habit", "writing", "clean", "tested", "several",
    "tool", "tools", "level", "including", "across", "within", "other", "etc",
}
PHRASES = (
    "power bi", "data analysis", "full stack", "full-stack", "customer service", "direct marketing",
    "digital marketing", "machine learning", "quality assurance", "human resources",
)
YEARS = {
    "less than 1 year": 0,
    "1 to 3 years": 2,
    "3 to 5 years": 4,
    "5 to 10 years": 7,
    "more than 10 years": 10,
}


def extract_text(data: bytes, filename: str) -> str:
    name = (filename or "").lower()
    if name.endswith(".pdf"):
        return _pdf_text(data)
    if name.endswith(".docx"):
        return _docx_text(data)
    if name.endswith(".doc"):
        return _doc_text(data)
    return ""


def score_application(
    cv_bytes: bytes,
    cv_name: str,
    job: Job | None,
    position: str,
    experience: str,
    cover_letter: str,
    employer: str,
) -> dict:
    cv_text = extract_text(cv_bytes, cv_name) if cv_bytes else ""
    candidate = _normalise(" ".join([cv_text, cover_letter or "", employer or "", experience or ""]))
    requirements, responsibilities, title = _job_parts(job, position)
    requirement_rows = [_criterion(line, candidate) for line in requirements]
    requirement_rows = [row for row in requirement_rows if row["terms"]]
    responsibility_rows = [_criterion(line, candidate) for line in responsibilities]
    responsibility_rows = [row for row in responsibility_rows if row["terms"]]
    title_terms = _terms(title)
    title_hit = _coverage(title_terms, candidate)

    req_score = _average([row["score"] for row in requirement_rows])
    resp_score = _average([row["score"] for row in responsibility_rows])
    if requirement_rows:
        raw = req_score * 75 + resp_score * 15 + title_hit * 10
    elif responsibility_rows:
        raw = resp_score * 85 + title_hit * 15
    else:
        raw = title_hit * 100

    needed = _years_required(requirements)
    held = YEARS.get((experience or "").strip().lower())
    if needed is not None and held is not None and held < needed and raw >= 30:
        raw -= 12
    score = max(0, min(100, round(raw)))

    matched = _unique([term for row in requirement_rows for term in row["matched"]])
    missing = _unique([term for row in requirement_rows for term in row["missing"]])
    role = position.strip() or "this role"
    if score < 30:
        decision = "Rejected"
        status = "Rejected"
        message = (
            f"Thank you for applying for {role}. "
            "Your CV does not meet the qualifications and skills required for this role, so we are not able to take the application forward. "
            "We appreciate the time you gave to the form."
        )
    elif score >= 50:
        decision = "Approved"
        status = "New"
        message = (
            f"Thank you for applying for {role}. "
            f"Your CV covers {score}% of the skills requested for the role. "
            "The application has been accepted and passed to the hiring team for the next stage."
        )
    else:
        decision = "Review"
        status = "Review"
        message = (
            f"Thank you for applying for {role}. "
            f"Your CV covers {score}% of the skills requested for the role. "
            "The hiring team will review it before deciding on the next stage."
        )
    if not cv_text.strip():
        message += " The CV contained little readable text, so the comparison also used the answers on your form."
    return {
        "match_score": score,
        "screen_decision": decision,
        "screen_message": message,
        "matched_skills": matched[:8],
        "missing_skills": missing[:8],
        "status": status,
    }


def _job_parts(job: Job | None, position: str) -> tuple[list[str], list[str], str]:
    import json
    if job is None:
        return [], [], position
    try:
        requirements = json.loads(job.requirements or "[]")
    except json.JSONDecodeError:
        requirements = []
    try:
        responsibilities = json.loads(job.responsibilities or "[]")
    except json.JSONDecodeError:
        responsibilities = []
    return list(requirements), list(responsibilities), f"{job.title} {job.department}"


def _criterion(line: str, candidate: str) -> dict:
    terms = _terms(line)
    matched = [term for term in terms if _present(term, candidate)]
    missing = [term for term in terms if term not in matched]
    if not terms:
        score = 0.0
    else:
        score = len(matched) / len(terms)
    return {"terms": terms, "matched": matched, "missing": missing, "score": score}


def _terms(line: str) -> list[str]:
    low = _normalise(line)
    found: list[str] = []
    for phrase in PHRASES:
        if phrase in low:
            found.append(phrase)
            low = low.replace(phrase, " ")
    for word in re.findall(r"[a-z][a-z0-9+]{1,}", low):
        if word in STOP or word in GENERIC or len(word) < 3:
            continue
        found.append(word)
    return _unique(found)


def _present(term: str, candidate: str) -> bool:
    options = {term, f"{term}s"}
    if term.endswith("s") and len(term) > 3:
        options.add(term[:-1])
    if " " in term:
        return any(option in candidate for option in options)
    return any(re.search(rf"(?<![a-z0-9]){re.escape(option)}(?![a-z0-9])", candidate) for option in options)


def _coverage(terms: list[str], candidate: str) -> float:
    if not terms:
        return 0.0
    return sum(1 for term in terms if _present(term, candidate)) / len(terms)


def _average(values: list[float]) -> float:
    if not values:
        return 0.0
    return sum(values) / len(values)


def _years_required(lines: list[str]) -> int | None:
    numbers = []
    for line in lines:
        match = re.search(r"(\d+)\s*\+?\s*(or more\s+)?years", line.lower())
        if match:
            numbers.append(int(match.group(1)))
    return max(numbers) if numbers else None


def _normalise(text: str) -> str:
    value = (text or "").lower().replace("powerbi", "power bi").replace("node.js", "node").replace("full-stack", "full stack")
    value = value.replace("analyze", "analyse")
    for alias in ("mysql", "postgresql", "postgres"):
        value = re.sub(rf"(?<![a-z]){alias}(?![a-z])", "sql", value)
    return re.sub(r"\s+", " ", value)


def _unique(items: list[str]) -> list[str]:
    seen: list[str] = []
    for item in items:
        if item not in seen:
            seen.append(item)
    return seen


def _pdf_text(data: bytes) -> str:
    try:
        from pypdf import PdfReader
    except ImportError:
        return _loose_text(data)
    try:
        reader = PdfReader(io.BytesIO(data))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception:
        return _loose_text(data)


def _docx_text(data: bytes) -> str:
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            xml = archive.read("word/document.xml")
    except (zipfile.BadZipFile, KeyError):
        return ""
    root = ElementTree.fromstring(xml)
    return " ".join(node.text or "" for node in root.iter() if node.text)


def _doc_text(data: bytes) -> str:
    utf16 = data.decode("utf-16le", errors="ignore")
    latin = data.decode("latin-1", errors="ignore")
    chunks = re.findall(r"[A-Za-z][A-Za-z0-9+&./-]{3,}", f"{utf16}\n{latin}")
    return " ".join(chunks)


def _loose_text(data: bytes) -> str:
    raw = data.decode("latin-1", errors="ignore")
    return " ".join(re.findall(r"[A-Za-z][A-Za-z0-9+&./-]{3,}", raw))
