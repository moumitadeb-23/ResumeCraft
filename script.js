/* ResumeCraft Pro
   Client-side only. Data lives in localStorage.
   "Smart Assist" intentionally uses a local rules-based writing engine so no
   secret API key or personal resume data is sent to a third party.
   A production SaaS can swap these functions for a secure server-side LLM call.
*/

const DB_KEY="resumecraft-pro-v2";
const THEME_KEY="resumecraft-theme";
const skillBank=["JavaScript","TypeScript","Python","Java","C++","C#","Go","HTML","CSS","React","Next.js","Angular","Vue.js","Node.js","Express.js","REST APIs","GraphQL","SQL","PostgreSQL","MySQL","MongoDB","Firebase","AWS","Azure","Google Cloud","Docker","Kubernetes","Git","GitHub","Figma","UI/UX Design","Product Design","Responsive Design","Accessibility","Tailwind CSS","Bootstrap","Data Analysis","Power BI","Tableau","Excel","Machine Learning","Deep Learning","Data Visualization","Agile","Scrum","Project Management","Leadership","Communication","Problem Solving","Teamwork","SEO","Content Strategy","Digital Marketing","Customer Success"];

const templates=[
 {id:"modern",name:"Modern",desc:"Sharp, contemporary and versatile"},
 {id:"minimal",name:"Minimal",desc:"Clean and ATS-friendly"},
 {id:"classic",name:"Classic",desc:"Timeless editorial style"},
 {id:"executive",name:"Executive",desc:"Confident corporate presence"},
 {id:"creative",name:"Creative",desc:"Bold for design & marketing"},
 {id:"elegant",name:"Elegant",desc:"Refined serif sophistication"}
];

const blankResume=()=>({
 id:uid("resume"),title:"Untitled Resume",template:"modern",accent:"#635bff",font:"DM Sans",
 personal:{name:"",email:"",phone:"",location:"",linkedin:"",portfolio:""},summary:"",
 experience:[],education:[],skills:[],projects:[],certifications:[],jobDescription:"",
 updatedAt:Date.now()
});
const blankExp=()=>({id:uid("exp"),company:"",role:"",start:"",end:"",bullets:[""]});
const blankEdu=()=>({id:uid("edu"),school:"",degree:"",start:"",end:""});
const blankProject=()=>({id:uid("pro"),name:"",link:"",description:"",start:"",end:"",bullets:[""]});
const blankCert=()=>({id:uid("cert"),name:"",issuer:"",date:"",link:""});

let db=loadDB(), currentId=null, dragged=null, saveTimer=null, zoom=70;

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const uid=p=>p+"_"+Math.random().toString(36).slice(2,9);
const current=()=>db.resumes.find(r=>r.id===currentId);
function loadDB(){try{const x=JSON.parse(localStorage.getItem(DB_KEY)||"");if(x?.resumes)return x}catch{}return{resumes:[]}}
function persist(){localStorage.setItem(DB_KEY,JSON.stringify(db));$("#globalSave").innerHTML='<i></i> All changes saved';$("#editorSave").textContent="Saved locally"}
function schedulePersist(){ $("#globalSave").textContent="Saving…";$("#editorSave").textContent="Saving…";clearTimeout(saveTimer);saveTimer=setTimeout(persist,250)}
function touch(){const r=current();if(r){r.updatedAt=Date.now();schedulePersist()}}

function init(){
  applyTheme(localStorage.getItem(THEME_KEY)||"light");
  $("#themeToggle").onclick=()=>applyTheme(document.documentElement.dataset.theme==="dark"?"light":"dark");
  $("#brandHome").onclick=showDashboard;
  $("#createResume").onclick=()=>openEditor(blankResume());
  $("#backDashboard").onclick=showDashboard;
  $("#resumeSearch").oninput=renderDashboard;
  $("#resumeTitle").oninput=e=>{current().title=e.target.value||"Untitled Resume";touch()};
  $("#downloadBtn").onclick=exportPDF;
  $("#atsBtn").onclick=showATS;
  setupTabs();setupContentButtons();setupSkillPicker();setupModal();
  renderDashboard();
}
function applyTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem(THEME_KEY,theme);$("#themeToggle").textContent=theme==="dark"?"☀":"☾"}

