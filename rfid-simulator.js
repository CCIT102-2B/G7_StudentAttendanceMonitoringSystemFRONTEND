requireLogin();
const el = id => document.getElementById(id);
const message = text => el("message").textContent = text;
async function init() {
  try {
    const [students,sessions,cards] = await Promise.all([apiRequest("/students"),apiRequest("/sessions?openOnly=true"),apiRequest("/rfid/cards")]);
    students.forEach(s => el("studentId").add(new Option(`${s.studentId} - ${s.firstName} ${s.lastName}`,s.id)));
    sessions.forEach(s => el("sessionId").add(new Option(`${s.name} (${s.sessionType})`,s.id)));
    const body=el("cardsBody"); body.replaceChildren();
    cards.forEach(c=>{const tr=document.createElement("tr");[`${c.studentNumber} - ${c.firstName} ${c.lastName}`,c.cardUid,c.isActive?"Active":"Inactive"].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.appendChild(td)});body.appendChild(tr)});
  } catch(e) { message(e.message); }
}
el("registerForm").addEventListener("submit",async e=>{
 e.preventDefault();
 try {const result=await apiRequest("/rfid/register",{method:"POST",body:JSON.stringify({studentId:+el("studentId").value,cardUid:el("cardUid").value})});message(result.message);el("registerForm").reset();await init();}
 catch(err){message(err.message)}
});
el("scanForm").addEventListener("submit",async e=>{
 e.preventDefault();
 try {const result=await apiRequest("/rfid/simulate-scan",{method:"POST",body:JSON.stringify({sessionId:+el("sessionId").value,cardUid:el("scanUid").value})});message(`${result.student.firstName} ${result.student.lastName}: ${result.status} at ${result.timeIn}. ${result.message}`);}
 catch(err){message(err.message)}
});
init();
