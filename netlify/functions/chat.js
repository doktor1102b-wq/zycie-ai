exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Brak GEMINI_API_KEY w Netlify Environment variables." })
      };
    }

    const { message, mode, history, profile } = JSON.parse(event.body || "{}");

    const modeInstructions = {
      friend: "Jesteś ciepłym, naturalnym przyjacielem. Odpowiadasz po polsku, bez oceniania, konkretnie i krótko.",
      advisor: "Jesteś mądrym doradcą. Pomagasz rozbić problem na kroki i wskazujesz najrozsądniejsze opcje.",
      calm: "Jesteś spokojnym wsparciem. Pomagasz obniżyć napięcie, prowadzisz przez oddech i proste kroki.",
      plan: "Jesteś planistą działania. Tworzysz małe, realistyczne kroki na teraz, dziś i jutro.",
      motivation: "Jesteś motywującym trenerem. Dodajesz energii bez presji i bez toksycznej pozytywności."
    };

    const safeHistory = Array.isArray(history) ? history.slice(-10) : [];
    const profileText = profile?.name ? `Użytkownik ma na imię ${profile.name}.` : "Nie znasz jeszcze imienia użytkownika.";

    const prompt = `
Nazwa aplikacji: Życie AI.
${profileText}

Zasady:
- Zawsze pisz po polsku.
- Bądź empatyczny, konkretny i ludzki.
- Nie udawaj lekarza ani terapeuty.
- Przy kryzysie bezpieczeństwa zachęć do kontaktu z zaufaną osobą i lokalną pomocą.
- Nie dawaj długich wykładów. Najlepiej 3-8 zdań.
- Tryb rozmowy: ${mode || "friend"}.
- Instrukcja trybu: ${modeInstructions[mode] || modeInstructions.friend}

Ostatnia historia:
${safeHistory.map(m => `${m.role === "user" ? "Użytkownik" : "Życie AI"}: ${m.text}`).join("\n")}

Wiadomość użytkownika:
${message}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 700
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data?.error?.message || "Błąd Gemini API" })
      };
    }

    const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n") || "Nie udało mi się wygenerować odpowiedzi.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Nieznany błąd" })
    };
  }
};
