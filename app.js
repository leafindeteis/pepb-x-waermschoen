// PEPB x WärmSchöN: the map, the door list and the connection to Supabase.
const inArea = p => { let c = false; for (let i = 0, j = AREA.length - 1; i < AREA.length; j = i++) { if ((AREA[i][0] > p[0]) !== (AREA[j][0] > p[0]) && p[1] < (AREA[j][1] - AREA[i][1]) * (p[0] - AREA[i][0]) / (AREA[j][0] - AREA[i][0]) + AREA[i][1]) c = !c; } return c; };

const RESULTS = {
  none:     { label: "Nobody home", short: "nobody home", tok: "--st-none", rank: 1 },
  open:     { label: "Opened, no conversation", short: "no conversation", tok: "--st-open", rank: 2 },
  talk:     { label: "Had a conversation", short: "conversation", tok: "--st-talk", rank: 3 },
  noaccess: { label: "No access", short: "no access", tok: "--st-noaccess", rank: 0 },
};
const REASONS = { unclear: "Unclear", language: "Language", time: "Time", interest: "Lack of interest", confidence: "Lack of self-confidence", age: "Age", other: "Other" };
const DEFAULT_LEVELS = 5;
const floorName = f => f === 0 ? "Ground floor" : f + ((f % 100 > 10 && f % 100 < 14) ? "th" : ([, "st", "nd", "rd"][f % 10] || "th")) + " floor";
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const $ = id => document.getElementById(id);
const fmtTime = iso => { const d = new Date(iso); return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + ", " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); };

// ---------- state ----------
const byId = new Map(DATA.b.map(b => [b.id, b]));
let visits = [];               // [{id, b, f, d, r, name, by, at}]
let extraFloors = {};          // buildingId -> floors added by hand
let doorCounts = {};           // "<buildingId>_<floor>" -> doors on that floor
let selected = null, selFloor = null, selDoor = 0, openOnly = false;
let me = null, canWrite = false, myName = "", saving = false;

// ---------- map ----------
const map = L.map("map", { preferCanvas: true, zoomControl: true, minZoom: 15, maxZoom: 20, zoomSnap: 0.5, attributionControl: true });
map.attributionControl.setPrefix(false).addAttribution('Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors');
const all = L.latLngBounds(DATA.b.map(b => b.p[0]));
map.fitBounds(all, { padding: [10, 10] });
map.setMaxBounds(all.pad(0.1));

const parkLayer = L.layerGroup().addTo(map), streetLayer = L.layerGroup().addTo(map), houseLayer = L.layerGroup().addTo(map), labelLayer = L.layerGroup(), landmarkLayer = L.layerGroup().addTo(map);
const shapes = new Map();

function drawBase() {
  parkLayer.clearLayers(); streetLayer.clearLayers();
  DATA.g.forEach(g => L.polygon(g.p, { stroke: false, fillColor: css("--park"), fillOpacity: 1, interactive: false }).addTo(parkLayer));
  DATA.s.forEach(s => {
    const w = { primary: 9, secondary: 8, tertiary: 7, pedestrian: 5 }[s.k] || 5;
    L.polyline(s.p, { color: css("--street"), weight: w, opacity: 1, lineCap: "round", interactive: false }).addTo(streetLayer);
  });
  // Everything outside the sharp area is painted over, with a soft edge.
  L.polygon([[[53, 13], [53, 14], [52, 14], [52, 13]], AREA], { fillColor: css("--bg"), fillOpacity: 1, color: css("--bg"), weight: 14, opacity: 0.55, interactive: false }).addTo(streetLayer);
}
function drawLabels() {
  labelLayer.clearLayers();
  const best = {};
  DATA.s.forEach(s => { if (!s.n || !inArea(s.p[Math.floor(s.p.length / 2)])) return; const len = s.p.length; if (!best[s.n] || len > best[s.n].p.length) best[s.n] = s; });
  Object.values(best).forEach(s => {
    const mid = s.p[Math.floor(s.p.length / 2)];
    L.tooltip({ permanent: true, direction: "center", className: "lbl", interactive: false }).setLatLng(mid).setContent(s.n).addTo(labelLayer);
  });
  landmarkLayer.clearLayers();
  DATA.u.forEach(u => L.marker(u.p, { interactive: false, icon: L.divIcon({ className: "", html: '<span class="ubahn"><i>U</i>' + u.n + "</span>", iconSize: null, iconAnchor: [8, 8] }) }).addTo(landmarkLayer));
  PARK_LABELS.forEach(p => L.tooltip({ permanent: true, direction: "center", className: "lbl", interactive: false }).setLatLng(p.p).setContent(p.n).addTo(landmarkLayer));
}
DATA.b.forEach(b => {
  const poly = L.polygon(b.p, { weight: 0.6, bubblingMouseEvents: false });
  poly.on("click", () => select(b.id));
  poly.addTo(houseLayer);
  shapes.set(b.id, poly);
});
const toggleLabels = () => { if (map.getZoom() >= 17) labelLayer.addTo(map); else labelLayer.remove(); };
map.on("zoomend", toggleLabels);
drawBase(); drawLabels(); toggleLabels();

