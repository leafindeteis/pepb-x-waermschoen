// PEPB x WärmSchöN: the interview form. Answers are never linked to an address, a door or a student.

// ---------- questions ----------
// t: choice (one answer), multi (several), yesno, number, text, short (one-line text).
// for: "any" = shown once owner or tenant is chosen; "tenant" / "owner" = only for them. No "for" = always shown.
// other: the text field shown when "other" is chosen.
const Q = [
  { s: "person" },
  { k: "age", t: "choice", o: ["18-25", "25-30", "30-40", "40-50", "50-60", "60-70", "70+"] },
  { k: "gender", t: "choice", o: ["m", "f", "d"] },
  { k: "household_size", t: "number", min: 1, max: 30, unit: "persons" },
  { k: "german_first_language", t: "yesno" },

  { s: "housing" },
  { k: "tenure", t: "choice", o: ["owner", "tenant"] },
  { k: "years_lived", t: "number", min: 0, max: 100, unit: "years", for: "any" },
  { k: "landlord", t: "choice", o: ["individual", "private_company", "public_company", "coop", "other"], other: "landlord_other", for: "tenant" },
  { k: "years_planned", t: "number", min: 0, max: 100, unit: "years", for: "tenant" },
  { k: "property_management", t: "short", for: "any" },
  { k: "owner_via_management", t: "yesno", for: "owner" },

  { s: "heating", for: "any" },
  { k: "heating_type", t: "short", for: "any" },
  { k: "energy_source", t: "short", for: "any" },
  { k: "heating_age", t: "number", min: 0, max: 150, unit: "years", for: "any" },

  { s: "satisfaction", for: "any" },
  { k: "heating_satisfaction", t: "choice", o: ["satisfied", "dissatisfied"], for: "any" },
  { k: "insulation_satisfaction", t: "choice", o: ["satisfied", "dissatisfied"], for: "any" },
  { k: "satisfaction_why", t: "text", for: "any" },
  { k: "heated_less", t: "yesno", for: "any" },
  { k: "heated_less_why", t: "text", for: "any" },
  { k: "complained", t: "yesno", for: "tenant" },
  { k: "complained_why", t: "text", for: "tenant" },
  { k: "tenant_advice", t: "choice", o: ["unknown", "known", "used"], for: "tenant" },

  { s: "replacement", for: "any" },
  { k: "heating_tenant_wishes", t: "text", for: "tenant" },
  { k: "owner_heating_looked_into", t: "yesno", for: "owner" },
  { k: "owner_heating_informed", t: "yesno", for: "owner" },
  { k: "owner_heating_notes", t: "text", for: "owner" },

  { s: "retrofit", for: "any" },
  { k: "retrofit_done", t: "text", for: "any" },
  { k: "retrofit_tenant_wishes", t: "text", for: "tenant" },
  { k: "owner_retrofit_looked_into", t: "yesno", for: "owner" },
  { k: "owner_retrofit_informed", t: "yesno", for: "owner" },
  { k: "owner_retrofit_notes", t: "text", for: "owner" },

  { s: "participation", for: "any" },
  { k: "knows_how_to_get_informed", t: "yesno", for: "any" },
  { k: "wants_to_participate", t: "yesno", for: "any" },
  { k: "participate_where", t: "short", for: "any" },
  { k: "participate_why", t: "text", for: "any" },
  { k: "heard_of_heat_planning", t: "yesno", for: "any" },
  { k: "heat_planning_what", t: "short", for: "any" },

  { s: "network", for: "any" },
  { k: "inform_format", t: "multi", o: ["flyer", "notices", "online_event", "info_event", "social_media", "other"], other: "inform_format_other", for: "any" },
  { k: "inform_by", t: "multi", o: ["city", "district", "initiative", "other"], other: "inform_by_other", for: "any" },
  { k: "coop_interest", t: "yesno", for: "owner" },
  { k: "coop_why", t: "text", for: "owner" },

  { s: "other", for: "any" },
  { k: "other_notes", t: "text", for: "any" },
];

