// AttendTrack frontend entry point. Requires api.js before this file.
const loginForm = document.querySelector("#loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = loginForm.querySelector("button[type='submit']");
        const email = document.querySelector("#email")?.value.trim();
        const password = document.querySelector("#password")?.value;
        let message = document.querySelector("#loginMessage");
        if (!message) {
            message = document.createElement("p"); message.id = "loginMessage";
            loginForm.appendChild(message);
        }
        try {
            if (button) button.disabled = true;
            message.textContent = "Signing in...";
            const result = await apiRequest("/users/login", {
                method: "POST",
                body: JSON.stringify({ accountType: "User", email, password })
            });
            saveAuth(result);
            window.location.href = "dashboard.html";
        } catch (error) {
            message.textContent = error.message;
        } finally { if (button) button.disabled = false; }
    });
}

// Students page: connect the existing Add Student modal to POST /api/students.
document.addEventListener("DOMContentLoaded", () => {
    const protectedPages = ["dashboard.html", "students.html", "attendance.html", "records.html", "reports.html"];
    if (protectedPages.includes(location.pathname.split("/").pop())) requireLogin();
    document.querySelectorAll(".dashboard-logout").forEach(link => link.addEventListener("click", event => { event.preventDefault(); logout(); }));
    const modal = document.getElementById("studentModal");
    const open = document.getElementById("addStudentBtn");
    const close = document.getElementById("closeStudentModal");
    const cancel = document.getElementById("cancelStudentBtn");
    const form = document.getElementById("addStudentForm");
    const message = document.getElementById("studentFormMessage");
    const tableBody = document.getElementById("studentsListBody");
    const status = document.getElementById("studentsMessage");
    if (modal && open) {
        open.addEventListener("click", () => { modal.hidden = false; modal.style.display = "flex"; });
        const closeModal = () => { modal.hidden = true; modal.style.display = "none"; form?.reset(); if (message) message.textContent = ""; };
        close?.addEventListener("click", closeModal); cancel?.addEventListener("click", closeModal);
        modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
    }
    async function loadStudents() {
        if (!tableBody) return;
        try {
            requireLogin();
            const students = await apiRequest("/students");
            tableBody.replaceChildren();
            for (const s of students) {
                const tr = document.createElement("tr");
                const values = [s.studentId, `${s.firstName} ${s.lastName}`, s.email || "—", s.course || "—", s.yearLevel || "—", s.section || "—"];
                for (const value of values) { const td = document.createElement("td"); td.textContent = value; tr.appendChild(td); }
                const actionCell = document.createElement("td"); actionCell.textContent = "—"; tr.appendChild(actionCell);
                tableBody.appendChild(tr);
            }
            if (status) status.textContent = `${students.length} active student(s) loaded.`;
        } catch (e) { if (status) status.textContent = e.message; }
    }
    if (form) form.addEventListener("submit", async e => {
        e.preventDefault();
        const fullName = document.getElementById("newStudentName")?.value.trim() || "";
        const parts = fullName.split(/\s+/);
        const firstName = parts.shift() || "";
        const lastName = parts.join(" ") || "N/A";
        const payload = {
            studentId: document.getElementById("newStudentId").value.trim(),
            firstName, lastName,
            email: document.getElementById("newStudentEmail").value.trim(),
            course: document.getElementById("newStudentProgram").value,
            yearLevel: document.getElementById("newStudentYear").value,
            section: document.getElementById("newStudentSection").value.trim()
        };
        try {
            await apiRequest("/students", { method: "POST", body: JSON.stringify(payload) });
            if (message) message.textContent = "Student saved successfully.";
            form.reset(); if (modal) { modal.hidden = true; modal.style.display = "none"; }
            await loadStudents();
        } catch (error) { if (message) message.textContent = error.message; }
    });
    if (tableBody) loadStudents();
    const programSelect = document.getElementById("newStudentProgram");
    if (programSelect) {
        apiRequest("/programs").then(programs => {
            const current = programSelect.value;
            programSelect.replaceChildren(new Option("Select Program", ""));
            programs.filter(p => p.isActive).forEach(p => programSelect.add(new Option(p.programCode, p.programCode)));
            if (current) programSelect.value = current;
        }).catch(() => { /* Existing options remain available if the Programs table is empty. */ });
    }
    const search = document.getElementById("studentListSearch");
    search?.addEventListener("input", () => {
        const term = search.value.toLowerCase();
        tableBody?.querySelectorAll("tr").forEach(row => { row.hidden = !row.textContent.toLowerCase().includes(term); });
    });
});

