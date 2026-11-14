import json
from sqlalchemy.orm import Session
from .models import Application, Employee, Faq, Job, Review, Setting, User
from .security import hash_password
JOBS = [
    {
        "title": "Data Analyst",
        "department": "Data",
        "employment_type": "Full-time",
        "level": "Mid level",
        "summary": "Turn customer data into clear insight that guides every campaign we run.",
        "responsibilities": [
            "Clean, combine and analyse customer data from several sources",
            "Build dashboards and weekly reports for clients",
            "Spot trends and recommend which audiences to reach next",
            "Work with campaign managers to measure results",
        ],
        "requirements": [
            "2 or more years in data analysis",
            "Strong Excel and SQL skills",
            "Experience with a dashboard tool such as Power BI or Tableau",
            "Clear written and spoken English",
        ],
    },
    {
        "title": "Campaign Manager",
        "department": "Marketing",
        "employment_type": "Full-time",
        "level": "Mid level",
        "summary": "Plan and run SMS, email and voice campaigns that get real responses.",
        "responsibilities": [
            "Plan campaigns from brief to launch",
            "Write clear messages and choose the right audience",
            "Track delivery and response rates daily",
            "Report results to clients and suggest improvements",
        ],
        "requirements": [
            "2 or more years in direct or digital marketing",
            "Good copywriting and planning skills",
            "Comfortable with numbers and reports",
            "Able to manage several clients at once",
        ],
    },
    {
        "title": "Full-Stack Developer",
        "department": "Technology",
        "employment_type": "Full-time",
        "level": "Senior",
        "summary": "Build the websites, dashboards and tools that put data in our clients hands.",
        "responsibilities": [
            "Design and build web apps and APIs",
            "Connect platforms to messaging and data services",
            "Review code and mentor junior developers",
            "Keep systems fast, secure and reliable",
        ],
        "requirements": [
            "4 or more years of full-stack development",
            "TypeScript, Python and SQL",
            "Experience with cloud hosting",
            "A habit of writing clean, tested code",
        ],
    },
    {
        "title": "Customer Success Executive",
        "department": "Support",
        "employment_type": "Full-time",
        "level": "Entry level",
        "summary": "Be the friendly first point of contact who keeps our clients happy.",
        "responsibilities": [
            "Answer client questions by phone, email and chat",
            "Help new clients get started on our platforms",
            "Log issues and follow them through to a fix",
            "Share client feedback with the wider team",
        ],
        "requirements": [
            "Excellent communication skills",
            "Patient and organised",
            "Comfortable learning new tools quickly",
            "Previous support experience is a plus",
        ],
    },
]
def seed(db: Session) -> None:
    if db.query(User).count() == 0:
        db.add_all(
            [
                User(
                    email="admin@daataadirect.com",
                    password_hash=hash_password("Password123"),
                    first_name="Amina",
                    last_name="Rahman",
                    role="admin",
                    employee_code="DD-001",
                    department="Management",
                ),
                User(
                    email="employee@daataadirect.com",
                    password_hash=hash_password("Password123"),
                    first_name="Omar",
                    last_name="Hassan",
                    role="employee",
                    employee_code="DD-014",
                    department="Data",
                ),
            ]
        )
    if db.query(Job).count() == 0:
        for item in JOBS:
            db.add(
                Job(
                    title=item["title"],
                    department=item["department"],
                    employment_type=item["employment_type"],
                    level=item["level"],
                    summary=item["summary"],
                    responsibilities=json.dumps(item["responsibilities"]),
                    requirements=json.dumps(item["requirements"]),
                    active=1,
                )
            )
        db.flush()
    if db.query(Employee).count() == 0:
        db.add_all(
            [
                Employee(name="Amina Rahman", email="admin@daataadirect.com", department="Management", role_title="Director", status="Active"),
                Employee(name="Omar Hassan", email="employee@daataadirect.com", department="Data", role_title="Data Analyst", status="Active"),
                Employee(name="Sara Iqbal", email="sara@daataadirect.com", department="Marketing", role_title="Campaign Manager", status="Active"),
                Employee(name="Noah Patel", email="noah@daataadirect.com", department="Technology", role_title="Full-Stack Developer", status="Active"),
            ]
        )
    if db.query(Application).count() == 0:
        jobs = {row.title: row.id for row in db.query(Job).all()}
        db.add_all(
            [
                Application(job_id=jobs.get("Data Analyst"), position="Data Analyst", first_name="Hana", last_name="Yusuf", email="hana@example.com", phone="+44 7700 900111", city="London", country="United Kingdom", experience="3 to 5 years", status="New"),
                Application(job_id=jobs.get("Campaign Manager"), position="Campaign Manager", first_name="Leo", last_name="Mensah", email="leo@example.com", phone="+44 7700 900222", city="Manchester", country="United Kingdom", experience="1 to 3 years", status="Interview"),
                Application(job_id=jobs.get("Customer Success Executive"), position="Customer Success Executive", first_name="Maya", last_name="Chen", email="maya@example.com", phone="+44 7700 900333", city="Birmingham", country="United Kingdom", experience="Less than 1 year", status="Hired"),
            ]
        )
    about_defaults = {
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
    for key, value in about_defaults.items():
        if db.query(Setting).filter(Setting.key == key).first() is None:
            db.add(Setting(key=key, value=value))
    if db.query(Faq).count() == 0:
        for index, item in enumerate(
            [
                ("What does Daataa Direct Limited do?", "We help businesses understand their customers and reach them directly, with data, campaigns and digital tools you can measure."),
                ("Which services do you offer?", "Operations, administration, accounts, HR, research, marketing, IT, procurement, sales, customer service, shipping, legal, e-commerce, graphic design and quality assurance."),
                ("Where is the company based?", "The office is in Rawalpindi. Client work is delivered remotely, so you do not need to be in the same city."),
                ("What are your working hours?", "We work from 11am to 8pm, Pakistan time."),
                ("How quickly do you reply?", "We read every message during working hours and reply within one working day."),
                ("How do I start a project?", "Fill in the contact form. We reply within one working day at humanresources.daataadirect@gmail.com."),
            ]
        ):
            db.add(Faq(question=item[0], answer=item[1], sort_order=index + 1))
    if db.query(Review).count() == 0:
        for index, item in enumerate(
            [
                ("They turned a messy customer list into a campaign we could actually measure. Replies came back inside a working day.", "Marketing lead", "Retail brand"),
                ("The Rawalpindi team worked with us remotely and still felt close. Reporting was clear and the hours matched our evenings.", "Operations manager", "Distribution company"),
                ("Graphic design, listings and customer follow-up sat in one place. We stopped chasing three different vendors.", "E-commerce owner", "Online store"),
                ("Sales and customer service used the same audience notes. That alone made our outreach calmer and more accurate.", "Sales director", "Services firm"),
            ]
        ):
            db.add(Review(quote=item[0], role=item[1], place=item[2], stars=5, sort_order=index + 1))
    if db.query(Setting).filter(Setting.key == "company_name").first() is None:
        db.add_all(
            [
                Setting(key="company_name", value="Daataa Direct Limited"),
                Setting(key="accent", value="#a384f5"),
                Setting(key="contact_email", value="humanresources.daataadirect@gmail.com"),
                Setting(key="careers_open", value="true"),
            ]
        )
    db.commit()