function renderDashboard(){
  const q=($("#resumeSearch")?.value||"").toLowerCase();
  const arr=db.resumes.filter(r=>(r.title+" "+(r.personal?.name||"")).toLowerCase().includes(q));
  $("#resumeCount").textContent=`${db.resumes.length} saved resume${db.resumes.length===1?"":"s"}`;
  const cards=$("#resumeCards");
  if(!arr.length){cards.innerHTML=`<div class="empty-card"><strong>${q?"No matching resumes":"Your resume studio is ready."}</strong><span>${q?"Try another search.":"Create your first resume and make it yours."}</span></div>`}
  else cards.innerHTML=arr.sort((a,b)=>b.updatedAt-a.updatedAt).map(r=>{
    const score=scoreResume(r).total;
    return `<div class="resume-card">
      <div class="thumb"><div class="thumb-paper ${r.template}">
        <div class="thumb-name"></div><div class="thumb-line short"></div><div class="thumb-line"></div><div class="thumb-accent"></div>
        <div class="thumb-section"></div><div class="thumb-line"></div><div class="thumb-line short"></div><div class="thumb-section"></div><div class="thumb-line"></div><div class="thumb-line"></div>
      </div></div>
      <div class="resume-meta"><div><strong>${esc(r.title)}</strong><small>${esc(r.personal?.name||"No name")} · ${relative(r.updatedAt)}</small></div><span class="score-badge">${score}/100</span></div>
      <div class="card-actions"><button class="open" data-open="${r.id}">Open</button><button data-duplicate="${r.id}">Duplicate</button><button data-delete="${r.id}">Delete</button></div>
    </div>`
  }).join("");
  cards.onclick=e=>{
    const open=e.target.closest("[data-open]"), dup=e.target.closest("[data-duplicate]"), del=e.target.closest("[data-delete]");
    if(open){const r=db.resumes.find(x=>x.id===open.dataset.open);openEditor(r)}
    if(dup){const r=db.resumes.find(x=>x.id===dup.dataset.duplicate);const copy=structuredClone(r);copy.id=uid("resume");copy.title=r.title+" Copy";copy.updatedAt=Date.now();db.resumes.push(copy);persist();renderDashboard();showToast("Resume duplicated")}
    if(del&&confirm("Delete this resume permanently from this browser?")){db.resumes=db.resumes.filter(x=>x.id!==del.dataset.delete);persist();renderDashboard();showToast("Resume deleted")}
  };
  updateDashboardInsights();
}
function relative(ts){const m=Math.max(0,Math.round((Date.now()-ts)/60000));if(m<1)return"just now";if(m<60)return`${m}m ago`;const h=Math.round(m/60);if(h<24)return`${h}h ago`;return`${Math.round(h/24)}d ago`}
function updateDashboardInsights(){
  if(!db.resumes.length){$("#dashboardScore").textContent="—";["barContent","barKeywords","barComplete"].forEach(x=>$("#"+x).style.width="0%");return}
  const scores=db.resumes.map(scoreResume), avg=Math.round(scores.reduce((a,b)=>a+b.total,0)/scores.length);
  $("#dashboardScore").textContent=avg;$("#barContent").style.width=Math.round(scores.reduce((a,b)=>a+b.content,0)/scores.length)+"%";$("#barKeywords").style.width=Math.round(scores.reduce((a,b)=>a+b.keywords,0)/scores.length)+"%";$("#barComplete").style.width=Math.round(scores.reduce((a,b)=>a+b.complete,0)/scores.length)+"%";
}