// Live dashboard, attendance, records, and report data from SQL-backed API endpoints.
document.addEventListener("DOMContentLoaded", async () => {
    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
    const dateOnly = value => String(value || "").slice(0,10);
    const put = (id, value) => { const node=document.getElementById(id); if(node) node.textContent=value; };
    const addCell = (row, value) => { const td=document.createElement("td"); td.textContent=value ?? "—"; row.appendChild(td); };
    const fillRows = (body, rows, emptyText, colspan) => {
        if(!body) return; body.replaceChildren();
        if(!rows.length){const tr=document.createElement("tr"),td=document.createElement("td");td.colSpan=colspan;td.className="empty-state";td.textContent=emptyText;tr.appendChild(td);body.appendChild(tr);return;}
        rows.forEach(values=>{const tr=document.createElement("tr");values.forEach(v=>addCell(tr,v));body.appendChild(tr);});
    };
    const attendanceBody = document.getElementById("attendanceTableBody");
    const recordsBody = document.getElementById("recordsTableBody");
    const reportBody = document.getElementById("reportTableBody");
    if(!attendanceBody && !recordsBody && !reportBody && !document.getElementById("totalStudents")) return;
    try {
        const [students, attendance] = await Promise.all([apiRequest("/students"),apiRequest("/attendance")]);
        const studentMap = new Map(students.map(s=>[s.id,s]));
        const enriched = attendance.map(a=>({ ...a, student:studentMap.get(a.studentId) })).filter(a=>a.student);
        if(attendanceBody){
            const dateInput=document.getElementById("attendanceDate"); if(dateInput && !dateInput.value) dateInput.value=localDate;
            const render=()=>{const selected=dateInput?.value||localDate;const rows=enriched.filter(a=>dateOnly(a.attendanceDate)===selected).map(a=>[a.student.studentId,`${a.student.firstName} ${a.student.lastName}`,a.student.course||"—",a.student.section||"—",a.status]);fillRows(attendanceBody,rows,"No attendance has been finalized for this date.",5);};
            render(); dateInput?.addEventListener("change",render);
            const btn=document.getElementById("saveAttendanceBtn"); if(btn){btn.textContent="Open RFID Simulator";btn.addEventListener("click",()=>window.location.href="rfid-simulator.html");}
            document.getElementById("attendanceSearch")?.addEventListener("input",e=>attendanceBody.querySelectorAll("tr").forEach(r=>r.hidden=!r.textContent.toLowerCase().includes(e.target.value.toLowerCase())));
        }
        if(recordsBody){
            const render=()=>{const date=document.getElementById("recordDateFilter")?.value||"";const term=document.getElementById("recordSearch")?.value.toLowerCase()||"";const rows=enriched.filter(a=>(!date||dateOnly(a.attendanceDate)===date)&&(`${a.student.studentId} ${a.student.firstName} ${a.student.lastName} ${a.status}`).toLowerCase().includes(term)).map(a=>[dateOnly(a.attendanceDate),a.student.studentId,`${a.student.firstName} ${a.student.lastName}`,a.student.course||"—",a.status]);fillRows(recordsBody,rows,"No matching attendance records.",5);};
            render(); document.getElementById("recordDateFilter")?.addEventListener("change",render);document.getElementById("recordSearch")?.addEventListener("input",render);
        }
        if(document.getElementById("totalStudents")){
            const todays=enriched.filter(a=>dateOnly(a.attendanceDate)===localDate);
            const count=status=>todays.filter(a=>a.status.toLowerCase()===status).length;
            put("totalStudents",students.length);put("presentToday",count("present"));put("absentToday",count("absent"));put("lateToday",count("late"));
            const rate=todays.length?Math.round((count("present")+count("late"))/todays.length*100):0;
            put("attendanceRate",todays.length?`Attendance completion: ${rate}% of finalized records are present or late.`:"No finalized attendance sessions today.");
        }
        if(reportBody){
            const programs=await apiRequest("/programs");const select=document.getElementById("reportProgram");
            if(select){programs.forEach(p=>{if(p.isActive)select.add(new Option(p.programCode,p.programCode));});}
            const render=()=>{
                const from=document.getElementById("reportFromDate")?.value||"0000-00-00";const to=document.getElementById("reportToDate")?.value||"9999-99-99";const program=select?.value||"";const term=document.getElementById("reportSearch")?.value.toLowerCase()||"";
                const filtered=enriched.filter(a=>dateOnly(a.attendanceDate)>=from&&dateOnly(a.attendanceDate)<=to&&(!program||a.student.course===program));
                const rows=students.filter(s=>(!program||s.course===program)&&(`${s.studentId} ${s.firstName} ${s.lastName}`).toLowerCase().includes(term)).map(s=>{const own=filtered.filter(a=>a.studentId===s.id);const p=own.filter(a=>a.status==="Present").length,l=own.filter(a=>a.status==="Late").length,ab=own.filter(a=>a.status==="Absent").length,total=p+l+ab;return [s.studentId,`${s.firstName} ${s.lastName}`,s.course||"—",p,ab,l,total?`${Math.round((p+l)/total*100)}%`:"—"];});
                put("reportTotalStudents",rows.length);put("reportPresent",filtered.filter(a=>a.status==="Present").length);put("reportAbsent",filtered.filter(a=>a.status==="Absent").length);put("reportLate",filtered.filter(a=>a.status==="Late").length);fillRows(reportBody,rows,"No report data for the selected filters.",7);
            };
            render();document.getElementById("applyReportFilterBtn")?.addEventListener("click",render);document.getElementById("generateReportBtn")?.addEventListener("click",render);document.getElementById("reportSearch")?.addEventListener("input",render);
            document.getElementById("downloadCsvBtn")?.addEventListener("click",()=>{
                const rows=[["Student ID","Student Name","Program","Present","Absent","Late","Attendance Rate"],...[...reportBody.querySelectorAll("tr")].filter(r=>!r.querySelector(".empty-state")).map(r=>[...r.cells].map(c=>c.textContent))];
                const csv=rows.map(row=>row.map(value=>`"${String(value??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");
                const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="AttendTrack_Attendance_Report.csv";a.click();URL.revokeObjectURL(url);
            });
        }
    } catch(error) {
        put("attendanceMessage",error.message);put("recordsMessage",error.message);put("reportMessage",error.message);
    }
});