// ---------- derived ----------
function levels(b) { return (b.l && b.l > 0 ? b.l : DEFAULT_LEVELS) + (extraFloors[b.id] || 0); }
function visitsFor(bid) { return visits.filter(v => v.b === bid).sort((a, c) => c.at.localeCompare(a.at)); }
const doorCount = (bid, f) => Math.max(1, doorCounts[bid + "_" + f] || 1);
const doorKey = (f, d) => f + "_" + (d || 0);
const placeName = (bid, f, d) => floorName(f) + (doorCount(bid, f) > 1 ? ", door " + ((d || 0) + 1) : "");
function doorStatus(bid) {
  const out = {};
  visitsFor(bid).forEach(v => { if (v.f == null) return; const k = doorKey(v.f, v.d), cur = out[k]; if (!cur || RESULTS[v.r].rank > RESULTS[cur.r].rank) out[k] = v; });
  return out;
}
function houseStatus(b) {
  const vs = visitsFor(b.id);
  if (!vs.length) return null;
  // Conversations are counted per door, so a saved-twice entry doesn't turn a house dark green.
  const doors = Object.values(doorStatus(b.id));
  const talks = doors.filter(v => v.r === "talk").length;
  const tok = talks >= 2 ? "--house-talk2" : talks === 1 ? "--house-talk1" : doors.some(v => v.r === "open") ? "--st-open" : "--st-none";
  return { tok, talks };
}
function styleHouses() {
  const base = css("--house"), edge = css("--house-edge");
  let visited = 0, talks = 0;
  DATA.b.forEach(b => {
    const st = houseStatus(b), s = shapes.get(b.id);
    if (st) visited++;
    if (st) {
      s.setStyle({ fillColor: css(st.tok), fillOpacity: openOnly ? 0.18 : 1, color: edge, opacity: openOnly ? 0.3 : 1, weight: b.id === selected ? 2.5 : 0.6 });
    } else {
      s.setStyle({ fillColor: base, fillOpacity: 1, color: edge, opacity: 1, weight: b.id === selected ? 2.5 : 0.6 });
    }
    if (b.id === selected) s.setStyle({ color: css("--accent") });
  });
  visits.forEach(v => { if (v.r === "talk") talks++; });
  $("stats").innerHTML = "";
  const parts = [[visited, " of " + DATA.b.length + " houses visited"], [talks, talks === 1 ? " conversation" : " conversations"], [visits.length, visits.length === 1 ? " entry" : " entries"]];
  parts.forEach(([n, t], i) => { const b = document.createElement("b"); b.textContent = n; $("stats").append(b, t + (i < parts.length - 1 ? " · " : "")); });
}

// ---------- sheet ----------
function select(bid) {
  selected = bid; selFloor = null;
  styleHouses(); renderSheet();
}
function closeSheet() { selected = null; selFloor = null; $("sheet").hidden = true; styleHouses(); }

