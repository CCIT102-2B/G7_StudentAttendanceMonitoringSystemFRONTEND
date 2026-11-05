requireLogin();
const page = document.body.dataset.page;
const $ = id => document.getElementById(id);
const msg = text => { if ($("message")) $("message").textContent = text; };
const table = (headers, rows) => {
    const head = $("tableHead"), body = $("tableBody");
    head.replaceChildren(); body.replaceChildren();
    const hr = document.createElement("tr"); headers.forEach(h => { const th=document.createElement("th"); th.textContent=h; hr.appendChild(th); }); head.appendChild(hr);
    rows.forEach(row => { const tr=document.createElement("tr"); row.forEach(v => { const td=document.createElement("td"); td.textContent=v ?? "—"; tr.appendChild(td); }); body.appendChild(tr); });
};
async function loadPrograms() {
    const rows = await apiRequest("/programs");
    table(["Code", "Program Name", "Status"], rows.map(x => [x.programCode,x.programName,x.isActive?"Active":"Inactive"]));
}
async function loadYears() {
    const rows = await apiRequest("/academicyears");
    table(["Academic Year", "Start", "End", "Current"], rows.map(x => [x.name,x.startDate?.slice(0,10),x.endDate?.slice(0,10),x.isCurrent?"Yes":"No"]));
}
async function loadEnrollments() {
    const rows = await apiRequest("/enrollments");
    table(["Student No.","Student","Program","Academic Year","Year Level","Section"], rows.map(x => [x.studentNumber,`${x.firstName} ${x.lastName}`,x.programCode,x.academicYear,x.yearLevel,x.section]));
}
async function loadSessions() {
    const rows = await apiRequest("/sessions");
    const head = $("tableHead"), body = $("tableBody");
    head.replaceChildren(); body.replaceChildren();
    const hr = document.createElement("tr");
    ["Session","Type","Start","Grace","Academic Year","Status","Action"].forEach(v=>{const th=document.createElement("th");th.textContent=v;hr.appendChild(th)}); head.appendChild(hr);
    rows.forEach(x=>{
      const tr=document.createElement("tr");
      [x.name,x.sessionType,new Date(x.startsAt).toLocaleString(),`${x.gracePeriodMinutes} min`,x.academicYearId ?? "Event",x.isOpen?"Open":"Closed"].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.appendChild(td)});
      const td=document.createElement("td");
      if(x.isOpen){const b=document.createElement("button");b.textContent="Close & Finalize";b.addEventListener("click",async()=>{if(!confirm("Close this session and mark eligible students without a scan as Absent?"))return;try{const r=await apiRequest(`/sessions/${x.id}/close`,{method:"PATCH"});msg(`${r.message} ${r.absentCount ?? 0} absent.`);await loadSessions()}catch(err){msg(err.message)}});td.appendChild(b)}else td.textContent="—";
      tr.appendChild(td);body.appendChild(tr);
    });
}
async function fillSelect(id, endpoint, valueField, labelField) {
    const select = $(id); if (!select) return;
    const data = await apiRequest(endpoint); select.replaceChildren(new Option("Select...", ""));
    data.filter(x => x.isActive !== false).forEach(x => select.add(new Option(x[labelField], x[valueField])));
}
(async () => {
 try {
   if (page === "programs") await loadPrograms();
   if (page === "years") await loadYears();
   if (page === "enrollments") { await Promise.all([fillSelect("studentId","/students","id","studentId"),fillSelect("programId","/programs","id","programCode"),fillSelect("academicYearId","/academicyears","id","name")]); await loadEnrollments(); }
   if (page === "sessions") { await Promise.all([fillSelect("academicYearId","/academicyears","id","name"),fillSelect("programId","/programs","id","programCode")]); await loadSessions(); }
 } catch(e) { msg(e.message); }
})();
$("dataForm")?.addEventListener("submit", async e => {
 e.preventDefault(); const f = new FormData(e.currentTarget);
 try {
  if (page === "programs") await apiRequest("/programs",{method:"POST",body:JSON.stringify({programCode:f.get("programCode"),programName:f.get("programName")})});
  if (page === "years") await apiRequest("/academicyears",{method:"POST",body:JSON.stringify({name:f.get("name"),startDate:f.get("startDate"),endDate:f.get("endDate"),isCurrent:f.get("isCurrent")==="on"})});
  if (page === "enrollments") await apiRequest("/enrollments",{method:"POST",body:JSON.stringify({studentId:+f.get("studentId"),programId:+f.get("programId"),academicYearId:+f.get("academicYearId"),yearLevel:f.get("yearLevel"),section:f.get("section")})});
  if (page === "sessions") await apiRequest("/sessions",{method:"POST",body:JSON.stringify({name:f.get("name"),sessionType:f.get("sessionType"),startsAt:f.get("startsAt"),endsAt:f.get("endsAt")||null,gracePeriodMinutes:+f.get("gracePeriodMinutes"),academicYearId:f.get("academicYearId")?+f.get("academicYearId"):null,programId:f.get("programId")?+f.get("programId"):null,section:f.get("section")||null})});
  e.currentTarget.reset(); msg("Saved successfully.");
  if(page==="programs") await loadPrograms(); if(page==="years") await loadYears(); if(page==="enrollments") await loadEnrollments(); if(page==="sessions") await loadSessions();
 } catch(err) { msg(err.message); }
});
