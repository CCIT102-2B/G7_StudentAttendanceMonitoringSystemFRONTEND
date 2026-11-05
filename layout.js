
/*
===========================================
ATTENDTRACK - FAITH COLLEGES
Shared Dashboard Layout
===========================================
*/

(() => {
    "use strict";

    const page =
        window.location.pathname.split("/").pop() ||
        "dashboard.html";

    // Do not create duplicate layouts.
    if (document.querySelector("#at-sidebar")) {
        return;
    }

    // =====================================
    // NAVIGATION
    // =====================================

    const navigation = [
        {
            title: "OVERVIEW",
            links: [
                ["dashboard.html", "Dashboard", "▦"]
            ]
        },
        {
            title: "ACADEMIC MANAGEMENT",
            links: [
                ["programs.html", "Programs", "▤"],
                ["academic-years.html", "Academic Years", "▣"],
                ["enrollments.html", "Enrollments", "♧"]
            ]
        },
        {
            title: "ATTENDANCE MANAGEMENT",
            links: [
                ["sessions.html", "Attendance Sessions", "▦"],
                ["rfid-simulator.html", "RFID Simulator", "◉"],
                ["students.html", "Students", "♙"],
                ["attendance.html", "Attendance", "✓"]
            ]
        },
        {
            title: "RECORDS & REPORTS",
            links: [
                ["records.html", "Records", "▤"],
                ["reports.html", "Reports", "▥"]
            ]
        }
    ];

    // =====================================
    // CREATE SIDEBAR
    // =====================================

    const sidebar = document.createElement("aside");

    sidebar.className = "at-sidebar";
    sidebar.id = "at-sidebar";

    const brand = document.createElement("a");

    brand.className = "at-brand";
    brand.href = "dashboard.html";

    brand.innerHTML = `
        <img
            src="images/faith-crest.png"
            alt="FAITH Colleges Crest"
        >

        <span>
            <strong>AttendTrack</strong>
            <small>
                Student Attendance<br>
                Monitoring System
            </small>
        </span>
    `;

    sidebar.appendChild(brand);

    const nav = document.createElement("nav");
    nav.setAttribute("aria-label", "Main navigation");

    navigation.forEach(section => {

        const group = document.createElement("div");
        group.className = "at-nav-group";

        const label = document.createElement("div");
        label.className = "at-nav-label";
        label.textContent = section.title;

        group.appendChild(label);

        section.links.forEach(([href, title, symbol]) => {

            const link = document.createElement("a");

            link.href = href;

            if (page === href) {
                link.classList.add("active");
                link.setAttribute("aria-current", "page");
            }

            const icon = document.createElement("span");
            icon.className = "at-nav-icon";
            icon.setAttribute("aria-hidden", "true");
            icon.textContent = symbol;

            const text = document.createElement("span");
            text.textContent = title;

            link.append(icon, text);

            group.appendChild(link);
        });

        nav.appendChild(group);
    });

    sidebar.appendChild(nav);

    const sidebarFooter = document.createElement("div");
    sidebarFooter.className = "at-sidebar-footer";

    sidebarFooter.innerHTML = `
        <span class="at-dot"></span>
        FAITH Colleges · AttendTrack
    `;

    sidebar.appendChild(sidebarFooter);

    document.body.prepend(sidebar);
    document.body.classList.add("at-app");

    // =====================================
    // REMOVE OLD NAVIGATION
    // =====================================

    document
        .querySelectorAll(".dashboard-navbar")
        .forEach(element => element.remove());

    document
        .querySelectorAll(
            'body > div[style*="padding:10px 4%"], ' +
            'body > div[style*="padding: 10px 4%"], ' +
            '.wrap > .nav'
        )
        .forEach(element => element.remove());

    // =====================================
    // TOP NAVIGATION
    // =====================================

    const topbar = document.createElement("header");
    topbar.className = "at-topbar";

    const menuButton = document.createElement("button");

    menuButton.type = "button";
    menuButton.className = "at-menu-toggle";
    menuButton.setAttribute("aria-label", "Toggle menu");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-controls", "at-sidebar");
    menuButton.textContent = "☰";

    const topTitle = document.createElement("div");
    topTitle.className = "at-top-title";

    topTitle.innerHTML = `
        <span class="at-top-kicker">
            FAITH COLLEGES
        </span>

        <strong>
            Student Attendance Monitoring System
        </strong>
    `;

    const actions = document.createElement("div");
    actions.className = "at-top-actions";

    const status = document.createElement("span");
    status.className = "at-status";

    status.innerHTML = `
        <span class="at-dot"></span>
        System Portal
    `;

    const logoutButton = document.createElement("a");
    logoutButton.className = "at-signout";
    logoutButton.href = "index.html";
    logoutButton.textContent = "Logout";

    actions.append(status, logoutButton);

    topbar.append(menuButton, topTitle, actions);
    sidebar.after(topbar);

    // =====================================
    // MOBILE SIDEBAR
    // =====================================

    function closeMenu() {
        document.body.classList.remove("at-menu-open");

        menuButton.setAttribute(
            "aria-expanded",
            "false"
        );
    }

    menuButton.addEventListener("click", () => {

        const isOpen = document.body.classList.toggle(
            "at-menu-open"
        );

        menuButton.setAttribute(
            "aria-expanded",
            String(isOpen)
        );
    });

    document.addEventListener("click", event => {

        if (event.target.closest(".at-sidebar a")) {
            closeMenu();
        }

        if (
            document.body.classList.contains("at-menu-open") &&
            !event.target.closest(".at-sidebar") &&
            !event.target.closest(".at-menu-toggle")
        ) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeMenu();
        }
    });

    // =====================================
    // PAGE HEADER
    // =====================================

    const pageDetails = {
        "dashboard.html": {
            title: "Dashboard",
            subtitle: "Your campus attendance at a glance."
        },
        "students.html": {
            title: "Student Management",
            subtitle: "Manage student information and academic records."
        },
        "attendance.html": {
            title: "Attendance Management",
            subtitle: "Track class attendance and student check-ins."
        },
        "records.html": {
            title: "Attendance Records",
            subtitle: "Review and manage attendance records."
        },
        "reports.html": {
            title: "Reports & Analytics",
            subtitle: "View attendance summaries and insights."
        },
        "programs.html": {
            title: "Program Management",
            subtitle: "Manage academic programs as your institution grows."
        },
        "academic-years.html": {
            title: "Academic Years",
            subtitle: "Organize school years without losing historical records."
        },
        "enrollments.html": {
            title: "Student Enrollments",
            subtitle: "Keep student enrollments organized."
        },
        "sessions.html": {
            title: "Attendance Sessions",
            subtitle: "Manage attendance for classes and school events."
        },
        "rfid-simulator.html": {
            title: "RFID Attendance Simulator",
            subtitle: "Test RFID attendance without a physical reader."
        }
    };

    const main = document.querySelector("main");

    if (main) {

        main.classList.add("at-main");

        const details = pageDetails[page] || {
            title: "AttendTrack",
            subtitle: "Student Attendance Monitoring System"
        };

        const hero = document.createElement("section");
        hero.className = "at-hero";

        const heroCopy = document.createElement("div");
        heroCopy.className = "at-hero-copy";

        const eyebrow = document.createElement("div");
        eyebrow.className = "at-eyebrow";
        eyebrow.textContent =
            "FAITH COLLEGES · ATTENDTRACK";

        const heading = document.createElement("h2");
        heading.textContent = details.title;

        const subtitle = document.createElement("p");
        subtitle.textContent = details.subtitle;

        heroCopy.append(eyebrow, heading, subtitle);
        hero.appendChild(heroCopy);

        main.prepend(hero);
    }

})();
