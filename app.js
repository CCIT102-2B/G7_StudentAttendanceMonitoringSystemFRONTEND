const API_URL = "http://localhost:5035/api";

// ==========================================
// AUTHENTICATION AND PAGE ACCESS
// ==========================================

const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");

function clearAuthSession() {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("student");
    sessionStorage.removeItem("teacher");
    sessionStorage.removeItem("demoAccess");
}

function enforcePageAccess() {
    const currentPage = window.location.pathname.split("/").pop().toLowerCase();
    const publicPages = ["", "index.html"];
    const accessToken = sessionStorage.getItem("accessToken");

    if (!publicPages.includes(currentPage) && !accessToken) {
        window.location.replace("index.html");
        return false;
    }

    document.querySelectorAll(".dashboard-logout").forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();
            clearAuthSession();
            window.location.replace("index.html");
        });
    });

    return true;
}

const pageAllowed = enforcePageAccess();

// ==========================================
// API FETCH
// ==========================================

async function apiFetch(url, options = {}) {
    const headers = new Headers(options.headers || {});
    const accessToken = sessionStorage.getItem("accessToken");

    if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }

    return await fetch(url, { ...options, headers });
}

// ==========================================
// API RESPONSE HANDLER
// ==========================================

async function readApiResponse(response) {
    const responseText = await response.text();

    if (!responseText) return {};

    try {
        const data = JSON.parse(responseText);

        const validationMessage = data.errors
            ? Object.values(data.errors).flat()[0]
            : null;

        return {
            ...data,
            message: data.message || data.detail || validationMessage || data.title
        };
    } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;

        return {
            message: responseText.trim().split(/\r?\n/, 1)[0] ||
                `The server returned HTTP ${response.status}.`
        };
    }
}

// ==========================================
// LOGIN FORM - API AUTHENTICATION
// ==========================================

if (loginForm) {
    const loginMessage = document.getElementById("loginMessage");

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (loginMessage) loginMessage.textContent = "";

        if (!loginForm.checkValidity()) {
            loginForm.reportValidity();
            return;
        }

        const emailInput =
            document.getElementById("loginEmail") ||
            document.getElementById("teacherEmail");

        const email = emailInput?.value.trim();
        const password = document.getElementById("password")?.value;

        if (!email || !password) {
            showMessage(
                loginMessage,
                "Please enter your email and password.",
                "error"
            );
            return;
        }

        const submitButton = loginForm.querySelector(
            'button[type="submit"], input[type="submit"]'
        );

        if (submitButton) submitButton.disabled = true;

        try {
            const response = await fetch(`${API_URL}/Users/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    accountType: "User",
                    email,
                    password
                })
            });

            const data = await readApiResponse(response);

            if (!response.ok) {
                throw new Error(data.message || "Login failed.");
            }

            if (!data.accessToken) {
                throw new Error("The server did not return an access token.");
            }

            sessionStorage.setItem("accessToken", data.accessToken);
            sessionStorage.setItem("role", data.role || "User");
            sessionStorage.setItem("user", JSON.stringify(data.user || {}));

            window.location.href = "dashboard.html";

        } catch (error) {
            showMessage(
                loginMessage,
                error.message || "Unable to connect to the server.",
                "error"
            );
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}

// ==========================================
// REGISTER FORM - API REGISTRATION
// ==========================================

if (registerForm) {
    const registerMessage = document.getElementById("registerMessage");

    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (registerMessage) registerMessage.textContent = "";

        if (!registerForm.checkValidity()) {
            registerForm.reportValidity();
            return;
        }

        const fullName =
            document.getElementById("registerUsername")?.value.trim();

        const email =
            document.getElementById("registerEmail")?.value.trim();

        const password =
            document.getElementById("registerPassword")?.value;

        if (!fullName || !email || !password) {
            showMessage(
                registerMessage,
                "Please complete all registration fields.",
                "error"
            );
            return;
        }

        const submitButton = registerForm.querySelector(
            'button[type="submit"], input[type="submit"]'
        );

        if (submitButton) submitButton.disabled = true;

        try {
            const response = await fetch(`${API_URL}/Users/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    fullName,
                    email,
                    password
                })
            });

            const data = await readApiResponse(response);

            if (!response.ok) {
                throw new Error(data.message || "Registration failed.");
            }

            registerForm.reset();

            const loginEmailInput =
                document.getElementById("loginEmail") ||
                document.getElementById("teacherEmail");

            if (loginEmailInput) {
                loginEmailInput.value = email;
            }

            document.getElementById("showLogin")?.click();

            showMessage(
                document.getElementById("loginMessage"),
                data.message || "Account created successfully. Please log in.",
                "success"
            );

        } catch (error) {
            showMessage(
                registerMessage,
                error.message || "Unable to connect to the server.",
                "error"
            );
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}

