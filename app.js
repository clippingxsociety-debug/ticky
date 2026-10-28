(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const KEY = "dayflow.v1.state";
  const dateISO = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const today = () => dateISO();
  const uid = () => Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4);
  const escapeHtml = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const timeLabel = t => {
    if (!t) return "Any time";
    const [h,m] = t.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM"; const hh = h%12 || 12;
    return `${hh}:${String(m).padStart(2,"0")} ${ap}`;
  };
  const stateDefault = () => ({
    tasks: [
      {id:uid(),title:"Morning walk",date:today(),time:"07:00",type:"task",repeat:"daily",done:false,note:"A little movement to start the day."},
      {id:uid(),title:"Read for 20 minutes",date:today(),time:"09:00",type:"task",repeat:"daily",done:false,note:""},
      {id:uid(),title:"Plan tomorrow",date:today(),time:"20:30",type:"task",repeat:"daily",done:false,note:""}
    ],
    habits:[{id:uid(),title:"Drink 2.3 L water",goal:2300,unit:"ml",color:"blue",steps:[
      {id:uid(),title:"250 ml water",time:"08:05",amount:250,done:false},
      {id:uid(),title:"200 ml water",time:"10:30",amount:200,done:false},
      {id:uid(),title:"200 ml water",time:"11:30",amount:200,done:false},
      {id:uid(),title:"250 ml water",time:"13:00",amount:250,done:false},
      {id:uid(),title:"250 ml water",time:"15:00",amount:250,done:false},
      {id:uid(),title:"250 ml water",time:"17:00",amount:250,done:false},
      {id:uid(),title:"250 ml water",time:"19:00",amount:250,done:false},
      {id:uid(),title:"250 ml water",time:"21:00",amount:250,done:false},
      {id:uid(),title:"400 ml water",time:"Throughout day",amount:400,done:false}
    ]}],
    routines:[{id:uid(),title:"Morning reset",steps:[{title:"Drink water",time:"07:00"},{title:"Stretch",time:"07:10"},{title:"Take a short walk",time:"07:25"}]}],
    waterGoal:2300, waterLogs:[], lastOpen:today()
  });
  let state;
  try { state = JSON.parse(localStorage.getItem(KEY)) || stateDefault(); } catch { state = stateDefault(); }
  if (!state.tasks || !state.habits || !state.routines) state = stateDefault();
  let toastTimer;
  function save(){ localStorage.setItem(KEY, JSON.stringify(state)); render(); }
  function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove("show"),2400); }
  function setDateLabel(){
    const d=new Date(); $("#todayLabel").textContent=d.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});
    $("#fullDate").textContent=d.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"});
    const h=d.getHours(); $("#greeting").textContent=h<12?"A FRESH START":h<17?"ONE THING AT A TIME":"WIND DOWN WITH INTENTION";
    $("#headline").textContent=h<12?"Make today count.":h<17?"Keep your rhythm.":"Finish gently, feel good.";
  }
  function ensureRecurring(){
    const now=today();
    if(state.lastOpen===now) return;
    const previous=state.lastOpen || now;
    const baseDate=new Date(previous+"T12:00:00"); const endDate=new Date(now+"T12:00:00");
    for(let d=new Date(baseDate); d<endDate; d.setDate(d.getDate()+1)){
      const ds=dateISO(d); const weekday=d.getDay();
      state.tasks.filter(t=>t.repeat && t.repeat!=="none" && t.date===previous).forEach(t=>{
        const should=t.repeat==="daily" || (t.repeat==="weekdays" && weekday>=1 && weekday<=5) || (t.repeat==="weekly" && d.getDay()===baseDate.getDay());
        if(should && !state.tasks.some(x=>x.title===t.title && x.date===ds && x.repeat===t.repeat)){
          state.tasks.push({...t,id:uid(),date:ds,done:false});
        }
      });
    }
    state.habits.forEach(h=>h.steps.forEach(s=>{s.done=false;}));
    state.waterLogs=state.waterLogs.filter(l=>l.date===now);
    state.lastOpen=now; localStorage.setItem(KEY,JSON.stringify(state));
  }
  function getTodayTasks(){return state.tasks.filter(t=>t.date===today()).sort((a,b)=>(a.time||"99:99").localeCompare(b.time||"99:99"));}
  function allTodayItems(){
    const tasks=getTodayTasks().map(t=>({kind:"task",id:t.id,time:t.time,title:t.title,done:t.done,source:t,note:t.note}));
    state.habits.forEach(h=>h.steps.forEach(s=>tasks.push({kind:"step",id:s.id,parent:h.id,time:s.time,title:s.title,done:s.done,source:s,note:h.title})));
    return tasks.sort((a,b)=>(a.time||"99:99").localeCompare(b.time||"99:99"));
  }
  function renderTimeline(){
    const items=allTodayItems(); const host=$("#timeline");
    if(!items.length){host.innerHTML='<div class="empty-state"><strong>Your day is open.</strong>Add a task or build a habit to start planning.</div>';return;}
    const groups={};
    items.forEach(it=>{const k=it.time||"Any time";(groups[k] ||= []).push(it);});
    host.innerHTML=Object.entries(groups).map(([time,arr])=>`<div class="time-group"><div class="time-label">${escapeHtml(time==="Any time"?"—":timeLabel(time))}</div><div class="time-content">${arr.map(it=>`
      <article class="task-card ${it.done?"done":""}">
        <input class="check" type="checkbox" data-check-kind="${it.kind}" data-id="${it.id}" ${it.done?"checked":""} aria-label="Mark ${escapeHtml(it.title)} complete">
        <div class="task-main"><div class="task-title">${escapeHtml(it.title)}</div><div class="task-meta"><span>${it.kind==="step"?"Habit step":"Task"}</span>${it.kind==="step"?`<span>• ${escapeHtml(it.note||"")}</span>`:""}${it.source.repeat&&it.source.repeat!=="none"?'<span>• Repeats</span>':""}</div>${it.note&&it.kind==="task"?`<div class="task-note">${escapeHtml(it.note)}</div>`:""}</div>
        <div class="task-actions"><button class="tiny-btn" data-edit-kind="${it.kind}" data-id="${it.id}" aria-label="Edit">✎</button><button class="tiny-btn" data-delete-kind="${it.kind}" data-id="${it.id}" aria-label="Delete">×</button></div>
      </article>`).join("")}</div></div>`).join("");
  }
  function renderWater(){
    const h=state.habits.find(x=>x.title.toLowerCase().includes("water")) || state.habits[0];
    const goal=Number(h?.goal||state.waterGoal||2300);
    const waterSteps=(h?.steps||[]).filter(s=>s.amount);
    const amount=waterSteps.reduce((sum,s)=>sum+(s.done?Number(s.amount):0),0);
    $("#waterAmount").textContent=amount.toLocaleString();
    $("#waterProgress").style.width=Math.min(100,amount/goal*100)+"%";
    $("#waterPercent").textContent=`${Math.min(100,Math.round(amount/goal*100))}% complete`;
    $("#waterEntries").innerHTML=waterSteps.slice(0,4).map(s=>`<div class="water-entry"><input class="check" type="checkbox" data-check-kind="step" data-id="${s.id}" ${s.done?"checked":""}><span>${escapeHtml(s.title)}</span><small>${escapeHtml(s.time||"")}</small></div>`).join("");
  }
  function renderSummary(){
    const items=allTodayItems(), done=items.filter(x=>x.done).length, percent=items.length?Math.round(done/items.length*100):0;
    $("#scheduledCount").textContent=items.length;$("#completedCount").textContent=done;$("#habitCount").textContent=state.habits.length;
    $("#dayPercent").textContent=percent+"%";$("#dayRing").style.background=`conic-gradient(var(--green) ${percent}%, #e6e9e3 ${percent}%)`;
    $("#sideProgress").style.width=percent+"%";$("#sideDone").textContent=`${done} of ${items.length} done`;
  }
  function renderHabits(){
    const host=$("#habitsList");
    if(!state.habits.length){host.innerHTML='<div class="empty-state"><strong>No habits yet.</strong>Create a habit and split it into timed steps.</div>';return;}
    host.innerHTML=state.habits.map(h=>{
      const done=h.steps.filter(s=>s.done).length,total=h.steps.length,progress=total?Math.round(done/total*100):0;
      const val=h.steps.reduce((sum,s)=>sum+(s.done?Number(s.amount||0):0),0);
      const goal=Number(h.goal||0);
      return `<article class="habit-card">
        <div class="habit-card-top"><span class="habit-color ${escapeHtml(h.color||"blue")}"></span><div style="min-width:0;flex:1"><h3 class="habit-card-title">${escapeHtml(h.title)}</h3><div class="habit-card-sub">${goal?`${val.toLocaleString()} / ${goal.toLocaleString()} ${escapeHtml(h.unit||"")}`:`${done} of ${total} steps complete`}</div></div><div class="task-actions"><button class="tiny-btn" data-edit-habit="${h.id}" aria-label="Edit habit">✎</button><button class="tiny-btn" data-delete-habit="${h.id}" aria-label="Delete habit">×</button></div></div>
        <div class="habit-progress-line"><span>${progress}% complete</span><strong>${done}/${total}</strong></div><div class="progress-track"><span style="width:${progress}%"></span></div>
        <div class="habit-steps" style="margin-top:15px">${h.steps.slice().sort((a,b)=>(a.time||"99:99").localeCompare(b.time||"99:99")).map(s=>`<div class="habit-step ${s.done?"done":""}"><input class="check" type="checkbox" data-check-kind="step" data-id="${s.id}" ${s.done?"checked":""} aria-label="Complete ${escapeHtml(s.title)}"><span class="step-label">${escapeHtml(s.title)}</span><span class="step-time">${escapeHtml(s.time?timeLabel(s.time):"Any time")}</span><button class="tiny-btn" data-edit-step="${s.id}" data-parent="${h.id}" aria-label="Edit step">✎</button></div>`).join("")}</div>
        <button class="add-step" data-add-step="${h.id}">＋ Add a timed step</button>
      </article>`;
    }).join("");
  }
  function renderRoutines(){
    const host=$("#routinesList");
    if(!state.routines.length){host.innerHTML='<div class="empty-state"><strong>No routines saved.</strong>Create a routine to reuse your favourite set of tasks.</div>';return;}
    host.innerHTML=state.routines.map(r=>`<article class="routine-card"><div class="routine-symbol">▦</div><h3>${escapeHtml(r.title)}</h3><p>${r.steps.length} steps · Reusable checklist</p><div class="routine-steps-preview">${r.steps.slice(0,4).map(s=>`${s.time?escapeHtml(timeLabel(s.time))+" · ":""}${escapeHtml(s.title)}`).join("<br>")}${r.steps.length>4?"<br>…":""}</div><div class="routine-actions"><button class="primary-btn" data-use-routine="${r.id}">Add to today</button><button class="soft-btn" data-edit-routine="${r.id}">Edit</button><button class="soft-btn" data-delete-routine="${r.id}">Delete</button></div></article>`).join("");
  }
  function render(){setDateLabel();renderTimeline();renderWater();renderSummary();renderHabits();renderRoutines();populateParentSelect();}
  function populateParentSelect(){
    const sel=$("#taskParent"),old=sel.value;
    sel.innerHTML='<option value="">No parent habit</option>'+state.habits.map(h=>`<option value="${h.id}">${escapeHtml(h.title)}</option>`).join("");
    if(state.habits.some(h=>h.id===old))sel.value=old;
  }
  function switchView(view){
    $$(".view").forEach(v=>v.classList.toggle("active",v.id==="view-"+view));
    $$("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
    if(view==="settings") $("#settingsBtn")?.classList.add("active");
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function openModal(id){$(id).hidden=false;document.body.style.overflow="hidden";}
  function closeModal(id){$(id).hidden=true;document.body.style.overflow="";}
  function openTask(item=null){
    $("#editorForm").reset();$("#editId").value=item?.id||"";$("#modalTitle").textContent=item?"Edit task":"Add task";
    $("#taskTitle").value=item?.title||"";$("#taskDate").value=item?.date||today();$("#taskTime").value=item?.time||"";
    $("#taskType").value=item?.type||"task";$("#taskRepeat").value=item?.repeat||"none";$("#taskParent").value=item?.parent||"";$("#taskNote").value=item?.note||"";
    openModal("#modalBackdrop");setTimeout(()=>$("#taskTitle").focus(),100);
  }
  function parseSteps(raw){
    return raw.split("\n").map(line=>line.trim()).filter(Boolean).map(line=>{
      const parts=line.split("|");let time="",title=line;
      if(parts.length>1){time=parts[0].trim();title=parts.slice(1).join("|").trim();if(!/^\d{1,2}:\d{2}$/.test(time))time="";}
      const match=title.match(/(\d+(?:\.\d+)?)\s*(ml|l)\b/i);let amount=0;
      if(match){amount=Math.round(Number(match[1])*(match[2].toLowerCase()==="l"?1000:1));}
      return {id:uid(),title,time,amount,done:false};
    });
  }
  function openHabit(habit=null){
    $("#habitForm").reset();$("#habitEditId").value=habit?.id||"";$("#habitModalTitle").textContent=habit?"Edit habit":"New habit";
    $("#habitTitle").value=habit?.title||"";$("#habitGoal").value=habit?.goal||"";$("#habitUnit").value=habit?.unit||"";$("#habitColor").value=habit?.color||"blue";
    $("#habitSteps").value=(habit?.steps||[]).map(s=>`${s.time||""}${s.time?" | ":""}${s.title}`).join("\n");
    openModal("#habitBackdrop");setTimeout(()=>$("#habitTitle").focus(),100);
  }
  function openRoutine(routine=null){
    $("#routineForm").reset();$("#routineEditId").value=routine?.id||"";$("#routineModalTitle").textContent=routine?"Edit routine":"New routine";
    $("#routineTitle").value=routine?.title||"";$("#routineSteps").value=(routine?.steps||[]).map(s=>`${s.time||""}${s.time?" | ":""}${s.title}`).join("\n");
    openModal("#routineBackdrop");setTimeout(()=>$("#routineTitle").focus(),100);
  }
  function findStep(id){for(const h of state.habits){const s=h.steps.find(s=>s.id===id);if(s)return {habit:h,step:s};}return null;}
  function toggleItem(kind,id,checked){
    if(kind==="task"){const t=state.tasks.find(t=>t.id===id);if(t)t.done=checked;}
    else {const found=findStep(id);if(found)found.step.done=checked;}
    save();
  }
  function deleteItem(kind,id){
    if(kind==="task")state.tasks=state.tasks.filter(t=>t.id!==id);
    else state.habits.forEach(h=>h.steps=h.steps.filter(s=>s.id!==id));
    save();toast("Item removed");
  }
  document.addEventListener("click",e=>{
    const view=e.target.closest("[data-view]");if(view){switchView(view.dataset.view);return;}
    if(e.target.closest("#addTaskBtn")||e.target.closest("#addTop")||e.target.closest("#mobileAdd")){openTask();return;}
    if(e.target.closest("#addHabitBtn")){openHabit();return;}
    if(e.target.closest("#addRoutineBtn")){openRoutine();return;}
    if(e.target.closest("#settingsBtn")){switchView("settings");return;}
    if(e.target.closest("#mobileMenu")){switchView("today");return;}
    if(e.target.closest("#editWater")){const h=state.habits.find(x=>x.title.toLowerCase().includes("water"))||state.habits[0];if(h)openHabit(h);else openHabit();return;}
    if(e.target.closest("#addWater")){const h=state.habits.find(x=>x.title.toLowerCase().includes("water"));if(h){const s={id:uid(),title:"250 ml water",time:"",amount:250,done:true};h.steps.push(s);save();toast("250 ml logged");}else toast("Create a water habit first");return;}
    const check=e.target.closest("[data-check-kind]");if(check){toggleItem(check.dataset.checkKind,check.dataset.id,check.checked);return;}
    const edit=e.target.closest("[data-edit-kind]");if(edit){if(edit.dataset.editKind==="task"){const t=state.tasks.find(x=>x.id===edit.dataset.id);if(t)openTask(t);}else{const f=findStep(edit.dataset.id);if(f){const title=prompt("Step name",f.step.title);if(title===null)return;const time=prompt("Time (24-hour HH:MM, or leave blank)",f.step.time||"");f.step.title=title.trim()||f.step.title;f.step.time=(time||"").trim();save();}}return;}
    const del=e.target.closest("[data-delete-kind]");if(del){if(confirm("Delete this item?"))deleteItem(del.dataset.deleteKind,del.dataset.id);return;}
    const eh=e.target.closest("[data-edit-habit]");if(eh){const h=state.habits.find(x=>x.id===eh.dataset.editHabit);if(h)openHabit(h);return;}
    const dh=e.target.closest("[data-delete-habit]");if(dh){if(confirm("Delete this habit and its steps?")){state.habits=state.habits.filter(x=>x.id!==dh.dataset.deleteHabit);save();}return;}
    const as=e.target.closest("[data-add-step]");if(as){const h=state.habits.find(x=>x.id===as.dataset.addStep);if(h){const title=prompt("Step name");if(!title)return;const time=prompt("Time (24-hour HH:MM, optional)","08:00")||"";h.steps.push({id:uid(),title:title.trim(),time:time.trim(),amount:(title.match(/(\d+(?:\.\d+)?)\s*(ml|l)\b/i)||[]).length?Math.round(Number(title.match(/(\d+(?:\.\d+)?)\s*(ml|l)\b/i)[1])*(title.match(/(\d+(?:\.\d+)?)\s*(ml|l)\b/i)[2].toLowerCase()==="l"?1000:1)):0,done:false});save();}return;}
    const es=e.target.closest("[data-edit-step]");if(es){const f=findStep(es.dataset.editStep);if(f){const title=prompt("Step name",f.step.title);if(title===null)return;const time=prompt("Time (24-hour HH:MM, optional)",f.step.time||"");f.step.title=title.trim()||f.step.title;f.step.time=(time||"").trim();save();}return;}
    const use=e.target.closest("[data-use-routine]");if(use){const r=state.routines.find(x=>x.id===use.dataset.useRoutine);if(r){r.steps.forEach(s=>state.tasks.push({id:uid(),title:s.title,date:today(),time:s.time||"",type:"task",repeat:"none",done:false,note:""}));save();toast("Routine added to today");switchView("today");}return;}
    const er=e.target.closest("[data-edit-routine]");if(er){const r=state.routines.find(x=>x.id===er.dataset.editRoutine);if(r)openRoutine(r);return;}
    const dr=e.target.closest("[data-delete-routine]");if(dr){if(confirm("Delete this routine template?")){state.routines=state.routines.filter(x=>x.id!==dr.dataset.deleteRoutine);save();}return;}
    if(e.target.closest("#exportBtn")){const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`dayflow-backup-${today()}.json`;a.click();URL.revokeObjectURL(a.href);toast("Backup exported");return;}
    if(e.target.closest("#resetBtn")){if(confirm("Delete all Dayflow data on this device? This cannot be undone.")){state=stateDefault();save();toast("Planner reset");}return;}
    if(e.target.closest("#searchBtn")){const q=prompt("Search tasks and habits");if(q){const found=[...state.tasks.filter(t=>t.title.toLowerCase().includes(q.toLowerCase())),...state.habits.filter(h=>h.title.toLowerCase().includes(q.toLowerCase()))];alert(found.length?found.map(x=>x.title).join("\n"):"No matches found.");}return;}
    if(e.target.classList.contains("close-modal"))closeModal("#modalBackdrop");
    if(e.target.classList.contains("close-habit"))closeModal("#habitBackdrop");
    if(e.target.classList.contains("close-routine"))closeModal("#routineBackdrop");
  });
  $("#editorForm").addEventListener("submit",e=>{
    e.preventDefault();const id=$("#editId").value;
    const obj={id:id||uid(),title:$("#taskTitle").value.trim(),date:$("#taskDate").value||today(),time:$("#taskTime").value,type:$("#taskType").value,repeat:$("#taskRepeat").value,parent:$("#taskParent").value,done:false,note:$("#taskNote").value.trim()};
    if(!obj.title)return;
    if(id){const old=state.tasks.find(t=>t.id===id);if(old)Object.assign(old,obj,{done:old.done});else state.tasks.push(obj);}
    else state.tasks.push(obj);
    save();closeModal("#modalBackdrop");toast(id?"Task updated":"Task added");
  });
  $("#habitForm").addEventListener("submit",e=>{
    e.preventDefault();const id=$("#habitEditId").value, old=state.habits.find(h=>h.id===id);
    const newSteps=parseSteps($("#habitSteps").value);
    if(old){
      const oldByTitle=new Map(old.steps.map(s=>[`${s.time}|${s.title}`,s]));
      newSteps.forEach(s=>{const prev=oldByTitle.get(`${s.time}|${s.title}`);if(prev){s.id=prev.id;s.done=prev.done;s.amount=prev.amount||s.amount;}});
    }
    const habit={id:id||uid(),title:$("#habitTitle").value.trim(),goal:Number($("#habitGoal").value)||0,unit:$("#habitUnit").value.trim(),color:$("#habitColor").value,steps:newSteps};
    if(!habit.title)return;
    if(old)state.habits=state.habits.map(h=>h.id===id?habit:h);else state.habits.push(habit);
    save();closeModal("#habitBackdrop");toast(id?"Habit updated":"Habit created");
  });
  $("#routineForm").addEventListener("submit",e=>{
    e.preventDefault();const id=$("#routineEditId").value;
    const routine={id:id||uid(),title:$("#routineTitle").value.trim(),steps:parseSteps($("#routineSteps").value).map(s=>({title:s.title,time:s.time}))};
    if(!routine.title)return;
    if(id)state.routines=state.routines.map(r=>r.id===id?routine:r);else state.routines.push(routine);
    save();closeModal("#routineBackdrop");toast(id?"Routine updated":"Routine saved");
  });
  $("#importFile").addEventListener("change",async e=>{
    const f=e.target.files?.[0];if(!f)return;
    try{const data=JSON.parse(await f.text());if(!data.tasks||!data.habits||!data.routines)throw new Error("Invalid backup");state=data;save();toast("Backup restored");}
    catch{toast("That backup file could not be imported.");}
    e.target.value="";
  });
  $$(".close-modal").forEach(b=>b.addEventListener("click",()=>closeModal("#modalBackdrop")));
  $$(".close-habit").forEach(b=>b.addEventListener("click",()=>closeModal("#habitBackdrop")));
  $$(".close-routine").forEach(b=>b.addEventListener("click",()=>closeModal("#routineBackdrop")));
  ["#modalBackdrop","#habitBackdrop","#routineBackdrop"].forEach(sel=>$(sel).addEventListener("click",e=>{if(e.target===e.currentTarget)closeModal(sel);}));
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeModal("#modalBackdrop");closeModal("#habitBackdrop");closeModal("#routineBackdrop");}});
  ensureRecurring();render();
  if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(()=>{});
})();