function openEditor(r){
  currentId=r.id;
  if(!db.resumes.some(x=>x.id===r.id))db.resumes.push(r);
  $("#dashboardView").classList.add("hidden");$("#editorView").classList.remove("hidden");
  window.scrollTo(0,0);renderEditor();
}
function showDashboard(){if(currentId)persist();$("#editorView").classList.add("hidden");$("#dashboardView").classList.remove("hidden");currentId=null;renderDashboard();window.scrollTo(0,0)}
function renderEditor(){
  const r=current();$("#resumeTitle").value=r.title||"Untitled Resume";
  const p=r.personal||{};["name","email","phone","location","linkedin","portfolio"].forEach(k=>$("#"+k).value=p[k]||"");
  $("#summary").value=r.summary||"";$("#jobDescription").value=r.jobDescription||"";
  $("#accentSelect").value=r.accent||"#635bff";$("#fontSelect").value=r.font||"DM Sans";
  $$(".template-choice").forEach(x=>x.classList.toggle("active",x.dataset.template===r.template));
  renderForms();renderSkills();renderPreview();
}
function setupContentButtons(){
  const map={name:"personal",email:"personal",phone:"personal",location:"personal",linkedin:"personal",portfolio:"personal"};
  Object.entries(map).forEach(([id])=>$("#"+id).addEventListener("input",e=>{current().personal[id]=e.target.value;validate();touch();renderPreview()}));
  $("#summary").oninput=e=>{current().summary=e.target.value;touch();renderPreview()};
  $("#addExperience").onclick=()=>{current().experience.push(blankExp());touch();renderForms();renderPreview()};
  $("#addEducation").onclick=()=>{current().education.push(blankEdu());touch();renderForms();renderPreview()};
  $("#addProject").onclick=()=>{current().projects.push(blankProject());touch();renderForms();renderPreview()};
  $("#addCertification").onclick=()=>{current().certifications.push(blankCert());touch();renderForms();renderPreview()};
  $("#accentSelect").onchange=e=>{current().accent=e.target.value;touch();renderPreview()};
  $("#fontSelect").onchange=e=>{current().font=e.target.value;touch();renderPreview()};
}
function setupTabs(){
  $$(".editor-tab").forEach(btn=>btn.onclick=()=>{$$(".editor-tab").forEach(b=>b.classList.toggle("active",b===btn));$$(".tab-panel").forEach(p=>p.classList.toggle("active",p.id===btn.dataset.panel+"Panel"));if(btn.dataset.panel==="design")renderGallery();if(btn.dataset.panel==="match")$("#jobDescription").value=current().jobDescription||""});
}
function renderForms(){renderExperience();renderEducation();renderProjects();renderCertifications()}
function renderExperience(){
 const box=$("#experienceList"),arr=current().experience;
 box.innerHTML=arr.length?arr.map((x,i)=>`
 <div class="repeat-item" draggable="true" data-kind="experience" data-id="${x.id}">
  <div class="repeat-head"><span class="drag">⋮⋮</span><strong>Role ${i+1}</strong><button class="delete" data-del="${x.id}" data-kind="experience">×</button></div>
  <div class="repeat-grid"><label>Company<input data-kind="experience" data-id="${x.id}" data-field="company" value="${esc(x.company)}" placeholder="Company"></label><label>Role<input data-kind="experience" data-id="${x.id}" data-field="role" value="${esc(x.role)}" placeholder="Software Engineer"></label><label>Start<input data-kind="experience" data-id="${x.id}" data-field="start" value="${esc(x.start)}" placeholder="Jan 2024"></label><label>End<input data-kind="experience" data-id="${x.id}" data-field="end" value="${esc(x.end)}" placeholder="Present"></label></div>
  <div class="bullets"><label>Achievements</label>${(x.bullets||[""]).map((b,bi)=>`<div class="bullet-row"><input data-kind="experience" data-id="${x.id}" data-field="bullet" data-index="${bi}" value="${esc(b)}" placeholder="Improved conversion by 24%..."><button class="bullet-remove" data-action="remove-bullet" data-kind="experience" data-id="${x.id}" data-index="${bi}">×</button></div>`).join("")}<button class="add-bullet" data-action="add-bullet" data-kind="experience" data-id="${x.id}">＋ Add achievement</button></div>
 </div>`).join(""):`<div class="empty-inline">No roles yet. Add your most recent position first.</div>`;
 bindRepeat(box);
}
function renderEducation(){
 const box=$("#educationList"),arr=current().education;
 box.innerHTML=arr.length?arr.map((x,i)=>`<div class="repeat-item" draggable="true" data-kind="education" data-id="${x.id}"><div class="repeat-head"><span class="drag">⋮⋮</span><strong>Education ${i+1}</strong><button class="delete" data-del="${x.id}" data-kind="education">×</button></div><div class="repeat-grid three"><label>Institution<input data-kind="education" data-id="${x.id}" data-field="school" value="${esc(x.school)}" placeholder="University"></label><label>Degree<input data-kind="education" data-id="${x.id}" data-field="degree" value="${esc(x.degree)}" placeholder="B.Tech Computer Science"></label><label>Dates<input data-kind="education" data-id="${x.id}" data-field="dateRange" value="${esc([x.start,x.end].filter(Boolean).join(" – "))}" placeholder="2021 – 2025"></label></div></div>`).join(""):`<div class="empty-inline">Add your degree or most relevant education.</div>`;
 bindRepeat(box);
}
function renderProjects(){
 const box=$("#projectList"),arr=current().projects;
 box.innerHTML=arr.length?arr.map((x,i)=>`<div class="repeat-item" draggable="true" data-kind="projects" data-id="${x.id}"><div class="repeat-head"><span class="drag">⋮⋮</span><strong>Project ${i+1}</strong><button class="delete" data-del="${x.id}" data-kind="projects">×</button></div><div class="repeat-grid three"><label>Project name<input data-kind="projects" data-id="${x.id}" data-field="name" value="${esc(x.name)}" placeholder="Analytics Dashboard"></label><label>Start date<input data-kind="projects" data-id="${x.id}" data-field="start" value="${esc(x.start)}" placeholder="Jan 2025"></label><label>End date<input data-kind="projects" data-id="${x.id}" data-field="end" value="${esc(x.end)}" placeholder="Mar 2025"></label></div><div class="repeat-grid three" style="margin-top:8px"><label>Link<input data-kind="projects" data-id="${x.id}" data-field="link" value="${esc(x.link)}" placeholder="github.com/..."></label><label>Description<input data-kind="projects" data-id="${x.id}" data-field="description" value="${esc(x.description)}" placeholder="One-line context"></label><span></span></div><div class="bullets"><label>Highlights</label>${(x.bullets||[""]).map((b,bi)=>`<div class="bullet-row"><input data-kind="projects" data-id="${x.id}" data-field="bullet" data-index="${bi}" value="${esc(b)}" placeholder="Designed and shipped..."><button class="bullet-remove" data-action="remove-bullet" data-kind="projects" data-id="${x.id}" data-index="${bi}">×</button></div>`).join("")}<button class="add-bullet" data-action="add-bullet" data-kind="projects" data-id="${x.id}">＋ Add highlight</button></div></div>`).join(""):`<div class="empty-inline">Optional — showcase 1–3 strong projects.</div>`;
 bindRepeat(box);
}
function renderCertifications(){
 const box=$("#certificationList"),arr=current().certifications;
 box.innerHTML=arr.length?arr.map((x,i)=>`<div class="repeat-item" draggable="true" data-kind="certifications" data-id="${x.id}"><div class="repeat-head"><span class="drag">⋮⋮</span><strong>Certification ${i+1}</strong><button class="delete" data-del="${x.id}" data-kind="certifications">×</button></div><div class="repeat-grid"><label>Certification<input data-kind="certifications" data-id="${x.id}" data-field="name" value="${esc(x.name)}" placeholder="AWS Certified Developer"></label><label>Issuer<input data-kind="certifications" data-id="${x.id}" data-field="issuer" value="${esc(x.issuer)}" placeholder="AWS"></label><label>Date<input data-kind="certifications" data-id="${x.id}" data-field="date" value="${esc(x.date)}" placeholder="2026"></label><label>Link<input data-kind="certifications" data-id="${x.id}" data-field="link" value="${esc(x.link)}" placeholder="credential URL"></label></div></div>`).join(""):`<div class="empty-inline">Optional — add relevant certifications.</div>`;
 bindRepeat(box);
}
function bindRepeat(box){
 box.querySelectorAll("input").forEach(inp=>inp.oninput=()=>{
   const item=current()[inp.dataset.kind].find(x=>x.id===inp.dataset.id);if(!item)return;
   if(inp.dataset.field==="bullet")item.bullets[+inp.dataset.index]=inp.value;
   else if(inp.dataset.field==="dateRange"){const parts=inp.value.split(/\s*[–-]\s*/);item.start=parts[0]||"";item.end=parts.slice(1).join(" – ")}
   else item[inp.dataset.field]=inp.value;
   touch();renderPreview();
 });
 box.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{const kind=b.dataset.kind;current()[kind]=current()[kind].filter(x=>x.id!==b.dataset.del);touch();renderForms();renderPreview()});
 box.querySelectorAll("[data-action='add-bullet']").forEach(b=>b.onclick=()=>{const x=current()[b.dataset.kind].find(y=>y.id===b.dataset.id);x.bullets.push("");touch();renderForms();renderPreview()});
 box.querySelectorAll("[data-action='remove-bullet']").forEach(b=>b.onclick=()=>{const x=current()[b.dataset.kind].find(y=>y.id===b.dataset.id);x.bullets.splice(+b.dataset.index,1);if(!x.bullets.length)x.bullets.push("");touch();renderForms();renderPreview()});
 box.querySelectorAll(".repeat-item").forEach(item=>{
   item.ondragstart=()=>{dragged={kind:item.dataset.kind,id:item.dataset.id};item.style.opacity=".5"};
   item.ondragend=()=>{dragged=null;item.style.opacity="1"};
   item.ondragover=e=>{e.preventDefault();item.style.borderColor="var(--accent)"};
   item.ondragleave=()=>item.style.borderColor="";
   item.ondrop=e=>{e.preventDefault();item.style.borderColor="";if(!dragged||dragged.kind!==item.dataset.kind)return;const a=current()[dragged.kind],from=a.findIndex(x=>x.id===dragged.id),to=a.findIndex(x=>x.id===item.dataset.id);const [m]=a.splice(from,1);a.splice(to,0,m);touch();renderForms();renderPreview()}
 });
}