// ---------- texts ----------
const T = {
  en: {
    title: "Interview form", map: "← Map",
    studentName: "First name (student)", interviewNumber: "Interview number",
    consent: "The person agreed to the interview",
    privacy: "Don't enter names, the address, the floor or anything else that identifies the person. Street and floor from the paper guide are left out on purpose.",
    optional: "Every question is optional. Tap a selected answer again to clear it.",
    tenureFirst: "Choose owner-occupied or rented to see the remaining questions.",
    save: "Save interview", saving: "Saving …",
    saved: "Interview saved. Thank you!",
    missing: "Please fill in your first name and the interview number, tick consent and choose owner-occupied or rented.",
    error: "Saving didn't work. The answers are still here, please try again.",
    needJoin: "To fill in interviews, first join on the map with the class code.", toMap: "Go to the map",
    offline: "Not connected to a database.",
    several: "Several answers possible",
    years: "years", persons: "persons", yes: "Yes", no: "No",
    s: {
      person: ["About the person"], housing: ["Housing"],
      heating: ["Heating supply", "Knowledge of their own heating supply"],
      satisfaction: ["Satisfaction", "With the current heating supply and building condition, or wish for change"],
      replacement: ["Heating replacement", "Needs, wishes, priorities"],
      retrofit: ["Energy-efficient retrofitting", "Needs, wishes, priorities (insulating roof or façade, windows, door)"],
      participation: ["Information and participation"],
      network: ["Local heating network", "Explain it briefly first. Needs and wishes about a possible local heating network."],
      other: ["Other", "Anything else that came up in the interview. No names or details that identify the person."],
    },
    q: {
      age: "Age range", gender: "Gender", household_size: "Household size", german_first_language: "German as first language",
      tenure: "Owner-occupied or rented flat?", years_lived: "Length of residence",
      landlord: "Landlord", landlord_other: "Which other landlord?",
      years_planned: "About how many years are you planning to stay in the flat?",
      property_management: "Property management (if any)", owner_via_management: "Organised via property management?",
      heating_type: "Heating type", energy_source: "Energy source", heating_age: "Age of heating system",
      heating_satisfaction: "Satisfied with the heating system (heater)?",
      insulation_satisfaction: "Satisfied with the energetic state (insulation)?",
      satisfaction_why: "Why? Specific problems and defects",
      heated_less: "Ever heated less than you would have liked?", heated_less_why: "Why?",
      complained: "Complained to the landlord about defects?", complained_why: "Why (not)?",
      tenant_advice: "Tenant advice services known or already used?",
      heating_tenant_wishes: "What would be important to you?",
      owner_heating_looked_into: "Already looked into it?", owner_heating_informed: "Sufficiently informed?", owner_heating_notes: "Notes",
      retrofit_done: "Has anything already been done in recent years?",
      retrofit_tenant_wishes: "What would be important to you?",
      owner_retrofit_looked_into: "Already looked into it?", owner_retrofit_informed: "Sufficiently informed?", owner_retrofit_notes: "Notes",
      knows_how_to_get_informed: "Do you know how you can get informed and involved?",
      wants_to_participate: "Would you like to participate and bring in your perspective?",
      participate_where: "Where?", participate_why: "Why (not)?",
      heard_of_heat_planning: "Heat planning: have you heard about it?", heat_planning_what: "What, where?",
      inform_format: "How, in which format, should people be informed?", inform_format_other: "Which other format?",
      inform_by: "Informed by whom?", inform_by_other: "By whom else?",
      coop_interest: "Interested in joining a possible cooperative?", coop_why: "Why (not)?",
      other_notes: "Other",
    },
    hint: {
      knows_how_to_get_informed: "E.g. information by the city, citizen initiative, tenant advisory board",
      heard_of_heat_planning: "Then briefly explain heat planning.",
    },
    o: {
      gender: { m: "Male", f: "Female", d: "Diverse" },
      age: { "70+": "70+" },
      tenure: { owner: "Owner-occupied", tenant: "Rented" },
      landlord: { individual: "Individual landlord", private_company: "Private company", public_company: "Public housing company", coop: "Co-op", other: "Other" },
      heating_satisfaction: { satisfied: "Rather satisfied", dissatisfied: "Rather dissatisfied" },
      insulation_satisfaction: { satisfied: "Rather satisfied", dissatisfied: "Rather dissatisfied" },
      tenant_advice: { unknown: "Not known", known: "Known", used: "Already used" },
      inform_format: { flyer: "Flyer in the mail", notices: "Notices", online_event: "Online event", info_event: "Info event in the neighbourhood", social_media: "Social media", other: "Other" },
      inform_by: { city: "City", district: "District", initiative: "AG WW initiative", other: "Other" },
    },
  },
  de: {
    title: "Interviewbogen", map: "← Karte",
    studentName: "Vorname (Student:in)", interviewNumber: "Interviewnummer",
    consent: "Die Person ist mit dem Interview einverstanden",
    privacy: "Keine Namen, Adresse, Stockwerk oder andere Angaben eintragen, die die Person erkennbar machen. Straße und Stockwerk aus dem Leitfaden fehlen hier bewusst.",
    optional: "Alle Fragen sind freiwillig. Eine gewählte Antwort nochmal antippen, um sie zu löschen.",
    tenureFirst: "Eigentums- oder Mietwohnung wählen, um die weiteren Fragen zu sehen.",
    save: "Interview speichern", saving: "Wird gespeichert …",
    saved: "Interview gespeichert. Danke!",
    missing: "Bitte Vorname und Interviewnummer eintragen, das Einverständnis ankreuzen und Eigentums- oder Mietwohnung wählen.",
    error: "Speichern hat nicht geklappt. Die Antworten sind noch da, bitte nochmal versuchen.",
    needJoin: "Um Interviews einzutragen, zuerst auf der Karte mit dem Klassencode beitreten.", toMap: "Zur Karte",
    offline: "Keine Verbindung zur Datenbank.",
    several: "Mehrere Antworten möglich",
    years: "Jahre", persons: "Personen", yes: "Ja", no: "Nein",
    s: {
      person: ["Zur Person"], housing: ["Wohnsituation"],
      heating: ["Wärmeversorgung", "Wissensstand zur eigenen Wärmeversorgung"],
      satisfaction: ["Zufriedenheit", "Mit aktueller Wärmeversorgung und Gebäudezustand bzw. Wunsch nach Veränderung"],
      replacement: ["Heizungstausch", "Bedürfnisse, Wünsche, Prioritäten"],
      retrofit: ["Energetische Sanierung", "Bedürfnisse, Wünsche, Prioritäten (Dämmen von Dach oder Fassade, Fenster, Tür)"],
      participation: ["Information und Beteiligung"],
      network: ["Nahwärmenetz", "Zuerst kurz erklären. Bedürfnisse und Wünsche bzgl. eines möglichen Nahwärmenetzes im Kiez."],
      other: ["Sonstiges", "Was sonst noch im Interview angesprochen wurde. Keine Namen oder Angaben, die die Person erkennbar machen."],
    },
    q: {
      age: "Altersspanne", gender: "Geschlecht", household_size: "Haushaltsgröße", german_first_language: "Deutsch als Erstsprache",
      tenure: "Eigentums- oder Mietwohnung?", years_lived: "Wohndauer",
      landlord: "Vermieter", landlord_other: "Welcher sonstige Vermieter?",
      years_planned: "Wie viele Jahre planen Sie in etwa, noch in der Wohnung zu bleiben?",
      property_management: "Hausverwaltung (falls vorhanden)", owner_via_management: "Läuft die Organisation über eine Hausverwaltung?",
      heating_type: "Heizungsart", energy_source: "Energieträger", heating_age: "Alter der Anlage",
      heating_satisfaction: "Zufrieden mit der Heizung?",
      insulation_satisfaction: "Zufrieden mit dem energetischen Zustand (Dämmung, Fensterisolierung)?",
      satisfaction_why: "Warum? Spezifische Probleme und Mängel",
      heated_less: "Schon mal weniger geheizt, als Sie eigentlich gerne getan hätten?", heated_less_why: "Warum?",
      complained: "Beim Vermieter über Mängel beschwert?", complained_why: "Warum (nicht)?",
      tenant_advice: "Sind Mieterberatungsangebote bekannt oder schon genutzt?",
      heating_tenant_wishes: "Was wäre Ihnen wichtig?",
      owner_heating_looked_into: "Schon damit beschäftigt?", owner_heating_informed: "Ausreichend informiert?", owner_heating_notes: "Anmerkungen",
      retrofit_done: "Was wurde ggf. in den letzten Jahren schon gemacht?",
      retrofit_tenant_wishes: "Was wäre Ihnen wichtig?",
      owner_retrofit_looked_into: "Schon damit beschäftigt?", owner_retrofit_informed: "Ausreichend informiert?", owner_retrofit_notes: "Anmerkungen",
      knows_how_to_get_informed: "Wissen Sie, wie Sie sich informieren können?",
      wants_to_participate: "Würden Sie sich gerne mit Ihrer Perspektive beteiligen?",
      participate_where: "Wo?", participate_why: "Warum (nicht)?",
      heard_of_heat_planning: "Wärmeplanung: Haben Sie davon mitbekommen?", heat_planning_what: "Was, wo?",
      inform_format: "Wie, in welchem Format am besten informieren?", inform_format_other: "Welches andere Format?",
      inform_by: "Durch wen informiert werden?", inform_by_other: "Durch wen sonst?",
      coop_interest: "Interesse, sich an einer möglichen Genossenschaft zu beteiligen?", coop_why: "Warum (nicht)?",
      other_notes: "Sonstiges",
    },
    hint: {
      knows_how_to_get_informed: "Z. B. Informationen seitens Stadt, Initiative AG WW, Mieterbeirat",
      heard_of_heat_planning: "Danach kurz die kommunale Wärmeplanung (KWP) erklären.",
    },
    o: {
      gender: { m: "männlich", f: "weiblich", d: "divers" },
      age: { "70+": "ü70" },
      tenure: { owner: "Eigentum", tenant: "Miete" },
      landlord: { individual: "Privater Einzelvermieter", private_company: "Privates Unternehmen", public_company: "Öffentliche Wohnungsbaugesellschaft (LWU)", coop: "Genossenschaft", other: "Sonstige" },
      heating_satisfaction: { satisfied: "Eher zufrieden", dissatisfied: "Eher unzufrieden" },
      insulation_satisfaction: { satisfied: "Eher zufrieden", dissatisfied: "Eher unzufrieden" },
      tenant_advice: { unknown: "Nicht bekannt", known: "Bekannt", used: "Schon genutzt" },
      inform_format: { flyer: "Flyer in der Post", notices: "Aushänge", online_event: "Online-Veranstaltung", info_event: "Info-Veranstaltung im Kiez", social_media: "Social Media", other: "Sonstiges" },
      inform_by: { city: "Stadt", district: "Bezirk", initiative: "Initiative AG WW", other: "Sonstige" },
    },
  },
};

