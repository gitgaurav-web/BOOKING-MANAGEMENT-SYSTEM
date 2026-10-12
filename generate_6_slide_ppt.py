import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_6_slide_presentation():
    prs = Presentation()
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
    GREEN_ACCENT = RGBColor(16, 185, 129)  # #10B981
    RED_ACCENT = RGBColor(239, 68, 68)     # #EF4444

    logo_path = os.path.abspath('client/public/images/sairam-logo.png')
    seal_path = os.path.abspath('client/public/images/sairam-seal.png')
    blank_layout = prs.slide_layouts[6]

    def add_header(slide, title_text, category="SRI SAIRAM COLLEGE OF ENGINEERING • FACILITY MANAGEMENT"):
        header_shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(1.1))
        header_shape.fill.solid()
        header_shape.fill.fore_color.rgb = NAVY_DARK
        header_shape.line.fill.background()

        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(1.1), Inches(13.333), Inches(0.06))
        line.fill.solid()
        line.fill.fore_color.rgb = GOLD_ACCENT
        line.line.fill.background()

        tb_cat = slide.shapes.add_textbox(Inches(0.8), Inches(0.12), Inches(9.5), Inches(0.3))
        p_cat = tb_cat.text_frame.paragraphs[0]
        p_cat.text = category.upper()
        p_cat.font.size = Pt(9.5)
        p_cat.font.bold = True
        p_cat.font.color.rgb = GOLD_ACCENT

        tb_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.38), Inches(9.5), Inches(0.6))
        p_title = tb_title.text_frame.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(20)
        p_title.font.bold = True
        p_title.font.color.rgb = WHITE

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

    accent1 = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.8), Inches(11.733), Inches(5.9))
    accent1.fill.solid()
    accent1.fill.fore_color.rgb = RGBColor(30, 41, 59)
    accent1.line.color.rgb = RGBColor(51, 65, 85)
    accent1.line.width = Pt(1.5)

    if os.path.exists(logo_path):
        try:
            logo_box = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.3), Inches(1.2), Inches(3.2), Inches(1.1))
            logo_box.fill.solid()
            logo_box.fill.fore_color.rgb = WHITE
            logo_box.line.fill.background()
            slide1.shapes.add_picture(logo_path, Inches(1.4), Inches(1.25), width=Inches(3.0))
        except Exception:
            pass

    tb_inst = slide1.shapes.add_textbox(Inches(1.3), Inches(2.45), Inches(10.5), Inches(0.4))
    p_inst = tb_inst.text_frame.paragraphs[0]
    p_inst.text = "SRI SAIRAM COLLEGE OF ENGINEERING, BENGALURU"
    p_inst.font.size = Pt(13)
    p_inst.font.bold = True
    p_inst.font.color.rgb = GOLD_ACCENT

    tb_title = slide1.shapes.add_textbox(Inches(1.3), Inches(2.85), Inches(10.5), Inches(1.6))
    tf_title = tb_title.text_frame
    tf_title.word_wrap = True
    p_main = tf_title.paragraphs[0]
    p_main.text = "Centralized Seminar Hall &\nCampus Facility Reservation System"
    p_main.font.size = Pt(28)
    p_main.font.bold = True
    p_main.font.color.rgb = WHITE

    tb_sub = slide1.shapes.add_textbox(Inches(1.3), Inches(4.5), Inches(10.5), Inches(0.6))
    p_sub = tb_sub.text_frame.paragraphs[0]
    p_sub.text = "An Enterprise-grade, Concurrency-safe Web Platform with Multi-tier Approvals & Dynamic Privacy"
    p_sub.font.size = Pt(13)
    p_sub.font.color.rgb = RGBColor(148, 163, 184)

    div1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.3), Inches(5.15), Inches(10.7), Inches(0.04))
    div1.fill.solid()
    div1.fill.fore_color.rgb = GOLD_ACCENT
    div1.line.fill.background()

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
    # SLIDE 2: Problem Statement vs. Proposed Solution
    # ==========================================
    slide2 = prs.slides.add_slide(blank_layout)
    add_header(slide2, "Problem Statement vs. Proposed Solution", "Executive Problem & Objective")

    # Left Column: Problems
    col1 = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.4))
    col1.fill.solid()
    col1.fill.fore_color.rgb = WHITE
    col1.line.color.rgb = SLATE_BORDER
    col1.line.width = Pt(1.2)

    hdr1 = slide2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.5), Inches(5.7), Inches(0.65))
    hdr1.fill.solid()
    hdr1.fill.fore_color.rgb = RED_ACCENT
    hdr1.line.fill.background()

    tb_h1 = slide2.shapes.add_textbox(Inches(0.8), Inches(1.6), Inches(5.7), Inches(0.45))
    p_h1 = tb_h1.text_frame.paragraphs[0]
    p_h1.text = "⚠️ THE MANUAL BOTTLENECK (EXISTING ISSUES)"
    p_h1.font.size = Pt(12)
    p_h1.font.bold = True
    p_h1.font.color.rgb = WHITE
    p_h1.alignment = PP_ALIGN.CENTER

    tb_p_list = slide2.shapes.add_textbox(Inches(1.0), Inches(2.3), Inches(5.3), Inches(4.4))
    tf_p = tb_p_list.text_frame
    tf_p.word_wrap = True

    problems = [
        ("Physical Registers & Lost Paperwork", "Manual paper logs suffer from illegible entries, lost slips, and zero centralized traceability across academic blocks."),
        ("Double-Booking Race Conditions", "Simultaneous verbal or paper requests for the same hall trigger catastrophic scheduling clashes during campus events."),
        ("Zero Real-Time Schedule Transparency", "Coordinators have no live visibility into university semester examinations, NAAC visits, or ongoing hall maintenance."),
        ("Slow Administrative Sign-Offs", "Faculty coordinators spend hours running physical permission letters between HOD, Estate Officer, and Principal desks.")
    ]
    for idx, (head, body) in enumerate(problems):
        p_item = tf_p.paragraphs[0] if idx == 0 else tf_p.add_paragraph()
        p_item.space_before = Pt(8) if idx > 0 else Pt(0)
        p_item.text = f"❌ {head}"
        p_item.font.size = Pt(11.5)
        p_item.font.bold = True
        p_item.font.color.rgb = NAVY_DARK
        p_desc = tf_p.add_paragraph()
        p_desc.text = f"    {body}"
        p_desc.font.size = Pt(9.5)
        p_desc.font.color.rgb = TEXT_MUTED

    # Right Column: Solutions
    col2 = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.5), Inches(5.7), Inches(5.4))
    col2.fill.solid()
    col2.fill.fore_color.rgb = WHITE
    col2.line.color.rgb = SLATE_BORDER
    col2.line.width = Pt(1.2)

    hdr2 = slide2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.8), Inches(1.5), Inches(5.7), Inches(0.65))
    hdr2.fill.solid()
    hdr2.fill.fore_color.rgb = GREEN_ACCENT
    hdr2.line.fill.background()

    tb_h2 = slide2.shapes.add_textbox(Inches(6.8), Inches(1.6), Inches(5.7), Inches(0.45))
    p_h2 = tb_h2.text_frame.paragraphs[0]
    p_h2.text = "✅ OUR PROPOSED SOLUTION (ENTERPRISE SYSTEM)"
    p_h2.font.size = Pt(12)
    p_h2.font.bold = True
    p_h2.font.color.rgb = WHITE
    p_h2.alignment = PP_ALIGN.CENTER

    tb_s_list = slide2.shapes.add_textbox(Inches(7.0), Inches(2.3), Inches(5.3), Inches(4.4))
    tf_s = tb_s_list.text_frame
    tf_s.word_wrap = True

    solutions = [
        ("Unified Institutional Digital Portal", "One-stop web platform managing Leo Muthu Central Seminar Auditorium & Sir M. Visvesvaraya AV Hall."),
        ("Atomic Concurrency Lock (ACID Guarantee)", "Interactive database transactions (prisma.$transaction) prevent overlapping bookings down to the millisecond."),
        ("Live Interactive Availability Desk Calendar", "Color-coded month, week & list views showing live status: Available, Booked, In-Review, Maintenance, or Holiday."),
        ("Instant Verifiable PDF Gate Passes", "Client-side vector PDF vouchers with scannable offline QR codes, official college seal, and authority sign-off.")
    ]
    for idx, (head, body) in enumerate(solutions):
        p_item = tf_s.paragraphs[0] if idx == 0 else tf_s.add_paragraph()
        p_item.space_before = Pt(8) if idx > 0 else Pt(0)
        p_item.text = f"✔ {head}"
        p_item.font.size = Pt(11.5)
        p_item.font.bold = True
        p_item.font.color.rgb = NAVY_PRIMARY
        p_desc = tf_s.add_paragraph()
        p_desc.text = f"    {body}"
        p_desc.font.size = Pt(9.5)
        p_desc.font.color.rgb = TEXT_MUTED

    # ==========================================
    # SLIDE 3: System Architecture & Technology Stack (HIGH DETAIL)
    # ==========================================
    slide3 = prs.slides.add_slide(blank_layout)
    add_header(slide3, "System Architecture & 3-Tier Technology Stack", "System Architecture & Engineering")

    tiers = [
        ("LAYER 1: CLIENT / PRESENTATION TIER", [
            ("React 18 + TypeScript", "Strict type-safe component design & zero runtime UI crashes"),
            ("Vite Build Tooling", "Sub-second Hot Module Replacement & optimized bundles"),
            ("Tailwind CSS v4 Engine", "Modern collegiate design system with fluid dark/light modes"),
            ("Recharts & Lucide Icons", "Interactive analytics graphs, charts & standardized iconography"),
            ("jsPDF & QR Generation", "Pure client-side vector voucher export with zero server rendering lag")
        ], BLUE_ACCENT),
        ("LAYER 2: APPLICATION & API GATEWAY TIER", [
            ("Node.js & Express (TS)", "Modular RESTful routing architecture for auth, halls, bookings & logs"),
            ("Prisma ORM Engine", "Type-safe database abstraction with ACID transaction guarantees"),
            ("Multer Storage Pipeline", "MIME-type & extension validated uploads for HOD permission letters"),
            ("Nodemailer SMTP Service", "Automated email dispatcher for booking approval/rejection lifecycle"),
            ("Express Rate Limiting", "Brute-force protection & API request throttling on sensitive endpoints")
        ], NAVY_PRIMARY),
        ("LAYER 3: DATA & SECURITY GOVERNANCE TIER", [
            ("SQLite (Dev) / PostgreSQL (Prod)", "Zero-setup SQLite development with production-ready Postgres schema"),
            ("JWT Token Authentication", "Signed cryptographic Bearer tokens with 7-day expiration"),
            ("Salted bcryptjs Hashing", "Secure one-way credential encryption for faculty & admin logins"),
            ("3 Dynamic Privacy Modes", "Auto-masks confidential exam / meeting details from public calendar view"),
            ("Immutable Activity Audit Log", "Logs all approval, cancellation, and deletion events for compliance")
        ], GOLD_ACCENT)
    ]

    for t_idx, (t_title, t_items, t_color) in enumerate(tiers):
        x = Inches(0.8 + t_idx * 4.0)
        card = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Inches(1.5), Inches(3.75), Inches(5.4))
        card.fill.solid()
        card.fill.fore_color.rgb = WHITE
        card.line.color.rgb = SLATE_BORDER
        card.line.width = Pt(1.2)

        chdr = slide3.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, Inches(1.5), Inches(3.75), Inches(0.65))
        chdr.fill.solid()
        chdr.fill.fore_color.rgb = t_color
        chdr.line.fill.background()

        tb_chdr = slide3.shapes.add_textbox(x, Inches(1.58), Inches(3.75), Inches(0.5))
        p_chdr = tb_chdr.text_frame.paragraphs[0]
        p_chdr.text = t_title
        p_chdr.font.size = Pt(11)
        p_chdr.font.bold = True
        p_chdr.font.color.rgb = WHITE
        p_chdr.alignment = PP_ALIGN.CENTER

        tb_tlist = slide3.shapes.add_textbox(x + Inches(0.2), Inches(2.3), Inches(3.35), Inches(4.4))
        tf_tlist = tb_tlist.text_frame
        tf_tlist.word_wrap = True

        for i_idx, (head, sub) in enumerate(t_items):
            p_head = tf_tlist.paragraphs[0] if i_idx == 0 else tf_tlist.add_paragraph()
            p_head.space_before = Pt(8) if i_idx > 0 else Pt(0)
            p_head.text = f"• {head}"
            p_head.font.size = Pt(11)
            p_head.font.bold = True
            p_head.font.color.rgb = NAVY_DARK

            p_sub = tf_tlist.add_paragraph()
            p_sub.text = f"   {sub}"
            p_sub.font.size = Pt(9.5)
            p_sub.font.color.rgb = TEXT_MUTED

    # ==========================================
    # SLIDE 4: End-to-End Workflow Pipeline & RBAC
    # ==========================================
    slide4 = prs.slides.add_slide(blank_layout)
    add_header(slide4, "End-to-End Workflow Pipeline & RBAC Hierarchy", "Process Architecture & Security")

    # Workflow 6-step cards across top
    steps = [
        ("Step 1: Faculty Auth", "Faculty signs in via secure JWT token verification"),
        ("Step 2: Slot & Letter", "Selects auditorium, date range & uploads HOD PDF letter"),
        ("Step 3: Atomic Lock", "Prisma transaction locks slot atomically to prevent clash"),
        ("Step 4: Queue: PENDING", "Notification created & enters admin approval desk"),
        ("Step 5: Admin Review", "Estate Admin / Principal approves or cancels with remarks"),
        ("Step 6: Gate Pass / QR", "Instant vector PDF voucher generated with scannable QR")
    ]

    sw = Inches(1.8)
    for s_idx, (stitle, sdesc) in enumerate(steps):
        sx = Inches(0.7 + s_idx * 2.05)
        scard = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, sx, Inches(1.5), sw, Inches(2.2))
        scard.fill.solid()
        scard.fill.fore_color.rgb = WHITE
        scard.line.color.rgb = BLUE_ACCENT if s_idx == 2 or s_idx == 4 else SLATE_BORDER
        scard.line.width = Pt(1.2)

        pill = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, sx + Inches(0.15), Inches(1.6), sw - Inches(0.3), Inches(0.35))
        pill.fill.solid()
        pill.fill.fore_color.rgb = NAVY_PRIMARY if s_idx != 4 else GOLD_ACCENT
        pill.line.fill.background()

        tb_pill = slide4.shapes.add_textbox(sx + Inches(0.15), Inches(1.62), sw - Inches(0.3), Inches(0.3))
        p_pill = tb_pill.text_frame.paragraphs[0]
        p_pill.text = f"0{s_idx + 1}"
        p_pill.font.size = Pt(9)
        p_pill.font.bold = True
        p_pill.font.color.rgb = WHITE
        p_pill.alignment = PP_ALIGN.CENTER

        tb_s = slide4.shapes.add_textbox(sx + Inches(0.1), Inches(2.0), sw - Inches(0.2), Inches(1.6))
        tf_s = tb_s.text_frame
        tf_s.word_wrap = True

        p_st = tf_s.paragraphs[0]
        p_st.text = stitle
        p_st.font.size = Pt(10.5)
        p_st.font.bold = True
        p_st.font.color.rgb = NAVY_DARK
        p_st.alignment = PP_ALIGN.CENTER

        p_sd = tf_s.add_paragraph()
        p_sd.space_before = Pt(4)
        p_sd.text = sdesc
        p_sd.font.size = Pt(9)
        p_sd.font.color.rgb = TEXT_MUTED
        p_sd.alignment = PP_ALIGN.CENTER

        if s_idx < 5:
            arr = slide4.shapes.add_textbox(sx + sw, Inches(2.3), Inches(0.25), Inches(0.4))
            p_arr = arr.text_frame.paragraphs[0]
            p_arr.text = "➔"
            p_arr.font.size = Pt(14)
            p_arr.font.bold = True
            p_arr.font.color.rgb = GOLD_ACCENT

    # Bottom Half: RBAC Tier Cards
    rbac_tiers = [
        ("PUBLIC VISITOR (READ-ONLY)", "Browse hall gallery, seating capacities, amenities & live availability calendar with automatic event-title privacy masking.", RGBColor(100, 116, 139)),
        ("FACULTY COORDINATOR (BOOKER)", "Create single & multi-day requisitions, upload permission letters, track real-time approval status & download verified PDF pass.", BLUE_ACCENT),
        ("SUPER ADMIN / ESTATE DESK", "Approve/Reject requests with official notes, manage hall amenities, block exam/maintenance blackout dates, manage roles & export CSVs.", NAVY_PRIMARY)
    ]

    for rb_idx, (rbtitle, rbdesc, rbcolor) in enumerate(rbac_tiers):
        rx = Inches(0.8 + rb_idx * 4.0)
        rcard = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, rx, Inches(4.0), Inches(3.75), Inches(2.9))
        rcard.fill.solid()
        rcard.fill.fore_color.rgb = WHITE
        rcard.line.color.rgb = SLATE_BORDER
        rcard.line.width = Pt(1.2)

        rhdr = slide4.shapes.add_shape(MSO_SHAPE.RECTANGLE, rx, Inches(4.0), Inches(3.75), Inches(0.5))
        rhdr.fill.solid()
        rhdr.fill.fore_color.rgb = rbcolor
        rhdr.line.fill.background()

        tb_rhdr = slide4.shapes.add_textbox(rx, Inches(4.06), Inches(3.75), Inches(0.4))
        p_rhdr = tb_rhdr.text_frame.paragraphs[0]
        p_rhdr.text = rbtitle
        p_rhdr.font.size = Pt(10.5)
        p_rhdr.font.bold = True
        p_rhdr.font.color.rgb = WHITE
        p_rhdr.alignment = PP_ALIGN.CENTER

        tb_rb = slide4.shapes.add_textbox(rx + Inches(0.2), Inches(4.6), Inches(3.35), Inches(2.1))
        tf_rb = tb_rb.text_frame
        tf_rb.word_wrap = True
        p_rb = tf_rb.paragraphs[0]
        p_rb.text = rbdesc
        p_rb.font.size = Pt(11)
        p_rb.font.color.rgb = TEXT_MAIN

    # ==========================================
    # SLIDE 5: Key Technical Innovations & Challenges Solved
    # ==========================================
    slide5 = prs.slides.add_slide(blank_layout)
    add_header(slide5, "Key Engineering Challenges & Innovations", "Engineering Challenges Solved")

    innovations = [
        ("The Double-Booking Concurrency Bug (Race Condition)",
         "Challenge: If two coordinators submit requests for the same auditorium at the exact same millisecond, standard asynchronous queries risk issuing duplicate bookings.",
         "Engineered Solution: Leveraged Prisma Interactive Transactions (prisma.$transaction) to enforce atomic conflict checks and lock insertions. Zero double-booking guarantee."),
        ("Timezone Offset Drift (IST Asia/Kolkata UTC+05:30)",
         "Challenge: Built-in JavaScript toISOString() shifts IST midnight back to the previous day's UTC date, corrupting multi-day calendar dates and slot mappings.",
         "Engineered Solution: Developed a custom Local ISO Date Normalizer extracting year, month, and day in strict Asia/Kolkata timezone, ensuring 100% calendar fidelity."),
        ("Campus Confidentiality & Dynamic Privacy Engine",
         "Challenge: University meetings, question paper evaluations, and executive hearings must not expose confidential titles or attendee data on public campus monitors.",
         "Engineered Solution: Architected 3 Dynamic Privacy Modes (EVENT_TITLE, DEPARTMENT_EVENT, RESERVED_SLOT) that automatically mask sensitive metadata on public calendars."),
        ("Tailwind CSS v4 oklch PDF Generation Incompatibility",
         "Challenge: Modern Tailwind v4 computes colors using oklch(), causing legacy html2canvas DOM screenshot parsers to crash with 'Failed to generate PDF'.",
         "Engineered Solution: Replaced raster screenshots with a pure jsPDF vector generation pipeline incorporating embedded college logos, dean seal, and scannable offline QR data.")
    ]

    for inv_idx, (ititle, ichall, isol) in enumerate(innovations):
        iy = Inches(1.5 + inv_idx * 1.35)
        icard = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), iy, Inches(11.733), Inches(1.22))
        icard.fill.solid()
        icard.fill.fore_color.rgb = WHITE
        icard.line.color.rgb = SLATE_BORDER
        icard.line.width = Pt(1.0)

        tb_it = slide5.shapes.add_textbox(Inches(1.0), iy + Inches(0.08), Inches(11.3), Inches(0.35))
        p_it = tb_it.text_frame.paragraphs[0]
        p_it.text = f"⚙️ {ititle}"
        p_it.font.size = Pt(13)
        p_it.font.bold = True
        p_it.font.color.rgb = NAVY_PRIMARY

        tb_id = slide5.shapes.add_textbox(Inches(1.0), iy + Inches(0.42), Inches(11.3), Inches(0.72))
        tf_id = tb_id.text_frame
        tf_id.word_wrap = True

        p_c = tf_id.paragraphs[0]
        p_c.text = f"• Problem: {ichall}"
        p_c.font.size = Pt(10.5)
        p_c.font.color.rgb = RED_ACCENT

        p_s = tf_id.add_paragraph()
        p_s.text = f"• Solution: {isol}"
        p_s.font.size = Pt(10.5)
        p_s.font.color.rgb = GREEN_ACCENT

    # ==========================================
    # SLIDE 6: Production Capabilities, Roadmap & Conclusion
    # ==========================================
    slide6 = prs.slides.add_slide(blank_layout)
    add_header(slide6, "Production Highlights, Future Roadmap & Conclusion", "Summary & Future Scope")

    # Box 1: Delivered Features
    b1 = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.4))
    b1.fill.solid()
    b1.fill.fore_color.rgb = WHITE
    b1.line.color.rgb = SLATE_BORDER
    b1.line.width = Pt(1.2)

    h_b1 = slide6.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.5), Inches(5.7), Inches(0.65))
    h_b1.fill.solid()
    h_b1.fill.fore_color.rgb = NAVY_PRIMARY
    h_b1.line.fill.background()

    tb_hb1 = slide6.shapes.add_textbox(Inches(0.8), Inches(1.6), Inches(5.7), Inches(0.45))
    p_hb1 = tb_hb1.text_frame.paragraphs[0]
    p_hb1.text = "🚀 PRODUCTION CAPABILITIES DELIVERED"
    p_hb1.font.size = Pt(12)
    p_hb1.font.bold = True
    p_hb1.font.color.rgb = WHITE
    p_hb1.alignment = PP_ALIGN.CENTER

    tb_b1_content = slide6.shapes.add_textbox(Inches(1.0), Inches(2.3), Inches(5.3), Inches(4.4))
    tf_b1 = tb_b1_content.text_frame
    tf_b1.word_wrap = True

    delivs = [
        ("Public Venue Showcase", "Comprehensive galleries, seating capacities, and equipment specifications."),
        ("Multi-View Desk Calendar", "Interactive Month, Week, and List availability matrix with slot status indicators."),
        ("Smart Requisition Form", "Single/multi-day date picker with HOD permission letter PDF upload."),
        ("Admin Control Center", "1-click approvals, rejections, custom faculty notice remarks, and date blackouts."),
        ("Verifiable Gate Pass PDF", "Vector PDF confirmation slip with official college logo, dean seal & scannable QR.")
    ]
    for idx, (head, body) in enumerate(delivs):
        p_item = tf_b1.paragraphs[0] if idx == 0 else tf_b1.add_paragraph()
        p_item.space_before = Pt(8) if idx > 0 else Pt(0)
        p_item.text = f"✔ {head}"
        p_item.font.size = Pt(11)
        p_item.font.bold = True
        p_item.font.color.rgb = NAVY_DARK
        p_desc = tf_b1.add_paragraph()
        p_desc.text = f"    {body}"
        p_desc.font.size = Pt(9.5)
        p_desc.font.color.rgb = TEXT_MUTED

    # Box 2: Roadmap & Conclusion
    b2 = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.5), Inches(5.7), Inches(5.4))
    b2.fill.solid()
    b2.fill.fore_color.rgb = WHITE
    b2.line.color.rgb = SLATE_BORDER
    b2.line.width = Pt(1.2)

    h_b2 = slide6.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.8), Inches(1.5), Inches(5.7), Inches(0.65))
    h_b2.fill.solid()
    h_b2.fill.fore_color.rgb = GOLD_ACCENT
    h_b2.line.fill.background()

    tb_hb2 = slide6.shapes.add_textbox(Inches(6.8), Inches(1.6), Inches(5.7), Inches(0.45))
    p_hb2 = tb_hb2.text_frame.paragraphs[0]
    p_hb2.text = "🔮 FUTURE ROADMAP & CONCLUSION"
    p_hb2.font.size = Pt(12)
    p_hb2.font.bold = True
    p_hb2.font.color.rgb = WHITE
    p_hb2.alignment = PP_ALIGN.CENTER

    tb_b2_content = slide6.shapes.add_textbox(Inches(7.0), Inches(2.3), Inches(5.3), Inches(4.4))
    tf_b2 = tb_b2_content.text_frame
    tf_b2.word_wrap = True

    roadmaps = [
        ("Mobile QR Attendance Scanner App", "Dedicated mobile app for security personnel at hall entrances to verify gate passes."),
        ("WhatsApp & SMS Automated Dispatch", "Twilio / Gupshup integration for real-time mobile SMS & WhatsApp booking updates."),
        ("Multi-Tier Hierarchical Approvals", "Multi-stage workflow: Department HOD ➔ Academic Dean ➔ Principal approval."),
        ("Super Admin Automated Monthly Reports", "Scheduled monthly executive booking summary dispatched directly to the Principal's inbox.")
    ]
    for idx, (head, body) in enumerate(roadmaps):
        p_item = tf_b2.paragraphs[0] if idx == 0 else tf_b2.add_paragraph()
        p_item.space_before = Pt(8) if idx > 0 else Pt(0)
        p_item.text = f"⭐ {head}"
        p_item.font.size = Pt(11)
        p_item.font.bold = True
        p_item.font.color.rgb = NAVY_PRIMARY
        p_desc = tf_b2.add_paragraph()
        p_desc.text = f"    {body}"
        p_desc.font.size = Pt(9.5)
        p_desc.font.color.rgb = TEXT_MUTED

    # Bottom Conclusion callout
    p_conc = tf_b2.add_paragraph()
    p_conc.space_before = Pt(14)
    p_conc.text = "🎯 CONCLUSION & Q&A"
    p_conc.font.size = Pt(11.5)
    p_conc.font.bold = True
    p_conc.font.color.rgb = GOLD_ACCENT

    p_conc_desc = tf_b2.add_paragraph()
    p_conc_desc.text = "Successfully replaced error-prone paper logbooks with a secure, concurrency-safe, institutional digital reservation ecosystem. Thank you! We are open to questions."
    p_conc_desc.font.size = Pt(10)
    p_conc_desc.font.color.rgb = NAVY_DARK

    out_root = 'e:/hk/Campus_Facility_Reservation_System_Presentation.pptx'
    out_public = 'e:/hk/client/public/Campus_Facility_Reservation_System_Presentation.pptx'
    prs.save(out_root)
    prs.save(out_public)
    print(f"6-Slide Presentation created at:\n1. {out_root}\n2. {out_public}")

if __name__ == '__main__':
    create_6_slide_presentation()