function setupSkillPicker(){
 const input=$("#skillSearch"),drop=$("#skillDropdown");
 function show(){const q=input.value.trim().toLowerCase(),list=skillBank.filter(s=>!current().skills.includes(s)&&(!q||s.toLowerCase().includes(q))).slice(0,16);let html=list.map(s=>`<div class="skill-option" data-skill="${esc(s)}">${esc(s)}</div>`).join("");if(q&&!skillBank.some(s=>s.toLowerCase()===q)&&!current().skills.some(s=>s.toLowerCase()===q))html+=`<div class="skill-option custom-skill" data-skill="${esc(input.value.trim())}">＋ Add “${esc(input.value.trim())}”</div>`;drop.innerHTML=html||`<div class="skill-option">No more matching skills</div>`;drop.classList.remove("hidden")}
 input.onfocus=show;input.oninput=show;input.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();const first=drop.querySelector("[data-skill]");if(first)addSkill(first.dataset.skill)}};
 drop.onclick=e=>{const x=e.target.closest("[data-skill]");if(x)addSkill(x.dataset.skill)};
 document.addEventListener("click",e=>{if(!e.target.closest(".skill-picker"))drop.classList.add("hidden")});
}
function addSkill(s){s=s.trim();if(!s)return;if(!current().skills.some(x=>x.toLowerCase()===s.toLowerCase()))current().skills.push(s);$("#skillSearch").value="";$("#skillDropdown").classList.add("hidden");renderSkills();touch();renderPreview()}
function renderSkills(){$("#skillTags").innerHTML=current().skills.map((s,i)=>`<span class="tag">${esc(s)} <button data-skill-remove="${i}" type="button">×</button></span>`).join("");$("#skillTags").onclick=e=>{const b=e.target.closest("[data-skill-remove]");if(b){current().skills.splice(+b.dataset.skillRemove,1);renderSkills();touch();renderPreview()}}}

