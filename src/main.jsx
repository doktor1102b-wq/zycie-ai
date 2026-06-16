import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const modes = [
  { id: "friend", label: "Przyjaciel", icon: "🤝" },
  { id: "advisor", label: "Doradca", icon: "🧭" },
  { id: "calm", label: "Uspokojenie", icon: "🌿" },
  { id: "plan", label: "Plan działania", icon: "✅" },
  { id: "motivation", label: "Motywacja", icon: "🔥" },
];

const starters = [
  "Mam ciężki dzień i potrzebuję pogadać.",
  "Pomóż mi zrobić plan na dziś.",
  "Czuję stres. Uspokój mnie krok po kroku.",
  "Nie wiem co robić dalej.",
];

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

function App() {
  const [profile, setProfile] = useState(() => load("zycie_profile", null));
  const [name, setName] = useState("");
  const [mode, setMode] = useState("friend");
  const [messages, setMessages] = useState(() => load("zycie_messages", [
    { role: "ai", text: "Cześć. Jestem Życie AI. Napisz, co się dzieje — pogadamy spokojnie i konkretnie." }
  ]));
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mood, setMood] = useState(3);
  const [note, setNote] = useState("");
  const [moods, setMoods] = useState(() => load("zycie_moods", []));
  const [goalText, setGoalText] = useState("");
  const [stepText, setStepText] = useState("");
  const [goals, setGoals] = useState(() => load("zycie_goals", []));
  const chatRef = useRef(null);

  useEffect(() => save("zycie_profile", profile), [profile]);
  useEffect(() => save("zycie_messages", messages), [messages]);
  useEffect(() => save("zycie_moods", moods), [moods]);
  useEffect(() => save("zycie_goals", goals), [goals]);
  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }); }, [messages, busy]);

  const activeMode = useMemo(() => modes.find(m => m.id === mode), [mode]);

  async function send(text = input) {
    const clean = text.trim();
    if (!clean || busy) return;
    const next = [...messages, { role: "user", text: clean }];
    setMessages(next);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: clean, mode, history: next, profile })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd połączenia z AI");
      setMessages([...next, { role: "ai", text: data.reply }]);
    } catch (err) {
      setMessages([...next, { role: "ai", text: "Nie mogę teraz połączyć się z Gemini. Sprawdź, czy w Netlify dodano GEMINI_API_KEY i czy projekt został wdrożony z funkcją Netlify. Szczegół: " + err.message }]);
    } finally {
      setBusy(false);
    }
  }

  function saveMood() {
    const text = note.trim();
    setMoods([{ mood, note: text, date: new Date().toLocaleString("pl-PL") }, ...moods].slice(0, 30));
    setNote("");
  }

  function addGoal() {
    if (!goalText.trim()) return;
    setGoals([{ id: crypto.randomUUID(), title: goalText.trim(), step: stepText.trim() || "Mały krok na dziś", done: false }, ...goals]);
    setGoalText("");
    setStepText("");
  }

  function crisis() {
    setMode("calm");
    send("Potrzebuję pomocy teraz. Daj mi spokojny plan bezpieczeństwa na najbliższe 10 minut.");
  }

  if (!profile) {
    return <div className="login">
      <div className="card login-card">
        <div className="logo">Życie AI</div>
        <h1>Twój osobisty przyjaciel, doradca i plan na trudne momenty.</h1>
        <p>Wpisz imię lub pseudonim. To lokalne logowanie — zapisuje się tylko w tej przeglądarce.</p>
        <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && setProfile({ name: name.trim() || "Przyjaciel" })} placeholder="Jak mam się do Ciebie zwracać?" />
        <button onClick={() => setProfile({ name: name.trim() || "Przyjaciel" })}>Wejdź do aplikacji</button>
      </div>
    </div>
  }

  return <div className="app">
    <aside>
      <div className="brand">
        <span>Życie AI</span>
        <small>Witaj, {profile.name}</small>
      </div>

      <h3>Tryb rozmowy</h3>
      <div className="mode-list">
        {modes.map(m => <button className={mode === m.id ? "active" : ""} onClick={() => setMode(m.id)} key={m.id}>{m.icon} {m.label}</button>)}
      </div>

      <button className="danger" onClick={crisis}>🚨 Potrzebuję pomocy teraz</button>
      <button className="ghost" onClick={() => setMessages([{ role: "ai", text: "Nowa rozmowa. Co jest teraz najważniejsze?" }])}>Nowa rozmowa</button>
      <button className="ghost" onClick={() => { localStorage.clear(); location.reload(); }}>Wyloguj / reset</button>
    </aside>

    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">{activeMode.icon} tryb: {activeMode.label}</p>
          <h1>Nie musisz ogarniać wszystkiego naraz.</h1>
          <p>Powiedz mi, co się dzieje. Pomogę Ci pogadać, uspokoić głowę albo ułożyć prosty plan.</p>
        </div>
      </section>

      <section className="grid">
        <div className="card chat-card">
          <div ref={chatRef} className="chat">
            {messages.map((m, i) => <div key={i} className={"bubble " + m.role}>{m.text}</div>)}
            {busy && <div className="bubble ai">Piszę odpowiedź…</div>}
          </div>
          <div className="starters">
            {starters.map(s => <button key={s} onClick={() => send(s)}>{s}</button>)}
          </div>
          <div className="composer">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Napisz, co się dzieje..." />
            <button onClick={() => send()} disabled={busy}>Wyślij</button>
          </div>
        </div>

        <div className="side-stack">
          <div className="card">
            <h2>Dziennik nastroju</h2>
            <label>Nastrój: {mood}/5</label>
            <input type="range" min="1" max="5" value={mood} onChange={e => setMood(e.target.value)} />
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Krótka notatka..." />
            <button onClick={saveMood}>Zapisz nastrój</button>
            <div className="mini-list">{moods.slice(0,4).map((m,i)=><p key={i}>{"⭐".repeat(Number(m.mood))} <small>{m.date}</small><br/>{m.note}</p>)}</div>
          </div>

          <div className="card">
            <h2>Cele</h2>
            <input value={goalText} onChange={e => setGoalText(e.target.value)} placeholder="Cel, np. poprawić sen" />
            <input value={stepText} onChange={e => setStepText(e.target.value)} placeholder="Mały krok na dziś" />
            <button onClick={addGoal}>Dodaj cel</button>
            <div className="mini-list">{goals.slice(0,6).map(g=><label className="goal" key={g.id}>
              <input type="checkbox" checked={g.done} onChange={() => setGoals(goals.map(x => x.id === g.id ? {...x, done: !x.done} : x))} />
              <span><b>{g.title}</b><br/><small>{g.step}</small></span>
            </label>)}</div>
          </div>
        </div>
      </section>
    </main>
  </div>
}

createRoot(document.getElementById("root")).render(<App />);