// ==========================================
// COMMON FUNCTIONS
// ==========================================

function showMessage(element, message, type = "success") {
    if (!element) return;

    element.textContent = message;
    element.className = `message ${type}`;
}

function formatDate(dateValue) {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function formatTime(timeValue) {
    if (!timeValue) return "—";

    const parts = String(timeValue).split(":");

    if (parts.length < 2) return timeValue;

    let hours = Number(parts[0]);
    const minutes = parts[1];
    const period = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;

    return `${hours}:${minutes} ${period}`;
}

function getTodayDate() {
    const today = new Date();

    return [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getStudentFullName(student) {
    return `${student.firstName || ""} ${student.lastName || ""}`.trim();
}

function getStatusClass(status) {
    const normalizedStatus = String(status || "").toLowerCase();

    if (normalizedStatus === "present") return "present";
    if (normalizedStatus === "late") return "late";
    if (normalizedStatus === "absent") return "absent";

    return "";
}

// ==========================================
// STUDENTS API FUNCTIONS
// ==========================================

async function getStudents() {
    const response = await apiFetch(`${API_URL}/Students`);

    if (!response.ok) {
        const error = await readApiResponse(response);
        throw new Error(error.message || "Failed to load students.");
    }

    return await response.json();
}

async function getStudentById(id) {
    const response = await apiFetch(`${API_URL}/Students/${id}`);

    if (!response.ok) {
        const error = await readApiResponse(response);
        throw new Error(error.message || "Failed to load student.");
    }

    return await response.json();
}

async function createStudent(studentData) {
    const response = await apiFetch(`${API_URL}/Students`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(studentData)
    });

    const data = await readApiResponse(response);

    if (!response.ok) {
        throw new Error(data.message || "Failed to add student.");
    }

    return data;
}

async function updateStudent(id, studentData) {
    const response = await apiFetch(`${API_URL}/Students/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(studentData)
    });

    const data = await readApiResponse(response);

    if (!response.ok) {
        throw new Error(data.message || "Failed to update student.");
    }

    return data;
}

async function deleteStudent(id) {
    const response = await apiFetch(`${API_URL}/Students/${id}`, {
        method: "DELETE"
    });

    const data = await readApiResponse(response);

    if (!response.ok) {
        throw new Error(data.message || "Failed to delete student.");
    }

    return data;
}

// ==========================================
// ATTENDANCE API FUNCTIONS
// ==========================================

async function getAttendanceRecords() {
    const response = await apiFetch(`${API_URL}/Attendance`);

    if (!response.ok) {
        const error = await readApiResponse(response);
        throw new Error(error.message || "Failed to load attendance records.");
    }

    return await response.json();
}

async function createAttendance(attendanceData) {
    const response = await apiFetch(`${API_URL}/Attendance`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(attendanceData)
    });

    const data = await readApiResponse(response);

    if (!response.ok) {
        throw new Error(data.message || "Failed to save attendance.");
    }

    return data;
}

async function updateAttendance(id, attendanceData) {
    const response = await apiFetch(`${API_URL}/Attendance/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(attendanceData)
    });

    const data = await readApiResponse(response);

    if (!response.ok) {
        throw new Error(data.message || "Failed to update attendance.");
    }

    return data;
}

async function deleteAttendance(id) {
    const response = await apiFetch(`${API_URL}/Attendance/${id}`, {
        method: "DELETE"
    });

    const data = await readApiResponse(response);

    if (!response.ok) {
        throw new Error(data.message || "Failed to delete attendance.");
    }

    return data;
}

// ==========================================
// PAGE INITIALIZATION
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    // ======================================
    // DASHBOARD PAGE
    // ======================================

    const dashboardPage =
        document.querySelector("#dashboardPage") ||
        document.querySelector(".dashboard-page");

    if (dashboardPage) {
        loadDashboard();
    }

    async function loadDashboard() {
        try {
            const students = await getStudents();
            const attendanceRecords = await getAttendanceRecords();

            const totalStudents =
                document.getElementById("totalStudents");

            const totalAttendance =
                document.getElementById("totalAttendance");

            const presentCount =
                document.getElementById("presentCount");

            const absentCount =
                document.getElementById("absentCount");

            if (totalStudents) {
                totalStudents.textContent = students.length;
            }

            if (totalAttendance) {
                totalAttendance.textContent = attendanceRecords.length;
            }

            const today = getTodayDate();

            const todayRecords = attendanceRecords.filter(record =>
                String(record.attendanceDate || "").startsWith(today)
            );

            if (presentCount) {
                presentCount.textContent = todayRecords.filter(record =>
                    record.status?.toLowerCase() === "present"
                ).length;
            }

            if (absentCount) {
                absentCount.textContent = todayRecords.filter(record =>
                    record.status?.toLowerCase() === "absent"
                ).length;
            }

        } catch (error) {
            console.error("Dashboard error:", error);
        }
    }

    
    // ======================================
    // STUDENTS PAGE
    // ======================================

    const studentsListBody =
        document.getElementById("studentsListBody");

    const studentForm =
        document.getElementById("addStudentForm");

    const studentModal =
        document.getElementById("studentModal");

    const addStudentBtn =
        document.getElementById("addStudentBtn");

    const closeStudentModal =
        document.getElementById("closeStudentModal");

    const cancelStudentBtn =
        document.getElementById("cancelStudentBtn");

    const studentMessage =
        document.getElementById("studentFormMessage");

    const studentsMessage =
        document.getElementById("studentsMessage");

    const studentSearch =
        document.getElementById("studentListSearch");

    const saveStudentBtn =
        document.getElementById("saveStudentBtn");

    let editingStudentId = null;
    let allStudents = [];

    // LOAD STUDENTS FROM API
    async function loadStudents() {
        if (!studentsListBody) return;

        try {
            allStudents = await getStudents();
            renderStudents(allStudents);

            if (studentsMessage) {
                studentsMessage.textContent = "";
            }

            console.log("Students loaded:", allStudents.length);

        } catch (error) {
            console.error("Students loading error:", error);

            studentsListBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        ${escapeHtml(error.message)}
                    </td>
                </tr>
            `;

            if (studentsMessage) {
                studentsMessage.textContent =
                    "Unable to load student records.";
            }
        }
    }

    // DISPLAY STUDENTS IN TABLE
    function renderStudents(students) {
        if (!studentsListBody) return;

        studentsListBody.innerHTML = "";

        if (!students.length) {
            studentsListBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        No student records available.
                    </td>
                </tr>
            `;
            return;
        }

        students.forEach(student => {
            const row = document.createElement("tr");

            const values = [
                student.studentId,
                getStudentFullName(student),
                student.email || "—",
                student.course || "—",
                student.yearLevel || "—",
                student.section || "—"
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "—";
                row.appendChild(cell);
            });

            const actionsCell = document.createElement("td");

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.textContent = "Edit";
            editButton.className = "edit-student-btn";
            editButton.dataset.id = student.id;

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.textContent = "Delete";
            deleteButton.className = "delete-student-btn";
            deleteButton.dataset.id = student.id;

            actionsCell.append(editButton, deleteButton);
            row.appendChild(actionsCell);

            studentsListBody.appendChild(row);
        });
    }

    // SEARCH STUDENTS
    if (studentSearch) {
        studentSearch.addEventListener("input", function () {
            const keyword = studentSearch.value
                .trim()
                .toLowerCase();

            const filteredStudents = allStudents.filter(student => {
                const searchableText = [
                    student.studentId,
                    student.firstName,
                    student.lastName,
                    student.email,
                    student.course,
                    student.yearLevel,
                    student.section
                ].join(" ").toLowerCase();

                return searchableText.includes(keyword);
            });

            renderStudents(filteredStudents);
        });
    }

    // OPEN STUDENT MODAL
    function openStudentModal() {
        if (!studentModal) return;

        studentModal.hidden = false;
        studentModal.style.display = "flex";
        studentModal.classList.add("active");
    }

    // CLOSE STUDENT MODAL
    function closeStudentModalWindow() {
        if (!studentModal) return;

        studentModal.classList.remove("active");
        studentModal.style.display = "none";
        studentModal.hidden = true;

        if (studentForm) {
            studentForm.reset();
        }

        editingStudentId = null;

        const modalTitle =
            document.getElementById("studentModalTitle");

        if (modalTitle) {
            modalTitle.textContent = "Add Student";
        }

        if (saveStudentBtn) {
            saveStudentBtn.textContent = "Save Student";
        }

        if (studentMessage) {
            studentMessage.textContent = "";
            studentMessage.className = "";
        }
    }

    // ADD STUDENT BUTTON
    if (addStudentBtn) {
        addStudentBtn.addEventListener("click", function () {
            if (studentForm) studentForm.reset();

            editingStudentId = null;

            const modalTitle =
                document.getElementById("studentModalTitle");

            if (modalTitle) {
                modalTitle.textContent = "Add Student";
            }

            if (saveStudentBtn) {
                saveStudentBtn.textContent = "Save Student";
            }

            if (studentMessage) {
                studentMessage.textContent = "";
            }

            openStudentModal();
        });
    }

    // CLOSE AND CANCEL BUTTONS
    if (closeStudentModal) {
        closeStudentModal.addEventListener(
            "click",
            closeStudentModalWindow
        );
    }

    if (cancelStudentBtn) {
        cancelStudentBtn.addEventListener(
            "click",
            closeStudentModalWindow
        );
    }

    // SAVE OR UPDATE STUDENT
    if (studentForm) {
        studentForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            if (!studentForm.checkValidity()) {
                studentForm.reportValidity();
                return;
            }

            const studentId =
                document.getElementById("newStudentId").value.trim();

            const fullName =
                document.getElementById("newStudentName").value.trim();

            const email =
                document.getElementById("newStudentEmail").value.trim();

            const course =
                document.getElementById("newStudentProgram").value;

            const yearSelect =
                document.getElementById("newStudentYear");

            const yearLevel =
                yearSelect.selectedOptions[0]?.text || "";

            const section =
                document.getElementById("newStudentSection").value.trim();

            // Split full name into first name and last name
            const nameParts = fullName.split(/\s+/);

            if (nameParts.length < 2) {
                showMessage(
                    studentMessage,
                    "Please enter both first name and last name.",
                    "error"
                );
                return;
            }

            if (!course || !yearSelect.value) {
                showMessage(
                    studentMessage,
                    "Please select a program and year level.",
                    "error"
                );
                return;
            }

            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(" ");

            const studentData = {
                studentId,
                firstName,
                lastName,
                email,
                course,
                yearLevel,
                section
            };

            try {
                if (saveStudentBtn) {
                    saveStudentBtn.disabled = true;
                    saveStudentBtn.textContent = "Saving...";
                }

                if (editingStudentId) {
                    await updateStudent(
                        editingStudentId,
                        studentData
                    );

                    showMessage(
                        studentMessage,
                        "Student updated successfully.",
                        "success"
                    );

                } else {
                    await createStudent(studentData);

                    showMessage(
                        studentMessage,
                        "Student added successfully.",
                        "success"
                    );
                }

                await loadStudents();

                setTimeout(() => {
                    closeStudentModalWindow();
                }, 700);

            } catch (error) {
                console.error("Student save error:", error);

                showMessage(
                    studentMessage,
                    error.message || "Unable to save student.",
                    "error"
                );

            } finally {
                if (saveStudentBtn) {
                    saveStudentBtn.disabled = false;
                    saveStudentBtn.textContent =
                        editingStudentId ? "Update Student" : "Save Student";
                }
            }
        });
    }

    // EDIT AND DELETE STUDENTS
    if (studentsListBody) {
        studentsListBody.addEventListener("click", async function (event) {

            const editButton =
                event.target.closest(".edit-student-btn");

            const deleteButton =
                event.target.closest(".delete-student-btn");

            // EDIT STUDENT
            if (editButton) {
                const id = editButton.dataset.id;

                try {
                    const student = await getStudentById(id);

                    editingStudentId = student.id;

                    document.getElementById("newStudentId").value =
                        student.studentId || "";

                    document.getElementById("newStudentName").value =
                        getStudentFullName(student);

                    document.getElementById("newStudentEmail").value =
                        student.email || "";

                    document.getElementById("newStudentProgram").value =
                        student.course || "";

                    const yearSelect =
                        document.getElementById("newStudentYear");

                    const matchingYear = Array.from(
                        yearSelect.options
                    ).find(option =>
                        option.text === student.yearLevel
                    );

                    yearSelect.value = matchingYear
                        ? matchingYear.value
                        : "";

                    document.getElementById("newStudentSection").value =
                        student.section || "";

                    const modalTitle =
                        document.getElementById("studentModalTitle");

                    if (modalTitle) {
                        modalTitle.textContent = "Edit Student";
                    }

                    if (saveStudentBtn) {
                        saveStudentBtn.textContent = "Update Student";
                    }

                    openStudentModal();

                } catch (error) {
                    alert(error.message);
                }
            }

            // DELETE STUDENT
            if (deleteButton) {
                const id = deleteButton.dataset.id;

                if (!confirm("Are you sure you want to delete this student?")) {
                    return;
                }

                try {
                    await deleteStudent(id);
                    await loadStudents();

                    alert("Student deleted successfully.");

                } catch (error) {
                    alert(error.message);
                }
            }
        });
    }

    // INITIAL LOAD
    if (studentsListBody) {
        loadStudents();
    }

    // ======================================
    // ATTENDANCE PAGE
    // ======================================
        const attendanceTableBody =
        document.getElementById("attendanceTableBody");

    const attendanceDate =
        document.getElementById("attendanceDate");

    const saveAttendanceBtn =
        document.getElementById("saveAttendanceBtn");

    if (attendanceTableBody && attendanceDate && saveAttendanceBtn) {
        const today = new Date();

        attendanceDate.value =
            `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

        async function loadAttendanceStudents() {
            try {
                const students = await getStudents();
                const records = await getAttendanceRecords();

                attendanceTableBody.innerHTML = "";

                if (!students.length) {
                    attendanceTableBody.innerHTML = `
                        <tr>
                            <td colspan="7">No students found.</td>
                        </tr>
                    `;
                    return;
                }

                students.forEach(student => {
                    const existingRecord = records.find(record =>
                        Number(record.studentId) === Number(student.id) &&
                        String(record.attendanceDate || "").startsWith(attendanceDate.value)
                    );

                    const row = document.createElement("tr");

                    row.dataset.studentId = student.id;
                    row.dataset.attendanceId = existingRecord?.id || "";

                    row.innerHTML = `
                        <td>${escapeHtml(student.studentId)}</td>
                        <td>${escapeHtml(getStudentFullName(student))}</td>
                        <td>${escapeHtml(student.course || "—")}</td>
                        <td>${escapeHtml(student.section || "—")}</td>
                        <td>
                            <input type="time" class="time-in"
                                value="${existingRecord?.timeIn || ""}">
                        </td>
                        <td>
                            <input type="time" class="time-out"
                                value="${existingRecord?.timeOut || ""}">
                        </td>
                        <td>
                            <select class="attendance-status">
                                <option value="">Select Status</option>
                                <option value="Present"
                                    ${existingRecord?.status === "Present" ? "selected" : ""}>
                                    Present
                                </option>
                                <option value="Late"
                                    ${existingRecord?.status === "Late" ? "selected" : ""}>
                                    Late
                                </option>
                                <option value="Absent"
                                    ${existingRecord?.status === "Absent" ? "selected" : ""}>
                                    Absent
                                </option>
                            </select>
                        </td>
                    `;

                    attendanceTableBody.appendChild(row);
                });

            } catch (error) {
                console.error("Attendance loading error:", error);

                attendanceTableBody.innerHTML = `
                    <tr>
                        <td colspan="7">${escapeHtml(error.message)}</td>
                    </tr>
                `;
            }
        }

        attendanceDate.addEventListener("change", loadAttendanceStudents);

        saveAttendanceBtn.addEventListener("click", async function () {
            const rows = [
                ...attendanceTableBody.querySelectorAll("tr[data-student-id]")
            ];

            if (!rows.length) {
                alert("There are no students to save.");
                return;
            }

            saveAttendanceBtn.disabled = true;

            try {
                for (const row of rows) {
                    const studentId = Number(row.dataset.studentId);
                    const attendanceId = row.dataset.attendanceId;

                    const timeIn =
                        row.querySelector(".time-in")?.value || null;

                    const timeOut =
                        row.querySelector(".time-out")?.value || null;

                    const status =
                        row.querySelector(".attendance-status")?.value;

                    if (!status) {
                        throw new Error(
                            "Please select an attendance status for every student."
                        );
                    }

                    if (status !== "Absent" && !timeIn) {
                        throw new Error(
                            "Please enter Time In for students marked Present or Late."
                        );
                    }

                    if (timeIn && timeOut && timeOut < timeIn) {
                        throw new Error(
                            "Time Out cannot be earlier than Time In."
                        );
                    }

                    const attendanceData = {
                        studentId: studentId,
                        attendanceDate: attendanceDate.value,
                        timeIn: status === "Absent" ? null : timeIn,
                        timeOut: status === "Absent" ? null : timeOut,
                        status: status
                    };

                    if (attendanceId) {
                        await updateAttendance(attendanceId, attendanceData);
                    } else {
                        await createAttendance(attendanceData);
                    }
                }

                alert("Attendance saved successfully.");
                await loadAttendanceStudents();

            } catch (error) {
                alert(error.message);

            } finally {
                saveAttendanceBtn.disabled = false;
            }
        });

        loadAttendanceStudents();
    }

    // ======================================
    // RECORDS PAGE
    // ======================================

    const recordsTableBody =
        document.getElementById("recordsTableBody");

    const recordsDateFilter =
        document.getElementById("recordsDateFilter");

    const recordsStatusFilter =
        document.getElementById("recordsStatusFilter");

    if (recordsTableBody) {
        loadRecords();
    }

    async function loadRecords() {
        try {
            const [students, attendanceRecords] = await Promise.all([
                getStudents(),
                getAttendanceRecords()
            ]);

            const dateFilter = recordsDateFilter?.value || "";
            const statusFilter = recordsStatusFilter?.value || "";

            let filteredRecords = attendanceRecords;

            if (dateFilter) {
                filteredRecords = filteredRecords.filter(record =>
                    String(record.attendanceDate).startsWith(dateFilter)
                );
            }

            if (statusFilter) {
                filteredRecords = filteredRecords.filter(record =>
                    record.status?.toLowerCase() === statusFilter.toLowerCase()
                );
            }

            recordsTableBody.innerHTML = "";

            if (!filteredRecords.length) {
                recordsTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="empty-state">
                            No attendance records found.
                        </td>
                    </tr>
                `;
                return;
            }

            filteredRecords.sort((a, b) =>
                new Date(b.attendanceDate) - new Date(a.attendanceDate)
            );

            filteredRecords.forEach(record => {
                const student = students.find(item =>
                    Number(item.id) === Number(record.studentId)
                );

                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>${formatDate(record.attendanceDate)}</td>
                    <td>${escapeHtml(student?.studentId || "—")}</td>
                    <td>${escapeHtml(
                        student ? getStudentFullName(student) : "Unknown Student"
                    )}</td>
                    <td>${formatTime(record.timeIn)}</td>
                    <td>${formatTime(record.timeOut)}</td>
                    <td>
                        <span class="status-badge ${getStatusClass(record.status)}">
                            ${escapeHtml(record.status || "—")}
                        </span>
                    </td>
                    <td>
                        <button class="delete-record-btn"
                            data-id="${record.id}">
                            Delete
                        </button>
                    </td>
                `;

                recordsTableBody.appendChild(row);
            });

        } catch (error) {
            console.error("Records error:", error);

            recordsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        ${escapeHtml(error.message)}
                    </td>
                </tr>
            `;
        }
    }

    if (recordsDateFilter) {
        recordsDateFilter.addEventListener("change", loadRecords);
    }

    if (recordsStatusFilter) {
        recordsStatusFilter.addEventListener("change", loadRecords);
    }

    if (recordsTableBody) {
        recordsTableBody.addEventListener("click", async function (event) {
            const deleteButton =
                event.target.closest(".delete-record-btn");

            if (!deleteButton) return;

            const id = deleteButton.dataset.id;

            if (!confirm("Delete this attendance record?")) return;

            try {
                await deleteAttendance(id);
                await loadRecords();

                alert("Attendance record deleted successfully.");

            } catch (error) {
                alert(error.message);
            }
        });
    }

  
    // ======================================
    // REPORTS PAGE
    // ======================================

    const reportTableBody =
        document.getElementById("reportTableBody");

    const reportFromDate =
        document.getElementById("reportFromDate");

    const reportToDate =
        document.getElementById("reportToDate");

    const reportProgram =
        document.getElementById("reportProgram");

    const generateReportBtn =
        document.getElementById("generateReportBtn");

    const applyReportFilterBtn =
        document.getElementById("applyReportFilterBtn");

    const reportSearch =
        document.getElementById("reportSearch");

    const reportMessage =
        document.getElementById("reportMessage");

    const reportTotalStudents =
        document.getElementById("reportTotalStudents");

    const reportPresent =
        document.getElementById("reportPresent");

    const reportAbsent =
        document.getElementById("reportAbsent");

    const reportLate =
        document.getElementById("reportLate");

    let reportStudents = [];
    let reportAttendance = [];

    // POPULATE PROGRAM DROPDOWN
    if (reportProgram) {
        reportProgram.innerHTML = `
            <option value="">All Programs</option>
            <option value="BSIT">BSIT</option>
            <option value="BSCS">BSCS</option>
            <option value="BSEMC">BSEMC</option>
        `;
    }

    // GENERATE REPORT
    async function loadReports() {
        if (!reportTableBody) return;

        try {
            if (reportMessage) {
                reportMessage.textContent = "Generating report...";
            }

            const [students, attendanceRecords] =
                await Promise.all([
                    getStudents(),
                    getAttendanceRecords()
                ]);

            reportStudents = students;
            reportAttendance = attendanceRecords;

            renderReports();

            if (reportMessage) {
                reportMessage.textContent =
                    "Report generated successfully.";
            }

        } catch (error) {
            console.error("Reports loading error:", error);

            reportTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        ${escapeHtml(error.message)}
                    </td>
                </tr>
            `;

            if (reportMessage) {
                reportMessage.textContent =
                    "Unable to generate report. Please check the API.";
            }
        }
    }

    // DISPLAY REPORT
    function renderReports() {
        if (!reportTableBody) return;

        const fromDate = reportFromDate?.value || "";
        const toDate = reportToDate?.value || "";
        const selectedProgram = reportProgram?.value || "";
        const keyword = reportSearch?.value.trim().toLowerCase() || "";

        // FILTER STUDENTS BY PROGRAM AND SEARCH
        let filteredStudents = reportStudents.filter(student => {
            const matchesProgram = !selectedProgram ||
                student.course?.toUpperCase() === selectedProgram;

            const searchableText = [
                student.studentId,
                student.firstName,
                student.lastName,
                student.course
            ].join(" ").toLowerCase();

            return matchesProgram &&
                searchableText.includes(keyword);
        });

        // FILTER ATTENDANCE BY DATE
        const filteredAttendance = reportAttendance.filter(record => {
            const recordDate = String(
                record.attendanceDate || ""
            ).substring(0, 10);

            if (fromDate && recordDate < fromDate) {
                return false;
            }

            if (toDate && recordDate > toDate) {
                return false;
            }

            return true;
        });

        reportTableBody.innerHTML = "";

        let totalPresent = 0;
        let totalAbsent = 0;
        let totalLate = 0;

        filteredStudents.forEach(student => {
            const studentRecords = filteredAttendance.filter(record =>
                Number(record.studentId) === Number(student.id)
            );

            const present = studentRecords.filter(record =>
                record.status?.toLowerCase() === "present"
            ).length;

            const absent = studentRecords.filter(record =>
                record.status?.toLowerCase() === "absent"
            ).length;

            const late = studentRecords.filter(record =>
                record.status?.toLowerCase() === "late"
            ).length;

            const total = studentRecords.length;

            const attendanceRate = total > 0
                ? Math.round(((present + late) / total) * 100)
                : 0;

            totalPresent += present;
            totalAbsent += absent;
            totalLate += late;

            const row = document.createElement("tr");

            const values = [
                student.studentId,
                getStudentFullName(student),
                student.course || "—",
                present,
                absent,
                late,
                `${attendanceRate}%`
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "—";
                row.appendChild(cell);
            });

            reportTableBody.appendChild(row);
        });

        if (!filteredStudents.length) {
            reportTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        No report data available.
                    </td>
                </tr>
            `;
        }

        // UPDATE SUMMARY CARDS
        if (reportTotalStudents) {
            reportTotalStudents.textContent =
                filteredStudents.length;
        }

        if (reportPresent) {
            reportPresent.textContent = totalPresent;
        }

        if (reportAbsent) {
            reportAbsent.textContent = totalAbsent;
        }

        if (reportLate) {
            reportLate.textContent = totalLate;
        }
    }

    // GENERATE REPORT BUTTON
    if (generateReportBtn) {
        generateReportBtn.addEventListener("click", loadReports);
    }

    // APPLY FILTER BUTTON
    if (applyReportFilterBtn) {
        applyReportFilterBtn.addEventListener("click", renderReports);
    }

    // SEARCH REPORTS
    if (reportSearch) {
        reportSearch.addEventListener("input", renderReports);
    }

    // INITIAL REPORT LOAD
    if (reportTableBody) {
        loadReports();
    }


    // ======================================
    // LOGOUT
    // ======================================

    document.querySelectorAll(".logout-btn").forEach(button => {
        button.addEventListener("click", function (event) {
            event.preventDefault();

            clearAuthSession();

            window.location.href = "index.html";
        });
    });

    console.log("AttendTrack app initialized successfully.");

});