function renderGallery(){
 const r=current();$("#templateGallery").innerHTML=templates.map(t=>`<button class="template-choice ${r.template===t.id?"active":""}" data-template="${t.id}"><div class="gallery-paper ${t.id==="classic"||t.id==="elegant"?"serif":""}"><div class="gp-name">${t.name}</div><div class="gp-sub">Professional resume</div><div class="gp-rule"></div><div class="gp-section">EXPERIENCE</div><div class="gp-line"></div><div class="gp-line w70"></div><div class="gp-line"></div><div class="gp-section">SKILLS</div><div class="gp-line w45"></div><div class="gp-line"></div></div><strong>${t.name}</strong><small>${t.desc}</small></button>`).join("");
 $("#templateGallery").querySelectorAll(".template-choice").forEach(b=>b.onclick=()=>{r.template=b.dataset.template;touch();renderGallery();renderPreview()});
}

function linkify(v){if(!v)return"";const href=/^https?:\/\//i.test(v)?v:"https://"+v;return`<a href="${esc(href)}" target="_blank" rel="noopener">${esc(v.replace(/^https?:\/\//i,"").replace(/\/$/,""))}</a>`}
function section(title,body){return body?`<section class="r-section"><h2 class="r-section-title">${title}</h2>${body}</section>`:""}
function previewEntries(kind){
 const r=current();
 if(kind==="experience")return r.experience.filter(x=>x.company||x.role||x.bullets.some(Boolean)).map(x=>entry(x.role,x.company,[x.start,x.end].filter(Boolean).join(" – "),x.bullets)).join("");
 if(kind==="education")return r.education.filter(x=>x.school||x.degree).map(x=>entry(x.degree,x.school,[x.start,x.end].filter(Boolean).join(" – "),[])).join("");
 if(kind==="projects")return r.projects.filter(x=>x.name||x.description||x.bullets.some(Boolean)).map(x=>entry(x.name,x.description,[x.start,x.end].filter(Boolean).join(" – "),x.bullets,x.link)).join("");
 if(kind==="certifications")return r.certifications.filter(x=>x.name||x.issuer).map(x=>entry(x.name,x.issuer,x.date,[],x.link)).join("");
}
function entry(title,sub,date,bullets,link){return`<div class="r-entry"><div class="r-entry-head"><div><p class="r-role">${esc(title||"Untitled")}</p><div class="r-company">${esc(sub||"")}${link?" · "+linkify(link):""}</div></div><div class="r-date">${esc(date||"")}</div></div>${bullets?.filter(Boolean).length?`<ul class="r-bullets">${bullets.filter(Boolean).map(b=>`<li>${esc(b)}</li>`).join("")}</ul>`:""}</div>`}
function renderPreview(){
 const r=current(),p=r.personal||{},preview=$("#resumePreview");
 preview.style.setProperty("--accent",r.accent||"#635bff");preview.style.fontFamily=r.font==="Georgia"?"Georgia,serif":`"${r.font}",Arial,sans-serif`;
 const contacts=[p.email&&esc(p.email),p.phone&&esc(p.phone),p.location&&esc(p.location),p.linkedin&&linkify(p.linkedin),p.portfolio&&linkify(p.portfolio)].filter(Boolean).join("<span>•</span>");
 preview.className=`resume-paper template-${r.template}`;
 preview.innerHTML=`<header><h1 class="r-name">${esc(p.name||"Your Name")}</h1><div class="r-headline">${p.name?"Professional Resume":"Your professional headline will appear here"}</div><div class="r-contact">${contacts||"email@example.com  •  +91 98765 43210  •  City, Country"}</div></header>
 ${section("Profile",r.summary?`<div class="r-summary">${esc(r.summary).replace(/\n/g,"<br>")}</div>`:"")}
 ${section("Experience",previewEntries("experience"))}
 ${section("Education",previewEntries("education"))}
 ${section("Skills",r.skills.length?`<div class="r-skills">${r.skills.map(s=>`<span class="r-skill">${esc(s)}</span>`).join("")}</div>`:"")}
 ${section("Projects",previewEntries("projects"))}${section("Certifications",previewEntries("certifications"))}`;
}

function normalizeWords(text){return [...new Set((text.toLowerCase().match(/[a-z][a-z+#.-]{2,}/g)||[]))]}
function resumeText(r){return JSON.stringify({personal:r.personal,summary:r.summary,experience:r.experience,education:r.education,skills:r.skills,projects:r.projects,certifications:r.certifications}).toLowerCase()}
function scoreResume(r){
 const p=r.personal||{},checks=[
  ["Name",!!p.name,8],["Email",/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email||""),8],["Phone",!!p.phone,4],["Location",!!p.location,3],["LinkedIn/portfolio",!!(p.linkedin||p.portfolio),5],
  ["Summary",r.summary.trim().length>=80,12],["Experience",r.experience.length>0,16],["Impact bullets",r.experience.some(x=>(x.bullets||[]).filter(Boolean).length>=2),12],["Education",r.education.length>0,8],["Skills",r.skills.length>=5,10],["Projects/certifications",r.projects.length+r.certifications.length>0,5],["Dates",r.experience.every(x=>x.start||x.end),3],["Job keywords",r.jobDescription?jobMatch(r).score>=45:true,6]
 ];
 const content=Math.round(checks.filter(x=>x[1]).reduce((a,x)=>a+x[2],0)/72*100);
 const keywords=r.jobDescription?jobMatch(r).score:Math.min(100,r.skills.length*12);
 const complete=Math.round(checks.filter(x=>x[1]).length/checks.length*100);
 return {total:Math.min(100,Math.round(content*.55+keywords*.25+complete*.2)),content,keywords,complete,checks};
}
function showATS(){
 const s=scoreResume(current()),modal=$("#modal"),m=$("#modalContent");
 m.innerHTML=`<div class="ats-modal-head"><div class="ats-ring" style="--score:${s.total}"><span>${s.total}</span></div><div><span class="kicker">RESUME STRENGTH</span><h2>${s.total>=85?"Strong resume foundation":s.total>=70?"Good foundation":"Room to improve"}</h2><p>Based on completeness, content quality and keyword readiness.</p></div></div><div class="checks">${s.checks.map(c=>`<div class="check"><span>${c[0]}</span><b class="${c[1]?"good-text":"warn-text"}">${c[1]?"✓ Ready":"⚠ Improve"}</b></div>`).join("")}</div>`;
 modal.classList.remove("hidden")
}

function jobMatch(r){
 const jd=normalizeWords(r.jobDescription||"");
 const text=resumeText(r);
 const stop=new Set("the and for with from that this your you are our will have has into about using use their they them role job work team years experience required preferred looking candidate".split(" "));
 const terms=[...new Set(jd.filter(w=>w.length>=4&&!stop.has(w)))];
 const matched=terms.filter(t=>text.includes(t)),missing=terms.filter(t=>!text.includes(t));
 const score=terms.length?Math.round(matched.length/terms.length*100):0;
 return {score,matched:matched.slice(0,25),missing:missing.slice(0,25)};
}
function analyzeJob(){
 const r=current();r.jobDescription=$("#jobDescription").value;r.updatedAt=Date.now();touch();
 const x=jobMatch(r);$("#matchStatus").textContent=`Found ${x.matched.length} matching keywords`;$("#matchResults").classList.remove("hidden");
 $("#matchResults").innerHTML=`<div class="match-top"><div><span class="kicker">MATCH SCORE</span><div class="match-score">${x.score}%</div></div><span>${x.score>=70?"Strong alignment":"More tailoring recommended"}</span></div><div class="match-grid"><div class="match-list"><h4>✓ MATCHED KEYWORDS</h4>${x.matched.length?x.matched.map(k=>`<p class="good">• ${esc(k)}</p>`).join(""):"<p>No strong matches yet.</p>"}</div><div class="match-list"><h4>＋ OPPORTUNITIES</h4>${x.missing.length?x.missing.map(k=>`<p class="missing">• ${esc(k)}</p>`).join(""):"<p class='good'>Great — no obvious gaps.</p>"}</div></div>`;
}
$("#analyzeJob").onclick=analyzeJob;

function smartSummary(text){
 let t=text.trim();
 if(!t)return"Start with your role, years of experience, strongest skills and the value you create.";
 t=t.replace(/\bI am\b/gi,"").replace(/\bI have\b/gi,"").replace(/\bworked on\b/gi,"delivered").replace(/\bresponsible for\b/gi,"led");
 const role=current().experience[0]?.role||"professional";
 const skills=current().skills.slice(0,4).join(", ");
 if(t.length<90)return`${t.replace(/[.]+$/,"")}. ${role} focused on ${skills||"high-impact solutions"}, combining practical execution with measurable results.`;
 return t;
}
function smartBullets(){
 const r=current(),items=[];
 r.experience.forEach(x=>(x.bullets||[]).filter(Boolean).forEach(b=>{
   let s=b.trim().replace(/^(worked on|helped with|responsible for|did)\b/i,"Developed");
   if(!/^(built|developed|led|designed|created|optimized|implemented|launched|managed|automated|delivered|improved|engineered)/i.test(s))s="Delivered "+s.charAt(0).toLowerCase()+s.slice(1);
   if(!/[0-9%]/.test(s))s+=" — quantify the outcome (e.g. %, users, time or revenue) where possible.";
   items.push("• "+s);
 }));return items.join("\n")||"Add at least one experience bullet first.";
}
function smartKeywords(){
 const r=current();const x=jobMatch(r);return x.missing.length?`Suggested job keywords to consider naturally incorporating where truthful:\n\n${x.missing.slice(0,12).map(k=>"• "+k).join("\n")}\n\nTip: never add a keyword just to match ATS if you do not genuinely have that skill.`:"Add a job description in Job match first to receive targeted keyword suggestions.";
}
function runAssist(type){
 const out=$("#assistOutput");let text="";
 if(type==="summary"){const improved=smartSummary(current().summary);if(improved!==current().summary){current().summary=improved;$("#summary").value=improved;touch();renderPreview();text="Updated your summary:\n\n"+improved}else text=improved}
 if(type==="bullets")text=smartBullets();
 if(type==="keywords")text=smartKeywords();
 out.textContent=text;out.classList.remove("hidden");
 $$(".editor-tab").forEach(b=>b.classList.toggle("active",b.dataset.panel==="assist"));$$(".tab-panel").forEach(p=>p.classList.toggle("active",p.id==="assistPanel"));
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-assist]");if(b)runAssist(b.dataset.assist)});
function validate(){const n=$("#name"),em=$("#email"),okEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim());n.classList.toggle("invalid",!n.value.trim());em.classList.toggle("invalid",!okEmail);return!!n.value.trim()&&okEmail}

function setupModal(){$("#closeModal").onclick=()=>$("#modal").classList.add("hidden");$("#modal").querySelector(".modal-backdrop").onclick=()=>$("#modal").classList.add("hidden")}
function showToast(t){const x=$("#toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),2200)}
$("#zoomIn").onclick=()=>{zoom=Math.min(100,zoom+5);applyZoom()};$("#zoomOut").onclick=()=>{zoom=Math.max(45,zoom-5);applyZoom()};
function applyZoom(){$("#zoomValue").textContent=zoom+"%";$("#resumePreview").style.transform=`scale(${zoom/70})`;$("#resumePreview").style.marginBottom=(1123*(zoom/70)-1123)+"px"}

async function exportPDF(){
 if(!validate()){showToast("Enter a valid name and email first.");$("#name").focus();return}
 if(!window.html2canvas||!window.jspdf){showToast("PDF libraries need an internet connection to load.");return}
 const btn=$("#downloadBtn"),old=btn.textContent;btn.disabled=true;btn.textContent="Preparing…";persist();
 try{
   const paper=$("#resumePreview"),canvas=await html2canvas(paper,{scale:2,useCORS:true,backgroundColor:"#fff",logging:false});
   const {jsPDF}=window.jspdf,pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4",compress:true});
   const w=210,h=canvas.height*w/canvas.width,img=canvas.toDataURL("image/png");
   let left=h,pos=0;pdf.addImage(img,"PNG",0,pos,w,h,undefined,"FAST");left-=297;
   while(left>0){pos=left-h;pdf.addPage();pdf.addImage(img,"PNG",0,pos,w,h,undefined,"FAST");left-=297}
   const filename=(current().personal.name||current().title||"resume").replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"")+".pdf";pdf.save(filename);showToast("PDF exported successfully ✓")
 }catch(e){console.error(e);showToast("PDF export failed. Please try again.")}finally{btn.disabled=false;btn.textContent=old}
}

init();
