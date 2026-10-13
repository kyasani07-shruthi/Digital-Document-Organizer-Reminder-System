const $ = (id) => document.getElementById(id);
const authDialog = $("authDialog");
const dashboard = $("dashboard");
const homeSections = [document.querySelector(".topbar"), document.querySelector(".hero"), document.querySelector(".features"), document.querySelector("footer")];
let documents = JSON.parse(localStorage.getItem("docvault_documents") || "[]");
let editingId = null;
let user = localStorage.getItem("docvault_user") || "";

function openAuth(){ if (authDialog.showModal) authDialog.showModal(); else authDialog.setAttribute("open",""); }
$("signInBtn").addEventListener("click", openAuth);
$("getStartedBtn").addEventListener("click", openAuth);
$("authForm").addEventListener("submit", (e) => {
  e.preventDefault();
  user = $("userName").value.trim() || "Guest";
  localStorage.setItem("docvault_user", user);
  authDialog.close();
  showDashboard();
});
$("backHome").addEventListener("click", () => {
  dashboard.classList.add("hidden");
  homeSections.forEach(el => el.classList.remove("hidden"));
  window.scrollTo({top:0,behavior:"smooth"});
});
$("addDocBtn").addEventListener("click", () => {
  editingId = null;
  $("docForm").reset();
  $("formTitle").textContent = "Add a document";
  $("docForm").classList.remove("hidden");
  $("docName").focus();
});
$("cancelForm").addEventListener("click", () => $("docForm").classList.add("hidden"));
$("searchInput").addEventListener("input", renderDocuments);
$("filterSelect").addEventListener("change", renderDocuments);

function showDashboard(){
  homeSections.forEach(el => el.classList.add("hidden"));
  dashboard.classList.remove("hidden");
  $("welcomeTitle").textContent = `Welcome, ${user}`;
  renderDocuments();
  window.scrollTo({top:0,behavior:"smooth"});
}
function save(){ localStorage.setItem("docvault_documents", JSON.stringify(documents)); renderDocuments(); }
function statusFor(dateString){
  const today = new Date(); today.setHours(0,0,0,0);
  const expiry = new Date(dateString + "T00:00:00");
  const days = Math.ceil((expiry - today) / 86400000);
  if(days < 0) return {key:"expired", label:`Expired ${Math.abs(days)} day${Math.abs(days)===1?"":"s"} ago`, days};
  if(days <= 30) return {key:"soon", label:days===0?"Expires today":`Expires in ${days} day${days===1?"":"s"}`, days};
  return {key:"ok", label:"Up to date", days};
}
$("docForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const item = {
    id: editingId || (Date.now().toString(36) + Math.random().toString(36).slice(2,7)),
    name: $("docName").value.trim(),
    category: $("docCategory").value,
    issueDate: $("issueDate").value,
    expiryDate: $("expiryDate").value
  };
  if(!item.name || !item.expiryDate) return;
  if(editingId) documents = documents.map(d => d.id === editingId ? item : d);
  else documents.unshift(item);
  $("docForm").classList.add("hidden");
  save();
});
function renderDocuments(){
  const query = $("searchInput").value.toLowerCase().trim();
  const filter = $("filterSelect").value;
  const counts = {ok:0,soon:0,expired:0};
  documents.forEach(d => counts[statusFor(d.expiryDate).key]++);
  $("totalCount").textContent = documents.length;
  $("soonCount").textContent = counts.soon;
  $("expiredCount").textContent = counts.expired;
  $("previewTotal").textContent = String(Math.max(8, documents.length)).padStart(2,"0");
  const list = $("documentList");
  list.innerHTML = "";
  const filtered = documents.filter(d => {
    const s = statusFor(d.expiryDate);
    return (filter === "all" || filter === s.key) &&
      (d.name.toLowerCase().includes(query) || d.category.toLowerCase().includes(query));
  });
  $("emptyState").classList.toggle("hidden", filtered.length > 0);
  filtered.forEach(d => {
    const s = statusFor(d.expiryDate);
    const row = document.createElement("div");
    row.className = "document-item";
    const symbol = document.createElement("span"); symbol.className = "doc-symbol blue"; symbol.textContent = "▤";
    const info = document.createElement("div"); info.className = "doc-info";
    const title = document.createElement("b"); title.textContent = d.name;
    const meta = document.createElement("small"); meta.className = "doc-meta";
    meta.textContent = `${d.category}${d.issueDate ? " · Issued " + d.issueDate : ""} · Expires ${d.expiryDate}`;
    info.append(title, meta);
    const badge = document.createElement("span"); badge.className = "status " + (s.key === "ok" ? "status-green" : "status-amber");
    if(s.key === "expired") { badge.className = "status"; badge.style.background = "#fff0f1"; badge.style.color = "var(--red)"; }
    badge.textContent = s.label;
    const actions = document.createElement("div"); actions.className = "item-actions";
    const edit = document.createElement("button"); edit.className = "btn btn-outline"; edit.textContent = "Edit"; edit.addEventListener("click", () => editDocument(d.id));
    const del = document.createElement("button"); del.className = "delete-btn"; del.textContent = "Delete"; del.addEventListener("click", () => {
      if(confirm(`Delete "${d.name}"?`)){ documents = documents.filter(x => x.id !== d.id); save(); }
    });
    actions.append(edit,del); row.append(symbol,info,badge,actions); list.append(row);
  });
}
function editDocument(id){
  const d = documents.find(x => x.id === id); if(!d) return;
  editingId = id; $("formTitle").textContent = "Edit document";
  $("docName").value = d.name; $("docCategory").value = d.category;
  $("issueDate").value = d.issueDate || ""; $("expiryDate").value = d.expiryDate;
  $("docForm").classList.remove("hidden"); $("docForm").scrollIntoView({behavior:"smooth",block:"center"});
}
if(user){ $("userName").value = user; }
