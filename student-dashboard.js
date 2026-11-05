
/*
=========================================
ATTENDTRACK - STUDENT DASHBOARD
Statistics, Search and Filtering
=========================================
*/

document.addEventListener("DOMContentLoaded", () => {

    const totalElement =
        document.getElementById("atTotalStudents");

    const activeElement =
        document.getElementById("atActiveStudents");

    const inactiveElement =
        document.getElementById("atInactiveStudents");

    const programsElement =
        document.getElementById("atProgramsCount");

    const programFilter =
        document.getElementById("atProgramFilter");

    const statusFilter =
        document.getElementById("atStatusFilter");

    const searchInput =
        document.getElementById("studentListSearch");

    const tableBody =
        document.getElementById("studentsListBody");

    const studentCount =
        document.getElementById("atStudentCount");

    const refreshButton =
        document.getElementById("atRefreshStudents");

    if (!tableBody) return;

    let students = [];

    // LOAD STUDENT STATISTICS
    async function loadStatistics() {

        try {
            const studentData = await apiRequest("/students");
            const programData = await apiRequest("/programs");

            students = Array.isArray(studentData)
                ? studentData
                : [];

            const programs = Array.isArray(programData)
                ? programData
                : [];

            totalElement.textContent = students.length;

            activeElement.textContent = students.filter(
                student => student.isActive === true
            ).length;

            inactiveElement.textContent = students.filter(
                student => student.isActive === false
            ).length;

            programsElement.textContent = programs.length;

            // Populate program filter
            const selectedProgram = programFilter.value;

            programFilter.replaceChildren(
                new Option("All Programs", "")
            );

            const programNames = new Set();

            programs.forEach(program => {
                const name =
                    program.programCode ||
                    program.code ||
                    program.name;

                if (name) programNames.add(name);
            });

            [...programNames].sort().forEach(name => {
                programFilter.add(new Option(name, name));
            });

            programFilter.value = selectedProgram;

            applyFilters();

        } catch (error) {
            console.error("Unable to load statistics:", error);

            [totalElement, activeElement,
             inactiveElement, programsElement]
                .forEach(element => {
                    if (element) element.textContent = "—";
                });
        }
    }

    // FILTER EXISTING TABLE ROWS
    function applyFilters() {

        const search = searchInput.value
            .trim()
            .toLowerCase();

        const program = programFilter.value
            .trim()
            .toLowerCase();

        const status = statusFilter.value;

        const rows = [...tableBody.querySelectorAll("tr")]
            .filter(row => row.cells.length >= 7);

        let visible = 0;

        rows.forEach(row => {

            const rowText = row.textContent.toLowerCase();

            const rowProgram =
                row.cells[3]?.textContent.trim().toLowerCase() || "";

            const matchesSearch =
                !search || rowText.includes(search);

            const matchesProgram =
                !program || rowProgram === program;

            let matchesStatus = true;

            if (status) {
                const studentId =
                    row.cells[0]?.textContent.trim();

                const student = students.find(
                    item => String(item.studentId) === studentId
                );

                if (student) {
                    matchesStatus = status === "active"
                        ? student.isActive === true
                        : student.isActive === false;
                } else {
                    matchesStatus = false;
                }
            }

            const show =
                matchesSearch &&
                matchesProgram &&
                matchesStatus;

            row.hidden = !show;

            if (show) visible++;
        });

        studentCount.textContent =
            `Showing ${visible} student${visible === 1 ? "" : "s"}`;
    }

    // SEARCH AND FILTER EVENTS
    // Existing app.js may already handle search;
    // this adds filtering without removing its listener.

    searchInput.addEventListener("input", applyFilters);

    programFilter.addEventListener("change", applyFilters);

    statusFilter.addEventListener("change", applyFilters);

    // REFRESH
    refreshButton.addEventListener("click", async () => {

        refreshButton.disabled = true;
        refreshButton.textContent = "Refreshing...";

        try {
            await loadStatistics();

            // Existing app.js may expose this function.
            if (typeof window.loadStudents === "function") {
                await window.loadStudents();
            }

            applyFilters();

        } finally {
            refreshButton.disabled = false;
            refreshButton.textContent = "↻ Refresh";
        }
    });

    // Watch for updates made by existing app.js.
    const observer = new MutationObserver(() => {
        applyFilters();
    });

    observer.observe(tableBody, {
        childList: true
    });

    loadStatistics();
});
