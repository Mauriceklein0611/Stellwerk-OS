# Testkonzept TASK-029 – Einstellungen & Theme (Dark/Light/System)

## Automatisiert (Vitest)

| Datei | Prüfung |
|---|---|
| `theme.test.ts` | `resolveTheme` (explizit vs. `system`), `applyThemeClass` toggelt `.dark`, `THEME_OPTIONS` = light/dark/system, `themeInitScript` enthält Storage-Key + Default `dark` + try/catch |
| `useSettingsStore.test.ts` | Defaults (dark / kanban / system), Setter, Persist-Name `pm-studio-settings` |
| `board-view-default.test.ts` | `viewExplicit` startet `false`, wird durch `setView` `true` + persistiert; Migration v3→v4 setzt `viewExplicit=true` für Bestand, lässt v4 unangetastet |
| `use-reduced-motion.test.ts` | Override: `system` folgt Media-Query (false), `reduced` ⇒ true, `full` ⇒ false |
| `SettingsSegment.test.tsx` | Radiogroup mit Label, ein Radio je Option, korrektes `aria-checked`, `onChange` mit Wert beim Klick |

Ausführen: `npm run test`.

## Manuell (Schritt-für-Schritt, vom Nutzer klickbar)

> Tipp: Für „Standard-Board-Ansicht" idealerweise im frischen Profil / nach
> `localStorage.clear()` testen – ein bereits auf dem Board umgeschalteter View
> gilt als bewusste Wahl und überschreibt den Default (siehe Edge Cases).

1. **Theme umschalten**
   - `/settings` öffnen → unter „Theme" auf **Hell** klicken.
   - Erwartung: App wechselt sofort auf helle Palette, Texte/Statusfarben bleiben lesbar.
   - Auf **Dunkel** zurück → dunkle Palette wie gewohnt.
2. **Persistenz / kein Flackern (FOUC)**
   - Theme auf **Hell** stellen, Seite neu laden (F5).
   - Erwartung: Beim Laden erscheint **kein** kurzer dunkler Blitz; die App ist sofort hell.
3. **System-Theme**
   - Theme auf **System** stellen; OS-Darkmode umschalten (Windows: Einstellungen → Farben).
   - Erwartung: App folgt live, ohne Reload.
4. **Standard-Board-Ansicht**
   - In `/settings` „Standard-Board-Ansicht" auf **Liste** stellen.
   - `/board` öffnen (ohne dort vorher umzuschalten) → öffnet als Liste.
   - Auf dem Board manuell auf **Kanban** umschalten → ab jetzt gewinnt diese Wahl
     (Default greift nicht mehr, auch nach Reload).
5. **Animationen / Reduced Motion**
   - In `/settings` „Animationen" auf **Reduziert** stellen.
   - Dashboard öffnen → Charts/Statuspunkt-Pulse animieren nicht mehr.
   - Auf **An** stellen → Animationen laufen, unabhängig vom OS.
6. **Navigation**
   - Sidebar zeigt Gruppe „System“ mit „Einstellungen“; ⌘K findet „Einstellungen“.

## DoD-Abgleich (docs/testing-strategy.md)

- [x] Funktion erfüllt Akzeptanzkriterien der Task
- [x] TypeScript strict, kein `any`
- [x] Tokens/StatusBadge statt Ad-hoc-Farben (Light-Palette über Tokens)
- [x] Loading-/Empty-States (Settings: `useHydrated`-Gate „Lädt …“)
- [x] Automatisierte Tests vorhanden (`tests/task-029/`)
- [x] Testkonzept (diese Datei)
- [x] Lint/Typecheck/Test/Build grün
- [x] Doku aktualisiert (`docs/design-system.md`, `task-index.md`)

## Architektur / Edge Cases

- **Kein `next-themes`:** eigener `useSettingsStore` (persist) konsistent zum
  bestehenden Muster. No-Flash über Inline-Skript (`themeInitScript`) in
  `layout.tsx`; `ThemeApplier` hält die Klasse zur Laufzeit synchron und folgt
  `system` live via `matchMedia`. `<html suppressHydrationWarning>` wegen der vom
  Skript gesetzten Klasse.
- **Default-Board-Ansicht vs. bestehende Wahl:** Das Board folgt dem Settings-
  Default nur, solange `viewExplicit=false`. Bestehende Nutzer (persistierter
  View aus TASK-023) werden per Migration v3→v4 auf `viewExplicit=true` gesetzt –
  ihre letzte Ansicht bleibt erhalten, der Default greift dort bewusst nicht.
- **Status-Farben Light:** kräftigere Töne (`success #059669`, `info #2563eb`,
  …) für Kontrast auf hellem Grund; weiterhin single-sourced über die Tokens.
