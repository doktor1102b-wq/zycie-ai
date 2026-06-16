# Życie AI — React + Gemini + Netlify

## Wdrożenie na Netlify
1. Wrzuć cały projekt na GitHub.
2. W Netlify wybierz: Add new site → Import from Git.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Functions directory: `netlify/functions`
6. W Environment variables dodaj:
   - `GEMINI_API_KEY`
7. Deploy.

## Funkcje
- React
- Gemini API przez Netlify Function
- Pamięć rozmów w localStorage
- Lokalne logowanie/nick
- Tryby: Przyjaciel, Doradca, Uspokojenie, Plan działania, Motywacja
- Dziennik nastroju
- Cele i małe kroki
- Tryb kryzysowy

Uwaga: nie wrzucaj klucza API do kodu frontendowego.