async function renderSheet() {
  const sh = $("sheet");
  if (!selected) { sh.hidden = true; return; }
  const b = byId.get(selected), vs = visitsFor(b.id), fs = doorStatus(b.id), n = levels(b);
  const who = v => v.name || "Someone";

  sh.replaceChildren();
  const head = el("div", "sheet-head");
  const t = el("div");
  t.append(el("h2", null, b.a.length ? b.a.join(" / ") : "House without an address"));
  t.append(el("p", null, n + (n === 1 ? " floor" : " floors") + (b.l ? "" : " (estimated)") + " · " + (vs.length ? vs.length + (vs.length === 1 ? " entry" : " entries") : "not visited yet")));
  const x = el("button", "close", "×"); x.setAttribute("aria-label", "Close"); x.onclick = closeSheet;
  head.append(t, x); sh.append(head);

  sh.append(el("h3", null, "Tap a door to log a visit"));
  const list = el("div", "floors");
  for (let f = n - 1; f >= 0; f--) {
    const doors = doorCount(b.id, f), group = el("div", "floor-group");
    for (let d = 0; d < doors; d++) {
      const v = fs[doorKey(f, d)], isOpen = selFloor === f && selDoor === d;
      const row = el("div", "floor-row");
      const btn = el("button", "floor"); btn.type = "button"; btn.id = "floor-" + f + "-" + d;
      btn.setAttribute("aria-pressed", String(isOpen));
      const name = el("span");
      name.append(el("b", null, floorName(f)));
      if (doors > 1) name.append(el("small", null, "Door " + (d + 1)));
      btn.append(name);
      btn.append(el("span", "last", v ? who(v) + ", " + fmtTime(v.at) : ""));
      const pill = el("span", "pill" + (v ? "" : " empty"), v ? RESULTS[v.r].short : "not rung");
      if (v) pill.style.background = css(RESULTS[v.r].tok);
      btn.append(pill);
      btn.onclick = () => { selFloor = isOpen ? null : f; selDoor = d; renderSheet().then(() => { const fm = $("entry"); if (fm) fm.scrollIntoView({ block: "nearest" }); }); };
      row.append(btn);
      if (canWrite && d === 0) {
        const add = el("button", "doorbtn", "+ door"); add.type = "button"; add.setAttribute("aria-label", "Add a door on the " + floorName(f));
        add.onclick = () => changeDoors(b, f, 1);
        row.append(add);
      } else if (canWrite && d === doors - 1 && !v) {
        const rem = el("button", "doorbtn", "− door"); rem.type = "button"; rem.setAttribute("aria-label", "Remove door " + (d + 1) + " on the " + floorName(f));
        rem.onclick = () => changeDoors(b, f, -1);
        row.append(rem);
      } else if (canWrite) row.append(el("span", "door-slot"));
      group.append(row);
      if (isOpen) group.append(entryForm(b, f, d));
    }
    list.append(group);
  }
  sh.append(list);

  const tools = el("div", "floor-tools");
  if (canWrite) {
    const more = el("button", "linkbtn", "+ Add floor"); more.type = "button"; more.onclick = () => changeFloors(b, 1);
    tools.append(more);
    if (extraFloors[b.id] > 0 && !vs.some(v => v.f === n - 1)) { const less = el("button", "linkbtn", "− Remove floor"); less.type = "button"; less.onclick = () => changeFloors(b, -1); tools.append(less); }
    const na = el("button", "linkbtn", "Couldn't get into the building"); na.type = "button"; na.style.marginLeft = "auto";
    na.onclick = () => save({ b: b.id, f: null, r: "noaccess" });
    tools.append(na);
  }
  sh.append(tools);

  sh.append(el("h3", null, "History"));
  if (!vs.length) sh.append(el("p", "empty-log", "Every entry for this house will show here once someone has rung."));
  else {
    const ul = el("ul", "log");
    vs.forEach(v => {
      const li = el("li");
      const p = el("span", "pill", v.f == null ? "House" : placeName(v.b, v.f, v.d)); p.style.background = css(RESULTS[v.r].tok);
      li.append(p, el("span", null, RESULTS[v.r].label));
      const right = el("span", "who", who(v) + " · " + fmtTime(v.at));
      li.append(right);
      if (me && v.by === me.id && canWrite) {
        const d = el("button", "del", "Delete"); d.type = "button"; d.onclick = () => remove(v.id);
        const wrap = el("span"); wrap.style.gridColumn = "3"; wrap.append(d); li.append(wrap);
      }
      ul.append(li);
    });
    sh.append(ul);
  }
  sh.hidden = false;
}

function entryForm(b, f, d) {
  const fm = el("form"); fm.id = "entry";
  const fsx = el("fieldset"); fsx.append(el("legend", null, placeName(b.id, f, d) + ": What happened?"));
  const ch = el("div", "choices");
  ["none", "open", "talk"].forEach(k => {
    const inp = el("input"); inp.type = "radio"; inp.name = "r"; inp.value = k; inp.id = "r-" + k;
    const lab = el("label", null, RESULTS[k].label); lab.htmlFor = inp.id; lab.style.color = css(RESULTS[k].tok);
    ch.append(inp, lab);
  });
  fsx.append(ch); fm.append(fsx);
  const why = el("fieldset"); why.hidden = true;
  why.append(el("legend", null, "Why was there no conversation?"));
  const wc = el("div", "choices reasons");
  Object.entries(REASONS).forEach(([k, label]) => {
    const inp = el("input"); inp.type = "radio"; inp.name = "reason"; inp.value = k; inp.id = "reason-" + k;
    const lab = el("label", null, label); lab.htmlFor = inp.id;
    wc.append(inp, lab);
  });
  why.append(wc); fm.append(why);
  const go = el("button", "primary", "Save entry"); go.type = "submit"; go.disabled = true;
  fm.addEventListener("change", () => {
    const needsReason = fm.r.value === "open";
    why.hidden = !needsReason;
    go.disabled = !canWrite || !fm.r.value || (needsReason && !fm.reason.value);
  });
  fm.addEventListener("submit", e => { e.preventDefault(); if (!fm.r.value || (fm.r.value === "open" && !fm.reason.value)) return; save({ b: b.id, f, d, r: fm.r.value, reason: fm.reason.value }); });
  fm.append(go);
  return fm;
}

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
let toastT; function toast(msg) { const t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2600); }
function banner(msg) { $("banner").textContent = msg || ""; $("banner").hidden = !msg; }