// ---------- state ----------
const $ = id => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
let lang = "de";
try { if (localStorage.getItem("pepb-interview-lang") === "en") lang = "en"; } catch (e) {}
let v = {};            // answers, keyed by question
let consent = false, dirty = false, saving = false;
const cfg = window.PEPB_CONFIG || {};
const sb = cfg.supabaseUrl && cfg.supabaseKey ? supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey) : null;

const optLabel = (q, code) => {
  if (q.t === "yesno") return T[lang][code];
  const o = T[lang].o[q.k];
  return (o && o[code]) || code;
};
const visible = item => !item.for || (v.tenure && (item.for === "any" || item.for === v.tenure));

// ---------- building the form ----------
function build() {
  const t = T[lang];
  document.documentElement.lang = lang;
  document.title = t.title + " · PEPB x WärmSchöN";
  document.querySelectorAll("[data-t]").forEach(n => { n.textContent = t[n.dataset.t]; });
  document.querySelectorAll(".lang button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));

  const box = $("questions");
  box.replaceChildren();
  let section = null;
  Q.forEach(item => {
    if (item.s) {
      section = el("section", "iv-section"); section.dataset.for = item.for || "";
      const [title, hint] = t.s[item.s];
      section.append(el("h2", null, title));
      if (hint) section.append(el("p", "hint", hint));
      box.append(section);
      return;
    }
    const wrap = el("div", "iv-q"); wrap.dataset.for = item.for || ""; wrap.dataset.k = item.k;
    const label = t.q[item.k];
    if (item.t === "choice" || item.t === "yesno" || item.t === "multi") {
      const fs = el("fieldset"); fs.append(el("legend", null, label));
      if (t.hint[item.k]) fs.append(el("p", "hint", t.hint[item.k]));
      if (item.t === "multi") fs.append(el("p", "hint", t.several));
      const opts = el("div", "opts");
      (item.t === "yesno" ? ["yes", "no"] : item.o).forEach(code => {
        const inp = el("input"); inp.type = item.t === "multi" ? "checkbox" : "radio"; inp.name = item.k; inp.value = code; inp.id = "q-" + item.k + "-" + code;
        inp.checked = item.t === "multi" ? (v[item.k] || []).includes(code) : v[item.k] === code;
        inp.addEventListener("click", () => pick(item, code, inp));
        const lab = el("label", null, optLabel(item, code)); lab.htmlFor = inp.id;
        opts.append(inp, lab);
      });
      fs.append(opts); wrap.append(fs);
      if (item.other) wrap.append(textField({ k: item.other, t: "short" }, t.q[item.other], "iv-other"));
    } else {
      wrap.append(textField(item, label));
    }
    section.append(wrap);
    if (item.k === "tenure") { const n = el("p", "hint iv-tenure-first", t.tenureFirst); section.append(n); }
  });
  $("consent").checked = consent;
  update();
}

function textField(item, label, cls) {
  const wrap = el("label", "iv-field" + (cls ? " " + cls : ""));
  wrap.dataset.k = item.k;
  wrap.append(el("span", null, label));
  let inp;
  if (item.t === "text") { inp = el("textarea"); inp.rows = 2; inp.maxLength = 2000; }
  else { inp = el("input"); inp.type = "text"; inp.maxLength = 300; }
  if (item.t === "number") { inp.inputMode = "numeric"; inp.maxLength = 3; }
  inp.id = "q-" + item.k; inp.value = v[item.k] != null ? v[item.k] : "";
  inp.addEventListener("input", () => {
    // Number fields keep digits only, so nothing hidden can block saving.
    if (item.t === "number") inp.value = inp.value.replace(/\D/g, "");
    v[item.k] = inp.value; dirty = true;
  });
  if (item.t === "number") {
    const row = el("span", "iv-number"); row.append(inp, el("span", null, T[lang][item.unit])); wrap.append(row);
  } else wrap.append(inp);
  return wrap;
}

// Tapping the chosen answer again clears it, so a skipped question stays empty.
function pick(item, code, inp) {
  dirty = true;
  if (item.t === "multi") {
    const cur = new Set(v[item.k] || []);
    inp.checked ? cur.add(code) : cur.delete(code);
    v[item.k] = [...cur];
  } else if (v[item.k] === code) { inp.checked = false; delete v[item.k]; }
  else v[item.k] = code;
  update();
}

function update() {
  document.querySelectorAll("#questions [data-for]").forEach(n => {
    const f = n.dataset.for;
    n.hidden = !!f && !(v.tenure && (f === "any" || f === v.tenure));
  });
  Q.filter(q => q.other).forEach(q => {
    const val = v[q.k], show = Array.isArray(val) ? val.includes("other") : val === "other";
    const n = document.querySelector('.iv-other[data-k="' + q.other + '"]');
    if (n) n.hidden = !show;
  });
  document.querySelector(".iv-tenure-first").hidden = !!v.tenure;
}

// ---------- saving ----------
function collect() {
  const choices = {}, numbers = {}, texts = {};
  const addText = (k, max) => { const s = String(v[k] || "").trim().slice(0, max); if (s) texts[k] = s; };
  Q.forEach(q => {
    if (q.s || q.k === "tenure" || !visible(q)) return;
    const val = v[q.k];
    if (q.t === "choice" || q.t === "yesno") { if (val) choices[q.k] = val; }
    else if (q.t === "multi") { if (val && val.length) choices[q.k] = q.o.filter(c => val.includes(c)); }
    else if (q.t === "number") { const n = parseInt(val, 10); if (Number.isFinite(n) && n >= q.min && n <= q.max) numbers[q.k] = n; }
    else addText(q.k, q.t === "text" ? 2000 : 300);
    if (q.other && (Array.isArray(val) ? val.includes("other") : val === "other")) addText(q.other, 300);
  });
  texts.student_name = $("ivName").value.trim().slice(0, 30);
  texts.interview_number = $("ivNumber").value.trim().slice(0, 20);
  return { tenure: v.tenure, choices, numbers, texts };
}

function message(text, ok) { const m = $("msg"); m.textContent = text || ""; m.hidden = !text; m.className = ok ? "iv-msg ok" : "iv-msg"; }

$("ivForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (saving) return;
  if (!consent || !v.tenure || !$("ivName").value.trim() || !$("ivNumber").value.trim()) { message(T[lang].missing); return; }
  saving = true; $("save").disabled = true; $("save").textContent = T[lang].saving; message("");
  const { error } = await sb.from("interviews").insert(collect());
  saving = false; $("save").disabled = false; $("save").textContent = T[lang].save;
  if (error) { message(T[lang].error); return; }
  v = {}; consent = false; dirty = false;
  // The name stays for the next interview; the number is entered fresh each time.
  $("ivNumber").value = "";
  build();
  message(T[lang].saved, true);
  scrollTo({ top: 0 });
});
$("consent").addEventListener("change", e => { consent = e.target.checked; dirty = true; });
document.querySelectorAll(".lang button").forEach(b => b.addEventListener("click", () => {
  lang = b.dataset.lang;
  try { localStorage.setItem("pepb-interview-lang", lang); } catch (e) {}
  const m = $("msg").hidden; build(); if (m) message("");
}));
addEventListener("beforeunload", e => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

// ---------- start: only class members may save interviews ----------
build();
(async () => {
  if (!sb) { $("gate").hidden = false; $("gateText").textContent = T[lang].offline; return; }
  try {
    const { data: { session } } = await sb.auth.getSession();
    let member = false;
    if (session) {
      const { data } = await sb.from("members").select("first_name").eq("user_id", session.user.id).maybeSingle();
      member = !!data;
      if (data && !$("ivName").value) $("ivName").value = data.first_name;
    }
    if (member) $("ivForm").hidden = false;
    else $("gate").hidden = false;
  } catch (e) { $("gate").hidden = false; }
})();
