import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    # 16:9 widescreen
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    NAVY_DARK = RGBColor(15, 23, 42)      # #0F172A
    NAVY_PRIMARY = RGBColor(30, 58, 138)   # #1E3A8A
    BLUE_ACCENT = RGBColor(37, 99, 235)    # #2563EB
    GOLD_ACCENT = RGBColor(217, 119, 6)    # #D97706
    WHITE = RGBColor(255, 255, 255)
    SLATE_LIGHT = RGBColor(248, 250, 252)  # #F8FAFC
    SLATE_BORDER = RGBColor(226, 232, 240) # #E2E8F0
    TEXT_MAIN = RGBColor(30, 41, 59)       # #1E293B
    TEXT_MUTED = RGBColor(100, 116, 139)   # #64748B
    CARD_BG = RGBColor(241, 245, 249)      # #F1F5F9

    logo_path = os.path.abspath('client/public/images/sairam-logo.png')
    hall_path = os.path.abspath('client/public/images/seminar-hall.jpg')

    blank_layout = prs.slide_layouts[6]

    def add_header(slide, title_text, category="CENTRALIZED FACILITY SYSTEM"):
        # Header banner
        header_shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(1.1))
        header_shape.fill.solid()
        header_shape.fill.fore_color.rgb = NAVY_DARK
        header_shape.line.fill.background()

        # Accent line under header
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(1.1), Inches(13.333), Inches(0.06))
        line.fill.solid()
        line.fill.fore_color.rgb = GOLD_ACCENT
        line.line.fill.background()

        # Category text
        tb_cat = slide.shapes.add_textbox(Inches(0.8), Inches(0.12), Inches(9.5), Inches(0.3))
        p_cat = tb_cat.text_frame.paragraphs[0]
        p_cat.text = category.upper()
        p_cat.font.size = Pt(9.5)
        p_cat.font.bold = True
        p_cat.font.color.rgb = GOLD_ACCENT

        # Title text
        tb_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.38), Inches(9.5), Inches(0.6))
        p_title = tb_title.text_frame.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(20)
        p_title.font.bold = True
        p_title.font.color.rgb = WHITE

        # Logo on right if available
        if os.path.exists(logo_path):
            try:
                slide.shapes.add_picture(logo_path, Inches(10.8), Inches(0.18), height=Inches(0.72))
            except Exception:
                pass

    # ==========================================
    # SLIDE 1: Title Slide (Dark Theme)
    # ==========================================
    slide1 = prs.slides.add_slide(blank_layout)
    bg1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = NAVY_DARK
    bg1.line.fill.background()

    # Decorative accent card
    accent1 = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.8), Inches(11.733), Inches(5.9))
    accent1.fill.solid()
    accent1.fill.fore_color.rgb = RGBColor(30, 41, 59)
    accent1.line.color.rgb = RGBColor(51, 65, 85)
    accent1.line.width = Pt(1.5)

    if os.path.exists(logo_path):
        try:
            # White container for logo
            logo_box = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.3), Inches(1.2), Inches(3.2), Inches(1.1))
            logo_box.fill.solid()
            logo_box.fill.fore_color.rgb = WHITE
            logo_box.line.fill.background()
            slide1.shapes.add_picture(logo_path, Inches(1.4), Inches(1.25), width=Inches(3.0))
        except Exception:
            pass

    # College badge
    tb_inst = slide1.shapes.add_textbox(Inches(1.3), Inches(2.45), Inches(10.5), Inches(0.4))
    p_inst = tb_inst.text_frame.paragraphs[0]
    p_inst.text = "SRI SAIRAM COLLEGE OF ENGINEERING, BENGALURU"
    p_inst.font.size = Pt(13)
    p_inst.font.bold = True
    p_inst.font.color.rgb = GOLD_ACCENT

    # Main Title
    tb_title = slide1.shapes.add_textbox(Inches(1.3), Inches(2.85), Inches(10.5), Inches(1.6))
    tf_title = tb_title.text_frame
    tf_title.word_wrap = True
    p_main = tf_title.paragraphs[0]
    p_main.text = "Centralized Seminar Hall &\nCampus Facility Reservation System"
    p_main.font.size = Pt(28)
    p_main.font.bold = True
    p_main.font.color.rgb = WHITE

    # Subtitle
    tb_sub = slide1.shapes.add_textbox(Inches(1.3), Inches(4.5), Inches(10.5), Inches(0.6))
    p_sub = tb_sub.text_frame.paragraphs[0]
    p_sub.text = "An Enterprise-grade, Concurrency-safe Web Platform with Multi-tier Approvals & Dynamic Privacy"
    p_sub.font.size = Pt(13)
    p_sub.font.color.rgb = RGBColor(148, 163, 184)

    # Divider line
    div1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.3), Inches(5.15), Inches(10.7), Inches(0.04))
    div1.fill.solid()
    div1.fill.fore_color.rgb = GOLD_ACCENT
    div1.line.fill.background()

    # Meta Presenter info
    tb_meta = slide1.shapes.add_textbox(Inches(1.3), Inches(5.35), Inches(5.2), Inches(1.0))
    tf_meta = tb_meta.text_frame
    p_pres = tf_meta.paragraphs[0]
    p_pres.text = "Presented By:"
    p_pres.font.size = Pt(11)
    p_pres.font.bold = True
    p_pres.font.color.rgb = GOLD_ACCENT
    p_name = tf_meta.add_paragraph()
    p_name.text = "[Your Name / Team Name & Roll Numbers]"
    p_name.font.size = Pt(12)
    p_name.font.color.rgb = WHITE

    tb_guide = slide1.shapes.add_textbox(Inches(6.8), Inches(5.35), Inches(5.2), Inches(1.0))
    tf_guide = tb_guide.text_frame
    p_g_lbl = tf_guide.paragraphs[0]
    p_g_lbl.text = "Project Guide / Mentor:"
    p_g_lbl.font.size = Pt(11)
    p_g_lbl.font.bold = True
    p_g_lbl.font.color.rgb = GOLD_ACCENT
    p_g_val = tf_guide.add_paragraph()
    p_g_val.text = "[Your Project Guide Name & Designation]"
    p_g_val.font.size = Pt(12)
    p_g_val.font.color.rgb = WHITE

    # ==========================================
    # SLIDE 2: Problem Statement & Motivation
    # ==========================================
    slide2 = prs.slides.add_slide(blank_layout)
    add_header(slide2, "Problem Statement & Motivation", "Context & Background")

    problems = [
        ("Manual Registers & Logbooks", "Prone to lost paperwork, human entry errors, misread time-slots, and complete lack of digital accountability.", "📁"),
        ("Scheduling Clashes & Conflicts", "Critical race conditions occur when two departments request the same auditorium simultaneously for identical slots.", "⚡"),
        ("Zero Real-Time Transparency", "No centralized visibility of ongoing hall maintenance, university exam schedules, or academic calendar holidays.", "👁️"),
        ("Bureaucratic & Slow Approvals", "Coordinators waste hours running physical permission slips to Dean/Principal desks without instant digital passes.", "⏳")
    ]

    card_w = Inches(5.6)
    card_h = Inches(2.4)
    positions = [
        (Inches(0.8), Inches(1.6)),
        (Inches(6.9), Inches(1.6)),
        (Inches(0.8), Inches(4.3)),
        (Inches(6.9), Inches(4.3)),
    ]

    for (title, desc, icon), (x, y) in zip(problems, positions):
        card = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, card_w, card_h)
        card.fill.solid()
        card.fill.fore_color.rgb = SLATE_LIGHT
        card.line.color.rgb = SLATE_BORDER
        card.line.width = Pt(1.2)

        # Red accent bar on left of card
        lbar = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(0.18), card_h)
        lbar.fill.solid()
        lbar.fill.fore_color.rgb = RGBColor(239, 68, 68)
        lbar.line.fill.background()

        tb = slide2.shapes.add_textbox(x + Inches(0.4), y + Inches(0.3), card_w - Inches(0.6), card_h - Inches(0.5))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = f"{icon}  {title}"
        p1.font.size = Pt(16)
        p1.font.bold = True
        p1.font.color.rgb = NAVY_DARK

        p2 = tf.add_paragraph()
        p2.space_before = Pt(8)
        p2.text = desc
        p2.font.size = Pt(12)
        p2.font.color.rgb = TEXT_MUTED

    # ==========================================
    # SLIDE 3: Proposed Solution & Objectives
    # ==========================================
    slide3 = prs.slides.add_slide(blank_layout)
    add_header(slide3, "Proposed Solution & Key Objectives", "System Solution")

    solutions = [
        ("Single Centralized Digital Portal", "Unified institutional web application managing Central Seminar Auditorium and Sir M. Visvesvaraya AV Hall in one place.", "🏛️"),
        ("Real-Time Interactive Desk Calendar", "Interactive day & slot matrix indicating live statuses: Available, Booked, In-Review, Maintenance, and Holidays.", "📅"),
        ("Concurrency-Safe Conflict Engine", "ACID database transactions (prisma.$transaction) providing zero double-booking guarantee even during simultaneous submissions.", "🔒"),
        ("Role-Based Access Governance (RBAC)", "Hierarchical authorization distinguishing Public Visitors, Verified Faculty, Estate Admins, and Super Admin (Principal).", "👥"),
        ("Automated Verifiable Digital Passes", "Instant PDF booking gate vouchers with offline-scannable QR verification badges and institutional authority seal.", "🎫")
    ]

    for idx, (title, desc, icon) in enumerate(solutions):
        y = Inches(1.5 + idx * 1.1)
        card = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), y, Inches(11.733), Inches(0.95))
        card.fill.solid()
        card.fill.fore_color.rgb = WHITE
        card.line.color.rgb = SLATE_BORDER
        card.line.width = Pt(1)

        # Blue dot/bar
        bbar = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), y, Inches(0.16), Inches(0.95))
        bbar.fill.solid()
        bbar.fill.fore_color.rgb = BLUE_ACCENT
        bbar.line.fill.background()

        tb = slide3.shapes.add_textbox(Inches(1.2), y + Inches(0.12), Inches(11.0), Inches(0.75))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = f"{icon}  {title} — "
        p1.font.size = Pt(14)
        p1.font.bold = True
        p1.font.color.rgb = NAVY_PRIMARY

        # Description run
        run = p1.add_run()
        run.text = desc
        run.font.size = Pt(12)
        run.font.bold = False
        run.font.color.rgb = TEXT_MAIN

    # ==========================================
    # SLIDE 4: System Architecture & Technology Stack
    # ==========================================
    slide4 = prs.slides.add_slide(blank_layout)
    add_header(slide4, "System Architecture & Technology Stack", "Technical Architecture")

    pillars = [
        ("Frontend Architecture", [
            ("React 18 + TypeScript", "Strict type-safe component hierarchy"),
            ("Vite Build Engine", "Blazing-fast HMR & optimized production assets"),
            ("Tailwind CSS v4", "Collegiate responsive design & dark/light theme"),
            ("Lucide & Recharts", "Modern iconography & interactive dashboard analytics"),
            ("jsPDF & QR Engine", "Client-side vector PDF passes & high-density QR")
        ], BLUE_ACCENT),
        ("Backend Architecture", [
            ("Node.js & Express (TS)", "Modular RESTful micro-routing architecture"),
            ("Prisma ORM", "Type-safe relational modeling & transactional locks"),
            ("SQLite / PostgreSQL", "Local zero-config dev & enterprise Postgres ready"),
            ("Nodemailer Automated Mail", "Built-in SMTP dispatcher for lifecycle notifications"),
            ("Audit Logging Subsystem", "Full immutable record of administrative actions")
        ], NAVY_PRIMARY),
        ("Security & Governance", [
            ("JWT (JSON Web Tokens)", "Signed cryptographic tokens with 7-day expiry"),
            ("Salted bcryptjs Hashes", "Industry-grade password protection"),
            ("Secure Multer Pipeline", "MIME-checked HOD authorization PDF uploads"),
            ("Dynamic Privacy Modes", "Auto-masking sensitive event titles on public view"),
            ("Account Approval Guard", "Strict inactive gating for newly registered users")
        ], GOLD_ACCENT),
    ]

    for p_idx, (p_title, p_items, p_color) in enumerate(pillars):
        x = Inches(0.8 + p_idx * 4.0)
        card = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Inches(1.5), Inches(3.75), Inches(5.4))
        card.fill.solid()
        card.fill.fore_color.rgb = WHITE
        card.line.color.rgb = SLATE_BORDER
        card.line.width = Pt(1.2)

        # Header bar of card
        c_hdr = slide4.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, Inches(1.5), Inches(3.75), Inches(0.7))
        c_hdr.fill.solid()
        c_hdr.fill.fore_color.rgb = p_color
        c_hdr.line.fill.background()

        tb_chdr = slide4.shapes.add_textbox(x, Inches(1.6), Inches(3.75), Inches(0.5))
        p_chdr = tb_chdr.text_frame.paragraphs[0]
        p_chdr.text = p_title
        p_chdr.font.size = Pt(13)
        p_chdr.font.bold = True
        p_chdr.font.color.rgb = WHITE
        p_chdr.alignment = PP_ALIGN.CENTER

        # List items
        tb_list = slide4.shapes.add_textbox(x + Inches(0.25), Inches(2.35), Inches(3.25), Inches(4.3))
        tf_list = tb_list.text_frame
        tf_list.word_wrap = True

        for i_idx, (item_head, item_sub) in enumerate(p_items):
            p_head = tf_list.paragraphs[0] if i_idx == 0 else tf_list.add_paragraph()
            p_head.space_before = Pt(8) if i_idx > 0 else Pt(0)
            p_head.text = f"• {item_head}"
            p_head.font.size = Pt(11)
            p_head.font.bold = True
            p_head.font.color.rgb = NAVY_DARK

            p_sub = tf_list.add_paragraph()
            p_sub.text = f"   {item_sub}"
            p_sub.font.size = Pt(9.5)
            p_sub.font.color.rgb = TEXT_MUTED

    # ==========================================
    # SLIDE 5: User Roles & Access Hierarchy (RBAC)
    # ==========================================
    slide5 = prs.slides.add_slide(blank_layout)
    add_header(slide5, "User Roles & Access Hierarchy (RBAC)", "Role-Based Access Control")

    roles = [
        ("1. Public / Student Visitors", [
            "Explore hall seating capacity, sound/projector amenities & galleries",
            "View live Interactive Availability Calendar (Read-only mode)",
            "Dynamic privacy masking: Sensitive administrative events remain protected",
            "Browse upcoming campus celebrations and student technical seminars"
        ], RGBColor(100, 116, 139)),
        ("2. Verified Faculty Coordinators", [
            "Submit booking requests: Single-day, Multi-day, Morning, Afternoon, or Custom",
            "Upload official HOD recommendation documents & permission letters",
            "Track live request progression: PENDING ➔ APPROVED ➔ CANCELLED",
            "Generate & download official PDF Gate Pass with QR verification code"
        ], BLUE_ACCENT),
        ("3. Estate Admin & Super Admin (Principal)", [
            "Review pending queues: 1-click Approve or Cancel with personalized faculty notices",
            "Facility Desk: Edit hall amenities, maximum capacity, or add new auditoriums",
            "Blackout Management: Block dates for University Exams, NAAC, or Maintenance",
            "User Governance: Approve new faculty accounts, grant roles, and department admin",
            "Analytics Suite: Monthly utilization graphs and CSV data exports"
        ], NAVY_PRIMARY)
    ]

    for r_idx, (r_title, r_points, r_col) in enumerate(roles):
        y = Inches(1.5 + r_idx * 1.85)
        card = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), y, Inches(11.733), Inches(1.7))
        card.fill.solid()
        card.fill.fore_color.rgb = WHITE
        card.line.color.rgb = SLATE_BORDER
        card.line.width = Pt(1.2)

        # Left Accent strip
        lstrip = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), y, Inches(0.2), Inches(1.7))
        lstrip.fill.solid()
        lstrip.fill.fore_color.rgb = r_col
        lstrip.line.fill.background()

        tb = slide5.shapes.add_textbox(Inches(1.2), y + Inches(0.12), Inches(11.0), Inches(1.5))
        tf = tb.text_frame
        tf.word_wrap = True

        p_head = tf.paragraphs[0]
        p_head.text = r_title
        p_head.font.size = Pt(15)
        p_head.font.bold = True
        p_head.font.color.rgb = r_col

        for pt in r_points:
            p_pt = tf.add_paragraph()
            p_pt.text = f"✔  {pt}"
            p_pt.font.size = Pt(11)
            p_pt.font.color.rgb = TEXT_MAIN

    # ==========================================
    # SLIDE 6: Core Workflow Pipeline
    # ==========================================
    slide6 = prs.slides.add_slide(blank_layout)
    add_header(slide6, "End-to-End Reservation Workflow Pipeline", "Process Architecture")

    steps = [
        ("Step 1", "Faculty Login", "Authenticated portal access with JWT check"),
        ("Step 2", "Select Hall & Slot", "Date, timing slot & HOD letter upload"),
        ("Step 3", "Atomic Conflict Lock", "prisma.$transaction prevents overlapping slots"),
        ("Step 4", "Status: PENDING", "Enters administrative queue & email dispatched"),
        ("Step 5", "Admin Decision", "Approve with remarks or Cancel with notice"),
        ("Step 6", "Gate Pass Generated", "Downloadable PDF voucher with scannable QR")
    ]

    step_w = Inches(1.8)
    for s_idx, (s_num, s_title, s_desc) in enumerate(steps):
        x = Inches(0.7 + s_idx * 2.05)
        card = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Inches(2.2), step_w, Inches(3.6))
        card.fill.solid()
        card.fill.fore_color.rgb = WHITE
        card.line.color.rgb = BLUE_ACCENT if s_idx == 2 or s_idx == 4 else SLATE_BORDER
        card.line.width = Pt(1.5)

        # Header pill inside step card
        pill = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x + Inches(0.2), Inches(2.4), step_w - Inches(0.4), Inches(0.4))
        pill.fill.solid()
        pill.fill.fore_color.rgb = NAVY_PRIMARY if s_idx != 4 else GOLD_ACCENT
        pill.line.fill.background()

        tb_pill = slide6.shapes.add_textbox(x + Inches(0.2), Inches(2.42), step_w - Inches(0.4), Inches(0.35))
        p_pill = tb_pill.text_frame.paragraphs[0]
        p_pill.text = s_num
        p_pill.font.size = Pt(10)
        p_pill.font.bold = True
        p_pill.font.color.rgb = WHITE
        p_pill.alignment = PP_ALIGN.CENTER

        tb = slide6.shapes.add_textbox(x + Inches(0.12), Inches(3.0), step_w - Inches(0.24), Inches(2.6))
        tf = tb.text_frame
        tf.word_wrap = True

        p_t = tf.paragraphs[0]
        p_t.text = s_title
        p_t.font.size = Pt(13)
        p_t.font.bold = True
        p_t.font.color.rgb = NAVY_DARK
        p_t.alignment = PP_ALIGN.CENTER

        p_d = tf.add_paragraph()
        p_d.space_before = Pt(10)
        p_d.text = s_desc
        p_d.font.size = Pt(10.5)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.alignment = PP_ALIGN.CENTER

        # Connector arrow
        if s_idx < 5:
            arr = slide6.shapes.add_textbox(x + step_w, Inches(3.6), Inches(0.25), Inches(0.5))
            p_arr = arr.text_frame.paragraphs[0]
            p_arr.text = "➔"
            p_arr.font.size = Pt(16)
            p_arr.font.bold = True
            p_arr.font.color.rgb = GOLD_ACCENT

    # Footer banner on slide 6
    f_bar = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(6.2), Inches(11.733), Inches(0.7))
    f_bar.fill.solid()
    f_bar.fill.fore_color.rgb = SLATE_LIGHT
    f_bar.line.color.rgb = SLATE_BORDER
    tb_f = slide6.shapes.add_textbox(Inches(1.0), Inches(6.25), Inches(11.3), Inches(0.5))
    p_f = tb_f.text_frame.paragraphs[0]
    p_f.text = "⚡ Key Highlight: All booking validation, slot availability checking, and conflict resolution occur atomically inside Prisma interactive database transactions."
    p_f.font.size = Pt(11)
    p_f.font.color.rgb = NAVY_PRIMARY

    # ==========================================
    # SLIDE 7: Key Technical Challenges & Solutions
    # ==========================================
    slide7 = prs.slides.add_slide(blank_layout)
    add_header(slide7, "Key Engineering Challenges & Solutions", "Technical Innovation")

    challenges = [
        ("The Double-Booking Concurrency Race Condition",
         "When two faculty coordinators submit requests for the same hall at the exact same millisecond.",
         "Engineered Prisma Interactive Transactions (prisma.$transaction) wrapping slot availability verification and booking creation atomically. Completely eliminates duplicate reservations."),
        ("Timezone Offset Drift (IST UTC+05:30)",
         "Standard JavaScript toISOString() converts local IST midnight into previous day's UTC date.",
         "Constructed a robust local ISO date utility extracting year, month, and day in strict Asia/Kolkata timezone, guaranteeing 100% calendar consistency across client & server."),
        ("Institutional Privacy & Examination Confidentiality",
         "Confidential administrative meetings or paper-evaluation drives must not expose event titles to student public view.",
         "Implemented 3 Dynamic Privacy Modes (EVENT_TITLE, DEPARTMENT_EVENT, RESERVED_SLOT) automatically masking titles on public calendar while keeping full fidelity for administrators."),
        ("Security Gate for Non-Faculty Accounts",
         "Preventing arbitrary self-registered users from creating hall bookings without administrative clearance.",
         "Enforced strict account gating: Newly registered accounts start in INACTIVE state. Booking endpoints strictly enforce FACULTY or ADMIN role validation with 403 Forbidden protection.")
    ]

    for c_idx, (title, problem, solution) in enumerate(challenges):
        y = Inches(1.5 + c_idx * 1.35)
        card = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), y, Inches(11.733), Inches(1.22))
        card.fill.solid()
        card.fill.fore_color.rgb = WHITE
        card.line.color.rgb = SLATE_BORDER
        card.line.width = Pt(1.0)

        # Title
        tb_t = slide7.shapes.add_textbox(Inches(1.0), y + Inches(0.08), Inches(11.3), Inches(0.35))
        p_t = tb_t.text_frame.paragraphs[0]
        p_t.text = f"⚙️ {title}"
        p_t.font.size = Pt(13)
        p_t.font.bold = True
        p_t.font.color.rgb = NAVY_PRIMARY

        # Challenge vs Solution text
        tb_d = slide7.shapes.add_textbox(Inches(1.0), y + Inches(0.42), Inches(11.3), Inches(0.72))
        tf_d = tb_d.text_frame
        tf_d.word_wrap = True

        p_prob = tf_d.paragraphs[0]
        p_prob.text = f"• Challenge: {problem}"
        p_prob.font.size = Pt(10.5)
        p_prob.font.color.rgb = RGBColor(220, 38, 38) # red

        p_sol = tf_d.add_paragraph()
        p_sol.text = f"• Solution: {solution}"
        p_sol.font.size = Pt(10.5)
        p_sol.font.color.rgb = RGBColor(22, 101, 52) # green

    # ==========================================
    # SLIDE 8: Live Features & System Capabilities
    # ==========================================
    slide8 = prs.slides.add_slide(blank_layout)
    add_header(slide8, "Live Features & System Capabilities", "Module Highlights")

    feats = [
        ("Public Portal & Events", "Responsive campus homepage, hall gallery with amenities checklist, and upcoming approved university symposiums.", "🌐"),
        ("Live Desk Calendar", "Dynamic calendar supporting Month, Week, and List views with instant slot availability color indicators.", "📆"),
        ("Smart Booking Requisition", "Full-day, Morning, Afternoon, or Custom hours selector with HOD permission letter PDF upload.", "📝"),
        ("Admin Control Center", "Booking management with 1-click approvals, rejections, faculty remark notices, and permanent deletion.", "🛡️"),
        ("Blackout & Holiday Desk", "Estate manager tools to block dates for Semester Examinations, NAAC Audits, or Facility Maintenance.", "🚫"),
        ("Official PDF Gate Pass", "jsPDF vector confirmation slip featuring official college logo, dean signature line, and offline scannable QR.", "🎫")
    ]

    for f_idx, (f_title, f_desc, f_icon) in enumerate(feats):
        col = f_idx % 3
        row = f_idx // 3
        fx = Inches(0.8 + col * 4.0)
        fy = Inches(1.6 + row * 2.6)

        fcard = slide8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, fx, fy, Inches(3.75), Inches(2.35))
        fcard.fill.solid()
        fcard.fill.fore_color.rgb = WHITE
        fcard.line.color.rgb = SLATE_BORDER
        fcard.line.width = Pt(1.2)

        # Top bar
        tbar = slide8.shapes.add_shape(MSO_SHAPE.RECTANGLE, fx, fy, Inches(3.75), Inches(0.4))
        tbar.fill.solid()
        tbar.fill.fore_color.rgb = NAVY_PRIMARY
        tbar.line.fill.background()

        tb = slide8.shapes.add_textbox(fx + Inches(0.2), fy + Inches(0.5), Inches(3.35), Inches(1.7))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = f"{f_icon}  {f_title}"
        p1.font.size = Pt(14)
        p1.font.bold = True
        p1.font.color.rgb = NAVY_DARK

        p2 = tf.add_paragraph()
        p2.space_before = Pt(8)
        p2.text = f_desc
        p2.font.size = Pt(11)
        p2.font.color.rgb = TEXT_MUTED

    # ==========================================
    # SLIDE 9: Future Scope & Roadmap
    # ==========================================
    slide9 = prs.slides.add_slide(blank_layout)
    add_header(slide9, "Future Scope & Technology Roadmap", "Future Roadmap")

    future_items = [
        ("Mobile QR Attendance Scanner App", "Dedicated mobile scanner app for security guards at the auditorium gate to check attendees & gate passes.", "📱"),
        ("WhatsApp & SMS Dispatch (Twilio / Gupshup)", "Instant SMS updates and WhatsApp notifications for faculty whenever a booking status changes.", "💬"),
        ("Hierarchical Multi-Tier Approval Chain", "Multi-stage workflow: Department HOD recommendation ➔ Dean verification ➔ Principal final sanction.", "🏢"),
        ("AV Equipment & Mic Pre-Flight Checklist", "Digital checklist for hall technicians (microphones, HDMI cables, podium projectors, acoustic setup).", "🎙️"),
        ("Real-Time WebSockets Synchronization", "Instant multi-user calendar desk refresh using Socket.io without manual browser page reloading.", "⚡")
    ]

    for idx, (title, desc, icon) in enumerate(future_items):
        y = Inches(1.5 + idx * 1.1)
        card = slide9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), y, Inches(11.733), Inches(0.95))
        card.fill.solid()
        card.fill.fore_color.rgb = WHITE
        card.line.color.rgb = SLATE_BORDER
        card.line.width = Pt(1)

        bbar = slide9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), y, Inches(0.16), Inches(0.95))
        bbar.fill.solid()
        bbar.fill.fore_color.rgb = GOLD_ACCENT
        bbar.line.fill.background()

        tb = slide9.shapes.add_textbox(Inches(1.2), y + Inches(0.12), Inches(11.0), Inches(0.75))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = f"{icon}  {title} — "
        p1.font.size = Pt(14)
        p1.font.bold = True
        p1.font.color.rgb = NAVY_PRIMARY

        run = p1.add_run()
        run.text = desc
        run.font.size = Pt(12)
        run.font.color.rgb = TEXT_MAIN

    # ==========================================
    # SLIDE 10: Conclusion & Q&A (Dark Theme)
    # ==========================================
    slide10 = prs.slides.add_slide(blank_layout)
    bg10 = slide10.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg10.fill.solid()
    bg10.fill.fore_color.rgb = NAVY_DARK
    bg10.line.fill.background()

    card10 = slide10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(1.0), Inches(10.933), Inches(5.5))
    card10.fill.solid()
    card10.fill.fore_color.rgb = RGBColor(30, 41, 59)
    card10.line.color.rgb = RGBColor(51, 65, 85)
    card10.line.width = Pt(1.5)

    tb_c = slide10.shapes.add_textbox(Inches(1.8), Inches(1.5), Inches(9.733), Inches(4.5))
    tf_c = tb_c.text_frame
    tf_c.word_wrap = True

    p_c1 = tf_c.paragraphs[0]
    p_c1.text = "CONCLUSION & SUMMARY"
    p_c1.font.size = Pt(14)
    p_c1.font.bold = True
    p_c1.font.color.rgb = GOLD_ACCENT
    p_c1.alignment = PP_ALIGN.CENTER

    p_c2 = tf_c.add_paragraph()
    p_c2.space_before = Pt(16)
    p_c2.text = "Successfully Transitioned from Manual Paper Registers to an Enterprise-Grade Digital Ecosystem"
    p_c2.font.size = Pt(22)
    p_c2.font.bold = True
    p_c2.font.color.rgb = WHITE
    p_c2.alignment = PP_ALIGN.CENTER

    p_c3 = tf_c.add_paragraph()
    p_c3.space_before = Pt(16)
    p_c3.text = "• Eliminates 100% of double-booking race conditions through atomic transactions\n• Saves administrative hours with automated PDF vouchers and instant QR verification\n• Enhances campus transparency while preserving strict examination confidentiality"
    p_c3.font.size = Pt(13)
    p_c3.font.color.rgb = RGBColor(203, 213, 225)

    p_c4 = tf_c.add_paragraph()
    p_c4.space_before = Pt(28)
    p_c4.text = "Thank You! We Are Now Open for Questions (Q&A)"
    p_c4.font.size = Pt(18)
    p_c4.font.bold = True
    p_c4.font.color.rgb = GOLD_ACCENT
    p_c4.alignment = PP_ALIGN.CENTER

    output_file = 'e:/hk/Campus_Facility_Reservation_System_Presentation.pptx'
    prs.save(output_file)
    print(f"Presentation generated successfully at: {output_file}")

if __name__ == '__main__':
    create_presentation()