// ---------- class code and first name ----------
const cfg = window.PEPB_CONFIG || {};
const sb = cfg.supabaseUrl && cfg.supabaseKey ? supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey) : null;
const cleanName = s => String(s || "").trim().replace(/\s+/g, " ").slice(0, 30);
let joining = true;

function showName() { const w = $("whoami"); w.textContent = myName + " · change"; w.setAttribute("aria-label", "Change your first name, currently " + myName); w.hidden = !myName; }
function checkGate() { $("nameSave").disabled = !cleanName($("firstName").value) || (joining && !$("classCode").value.trim()); }
function gateError(msg) { $("gateError").textContent = msg || ""; $("gateError").hidden = !msg; }
function openGate() {
  joining = !myName;
  $("gateTitle").textContent = joining ? "Join the map" : "Change your first name";
  $("gateHint").textContent = joining
    ? "Your first name appears next to the doors you log, so the group can see who rang where. Your first name is enough."
    : "Doors you already logged keep the old name.";
  $("codeField").hidden = !joining;
  $("firstName").value = myName;
  $("nameCancel").hidden = joining;
  gateError(""); checkGate();
  $("namegate").hidden = false;
  (joining ? $("classCode") : $("firstName")).focus();
}
const JOIN_ERRORS = {
  wrong_code: "That class code isn't right. Please check it and try again.",
  too_many: "Too many wrong tries. Please wait 10 minutes and try again.",
  no_code_set: "The class code hasn't been set up yet. Please tell your teacher.",
  bad_name: "Please enter your first name.",
  not_signed_in: "Joining didn't work. Please reload the page and try again.",
};
async function join(code, name) {
  let { data: { session } } = await sb.auth.getSession();
  if (!session) {
    const res = await sb.auth.signInAnonymously();
    if (res.error) throw res.error;
    session = res.data.session;
  }
  const { data: status, error } = await sb.rpc("join_class", { p_code: code, p_first_name: name });
  if (error) throw error;
  if (status !== "ok") { gateError(JOIN_ERRORS[status] || JOIN_ERRORS.not_signed_in); return; }
  me = session.user; myName = name; canWrite = true;
  $("classCode").value = "";
  $("namegate").hidden = true;
  showName(); connect();
}
async function rename(name) {
  const { data, error } = await sb.rpc("set_first_name", { p_first_name: name });
  if (error) throw error;
  myName = data; showName();
  $("namegate").hidden = true;
}
$("classCode").addEventListener("input", checkGate);
$("firstName").addEventListener("input", checkGate);
$("nameForm").addEventListener("submit", async e => {
  e.preventDefault();
  const n = cleanName($("firstName").value);
  if (!n || !sb) return;
  $("nameSave").disabled = true; gateError("");
  try { if (joining) await join($("classCode").value, n); else await rename(n); }
  catch (err) { gateError("That didn't work. Please check your connection and try again."); }
  checkGate();
});
$("nameCancel").onclick = () => { $("namegate").hidden = true; };
$("whoami").onclick = openGate;

// ---------- writes ----------
async function save(entry) {
  if (saving) return;
  saving = true;
  const { error } = entry.r === "open"
    ? await sb.rpc("log_no_conversation", { p_building: entry.b, p_floor: entry.f, p_door: entry.d || 0, p_reason: entry.reason })
    : await sb.from("visits").insert({ building_id: entry.b, floor: entry.f, door: entry.d || 0, result: entry.r });
  saving = false;
  if (error) { writeError(error); return; }
  toast(entry.r === "noaccess" ? "Saved: no access" : "Saved: " + placeName(entry.b, entry.f, entry.d) + ", " + RESULTS[entry.r].short);
  selFloor = null;
  await refresh();
}
async function remove(id) {
  const { error } = await sb.from("visits").delete().eq("id", id);
  if (error) { writeError(error); return; }
  toast("Entry deleted");
  await refresh();
}
async function changeDoors(b, f, delta) {
  const { error } = await sb.rpc("change_doors", { p_building: b.id, p_floor: f, p_delta: delta });
  if (error) {
    if (/door_in_use/.test(error.message)) { toast("Someone just logged a visit at that door, so it stays."); await refresh(); }
    else writeError(error);
    return;
  }
  await refresh();
  if (selFloor === f && selDoor >= doorCount(b.id, f)) { selFloor = null; renderSheet(); }
}
async function changeFloors(b, delta) {
  const { error } = await sb.rpc("change_floors", { p_building: b.id, p_delta: delta });
  if (error) { writeError(error); return; }
  await refresh();
}
function writeError() { toast("Saving didn't work. Please try again in a moment."); }

// ---------- reads ----------
// Supabase returns at most 1000 rows per request, so longer tables are read page by page.
async function readAll(table, columns) {
  const size = 1000, rows = [];
  for (let from = 0; ; from += size) {
    const { data, error } = await sb.from(table).select(columns).order(table === "visits" ? "id" : "building_id").range(from, from + size - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < size) return rows;
  }
}
async function refresh() {
  if (!me || !canWrite) return;
  try {
    const [vs, ds, fs] = await Promise.all([
      readAll("visits", "id,building_id,floor,door,result,first_name,created_by,created_at"),
      readAll("door_counts", "building_id,floor,count"),
      readAll("floor_extras", "building_id,extra"),
    ]);
    visits = vs.filter(v => byId.has(v.building_id) && RESULTS[v.result])
      .map(v => ({ id: v.id, b: v.building_id, f: v.floor, d: v.door, r: v.result, name: v.first_name, by: v.created_by, at: v.created_at }));
    doorCounts = {}; ds.forEach(d => { doorCounts[d.building_id + "_" + d.floor] = d.count; });
    extraFloors = {}; fs.forEach(x => { extraFloors[x.building_id] = x.extra; });
    banner("");
    styleHouses();
    if (selected && !$("entry")) renderSheet();
  } catch (e) { banner("The shared entries can't be loaded right now. The map may be out of date."); }
}
// Live updates arrive in bursts, so wait a moment and read once. The random part stops 20 phones reading at the same instant.
let refreshT;
function refreshSoon() { clearTimeout(refreshT); refreshT = setTimeout(refresh, 400 + Math.random() * 600); }
function connect() {
  const channel = sb.channel("map");
  ["visits", "door_counts", "floor_extras"].forEach(table => channel.on("postgres_changes", { event: "*", schema: "public", table }, refreshSoon));
  channel.subscribe(status => { if (status === "SUBSCRIBED") refresh(); });
  // Phones sleep between doors, so catch up when one wakes, and check once a minute in case a live update was missed.
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
  addEventListener("online", refresh);
  setInterval(() => { if (!document.hidden) refresh(); }, 60000);
  refresh();
}

// ---------- search & filter ----------
const addrIndex = new Map();
DATA.b.forEach(b => b.a.forEach(a => addrIndex.set(a.toLowerCase(), b.id)));
$("addrs").append(...[...addrIndex.keys()].sort().map(k => { const o = document.createElement("option"); o.value = DATA.b.find(b => b.id === addrIndex.get(k)).a.find(a => a.toLowerCase() === k); return o; }));
$("search").addEventListener("change", e => {
  const id = addrIndex.get(e.target.value.trim().toLowerCase());
  if (!id) { toast("Address not found"); return; }
  map.flyToBounds(shapes.get(id).getBounds(), { maxZoom: 19 }); select(id); e.target.blur();
});
$("openOnly").onclick = e => { openOnly = !openOnly; e.currentTarget.setAttribute("aria-pressed", String(openOnly)); styleHouses(); };

// theme changes: recolor
const mq = matchMedia("(prefers-color-scheme: dark)");
const recolor = () => { drawBase(); shapes.forEach(s => s.bringToFront()); styleHouses(); renderSheet(); };
mq.addEventListener && mq.addEventListener("change", recolor);
new MutationObserver(recolor).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
styleHouses();

// ---------- start ----------
(async () => {
  if (!sb) { $("stats").textContent = "Not connected to a database yet"; return; }
  $("stats").textContent = "Enter the class code to see entries";
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
      const { data, error } = await sb.from("members").select("first_name").eq("user_id", session.user.id).maybeSingle();
      if (error) throw error;
      if (data) {
        me = session.user; myName = data.first_name; canWrite = true;
        showName(); connect();
        return;
      }
    }
    openGate();
  } catch (e) { banner("Can't reach the database right now. Please check your connection and reload."); }
})();
