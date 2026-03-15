// JavaScript Online Compiler (версия с Monaco Editor)
// ------------------------------------------------------------
// Реализовано по требованиям:
// - Monaco Editor (редактор из VS Code) через CDN
// - Подсветка синтаксиса JavaScript + тёмная тема VS Code
// - Кнопка Run выполняет код через eval()
// - Вывод console.log идёт в панель Output

const outputEl = document.getElementById("output");
const runBtn = document.getElementById("runBtn");
const themeBtn = document.getElementById("themeBtn");
const clearBtn = document.getElementById("clearBtn");
const editorContainer = document.getElementById("editor");
const notesEl = document.getElementById("notes");
const tabOutputBtn = document.getElementById("tabOutput");
const tabNotesBtn = document.getElementById("tabNotes");

const NOTES_STORAGE_KEY = "js-compiler-notes";
const RIGHT_PANEL_STORAGE_KEY = "js-compiler-right-panel";

let notesSaveTimer = null;

function saveNotesNow() {
  if (!notesEl) return;
  try {
    localStorage.setItem(NOTES_STORAGE_KEY, notesEl.value);
  } catch {
    // localStorage может быть недоступен (например, в приватном режиме/ограничениях).
  }
}

function scheduleNotesSave() {
  if (!notesEl) return;
  if (notesSaveTimer) clearTimeout(notesSaveTimer);
  notesSaveTimer = setTimeout(saveNotesNow, 250);
}

function setRightPanel(panelName) {
  const view = panelName === "notes" ? "notes" : "output";
  const showNotes = view === "notes";

  if (outputEl) outputEl.hidden = showNotes;
  if (notesEl) notesEl.hidden = !showNotes;

  if (tabOutputBtn) {
    tabOutputBtn.classList.toggle("tab--active", !showNotes);
    tabOutputBtn.setAttribute("aria-selected", String(!showNotes));
  }

  if (tabNotesBtn) {
    tabNotesBtn.classList.toggle("tab--active", showNotes);
    tabNotesBtn.setAttribute("aria-selected", String(showNotes));
  }

  try {
    localStorage.setItem(RIGHT_PANEL_STORAGE_KEY, view);
  } catch {
    // localStorage может быть недоступен (например, в приватном режиме/ограничениях).
  }
}

// Темы для сайта (рандомизируются кнопкой Theme).
const THEMES = [
  "ocean",
  "grape",
  "indigo",
  "cyber",
  "emerald",
  "teal",
  "lime",
  "amber",
  "orange",
  "rose",
  "crimson",
  "slate",
  "zinc",
  "graphite",
  "stone",
  "smoke",
  "carbon",
  "fog",
  "aurora",
  "mono",
];

// Темы Monaco Editor (фон/курсор/выделение). Подсветка токенов наследуется от "vs-dark".
const MONACO_THEME_COLORS = {
  ocean: {
    background: "#1e1e1e",
    cursor: "#60a5fa",
    selection: "#264f78",
    selectionInactive: "#264f7833",
    lineHighlight: "#2a2d2e",
    widgetBg: "#111827",
    widgetBorder: "#334155",
  },
  grape: {
    background: "#1b1026",
    cursor: "#c084fc",
    selection: "#3b1d5a",
    selectionInactive: "#3b1d5a33",
    lineHighlight: "#241133",
    widgetBg: "#140c1f",
    widgetBorder: "#3b1d5a",
  },
  emerald: {
    background: "#0b1c16",
    cursor: "#34d399",
    selection: "#0f3b2d",
    selectionInactive: "#0f3b2d33",
    lineHighlight: "#0c231b",
    widgetBg: "#071812",
    widgetBorder: "#0f3b2d",
  },
  amber: {
    background: "#1c1308",
    cursor: "#fbbf24",
    selection: "#3b2a0f",
    selectionInactive: "#3b2a0f33",
    lineHighlight: "#221707",
    widgetBg: "#140d05",
    widgetBorder: "#3b2a0f",
  },
  rose: {
    background: "#1d0b10",
    cursor: "#fb7185",
    selection: "#4a1220",
    selectionInactive: "#4a122033",
    lineHighlight: "#230c12",
    widgetBg: "#15070b",
    widgetBorder: "#4a1220",
  },
  cyber: {
    background: "#081622",
    cursor: "#22d3ee",
    selection: "#0b2b3a",
    selectionInactive: "#0b2b3a33",
    lineHighlight: "#0b1b29",
    widgetBg: "#07121c",
    widgetBorder: "#0b2b3a",
  },
  indigo: {
    background: "#0f1230",
    cursor: "#818cf8",
    selection: "#2a2b66",
    selectionInactive: "#2a2b6633",
    lineHighlight: "#171a3a",
    widgetBg: "#0b0e24",
    widgetBorder: "#2a2b66",
  },
  teal: {
    background: "#072023",
    cursor: "#2dd4bf",
    selection: "#0b3a3f",
    selectionInactive: "#0b3a3f33",
    lineHighlight: "#0a272b",
    widgetBg: "#061518",
    widgetBorder: "#0b3a3f",
  },
  lime: {
    background: "#10240a",
    cursor: "#a3e635",
    selection: "#274015",
    selectionInactive: "#27401533",
    lineHighlight: "#142c0d",
    widgetBg: "#0c1c07",
    widgetBorder: "#274015",
  },
  orange: {
    background: "#251106",
    cursor: "#fb923c",
    selection: "#4a200b",
    selectionInactive: "#4a200b33",
    lineHighlight: "#2c1508",
    widgetBg: "#1b0d05",
    widgetBorder: "#4a200b",
  },
  crimson: {
    background: "#240b11",
    cursor: "#f87171",
    selection: "#4a1422",
    selectionInactive: "#4a142233",
    lineHighlight: "#2a0d15",
    widgetBg: "#1a070c",
    widgetBorder: "#4a1422",
  },
  slate: {
    background: "#0c1320",
    cursor: "#94a3b8",
    selection: "#22314a",
    selectionInactive: "#22314a33",
    lineHighlight: "#101a2a",
    widgetBg: "#0a0f19",
    widgetBorder: "#22314a",
  },
  zinc: {
    background: "#18181b",
    cursor: "#d4d4d8",
    selection: "#34343b",
    selectionInactive: "#34343b33",
    lineHighlight: "#202024",
    widgetBg: "#0f0f12",
    widgetBorder: "#34343b",
  },
  graphite: {
    background: "#0f141c",
    cursor: "#e5e7eb",
    selection: "#283246",
    selectionInactive: "#28324633",
    lineHighlight: "#121a24",
    widgetBg: "#0b0f14",
    widgetBorder: "#283246",
  },
  stone: {
    background: "#1c1917",
    cursor: "#d6d3d1",
    selection: "#3a2f2b",
    selectionInactive: "#3a2f2b33",
    lineHighlight: "#231f1d",
    widgetBg: "#141110",
    widgetBorder: "#3a2f2b",
  },
  smoke: {
    background: "#111827",
    cursor: "#cbd5e1",
    selection: "#23314a",
    selectionInactive: "#23314a33",
    lineHighlight: "#121a2a",
    widgetBg: "#0a0f19",
    widgetBorder: "#23314a",
  },
  carbon: {
    background: "#0d0d0e",
    cursor: "#d1d5db",
    selection: "#2a2a2a",
    selectionInactive: "#2a2a2a33",
    lineHighlight: "#141414",
    widgetBg: "#0a0a0b",
    widgetBorder: "#2a2a2a",
  },
  fog: {
    background: "#0f1318",
    cursor: "#d7dde6",
    selection: "#253040",
    selectionInactive: "#25304033",
    lineHighlight: "#121820",
    widgetBg: "#0b0f14",
    widgetBorder: "#253040",
  },
  aurora: {
    background: "#07161a",
    cursor: "#5eead4",
    selection: "#0b2f34",
    selectionInactive: "#0b2f3433",
    lineHighlight: "#0a1b20",
    widgetBg: "#051014",
    widgetBorder: "#0b2f34",
  },
  mono: {
    background: "#111111",
    cursor: "#d1d5db",
    selection: "#2a2a2a",
    selectionInactive: "#2a2a2a33",
    lineHighlight: "#1a1a1a",
    widgetBg: "#101010",
    widgetBorder: "#2a2a2a",
  },
};

const definedMonacoThemes = new Set();

function getCurrentTheme() {
  return document.documentElement.dataset.theme || "ocean";
}

function ensureMonacoTheme(themeName) {
  const safeTheme = THEMES.includes(themeName) ? themeName : "ocean";
  const themeId = `site-${safeTheme}`;
  if (definedMonacoThemes.has(themeId)) return themeId;

  if (!window.monaco?.editor) return "vs-dark";

  const colors = MONACO_THEME_COLORS[safeTheme] || MONACO_THEME_COLORS.ocean;

  monaco.editor.defineTheme(themeId, {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": colors.background,
      "editorCursor.foreground": colors.cursor,
      "editor.lineHighlightBackground": colors.lineHighlight,
      "editor.selectionBackground": colors.selection,
      "editor.inactiveSelectionBackground": colors.selectionInactive,

      "editorWidget.background": colors.widgetBg,
      "editorWidget.border": colors.widgetBorder,
      "editorSuggestWidget.background": colors.widgetBg,
      "editorSuggestWidget.border": colors.widgetBorder,
      "editorHoverWidget.background": colors.widgetBg,
      "editorHoverWidget.border": colors.widgetBorder,
    },
  });

  definedMonacoThemes.add(themeId);
  return themeId;
}

function applyMonacoTheme(themeName) {
  if (!window.monaco?.editor) return;
  monaco.editor.setTheme(ensureMonacoTheme(themeName));
}

function applyTheme(themeName) {
  const safeTheme = THEMES.includes(themeName) ? themeName : "ocean";
  document.documentElement.dataset.theme = safeTheme;
  applyMonacoTheme(safeTheme);
  try {
    localStorage.setItem("js-compiler-theme", safeTheme);
  } catch {
    // localStorage может быть недоступен (например, в приватном режиме/ограничениях).
  }
}

function pickRandomTheme(exceptTheme) {
  const options = THEMES.filter((t) => t !== exceptTheme);
  const list = options.length ? options : THEMES;
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

// Применяем сохранённую тему (если есть).
try {
  const savedTheme = localStorage.getItem("js-compiler-theme");
  applyTheme(THEMES.includes(savedTheme) ? savedTheme : "ocean");
} catch {
  applyTheme("ocean");
}

if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    const next = pickRandomTheme(getCurrentTheme());
    applyTheme(next);
  });
}

// Заметки сохраняются в localStorage и доступны только этому пользователю/браузеру.
if (notesEl) {
  try {
    notesEl.value = localStorage.getItem(NOTES_STORAGE_KEY) || "";
  } catch {
    // localStorage может быть недоступен (например, в приватном режиме/ограничениях).
  }

  notesEl.addEventListener("input", scheduleNotesSave);
  notesEl.addEventListener("blur", saveNotesNow);
  window.addEventListener("beforeunload", saveNotesNow);
}

if (tabOutputBtn) tabOutputBtn.addEventListener("click", () => setRightPanel("output"));
if (tabNotesBtn) tabNotesBtn.addEventListener("click", () => setRightPanel("notes"));

// Восстанавливаем последнюю открытую вкладку справа (Вывод/Заметки).
try {
  const savedView = localStorage.getItem(RIGHT_PANEL_STORAGE_KEY);
  setRightPanel(savedView === "notes" ? "notes" : "output");
} catch {
  setRightPanel("output");
}

// Экземпляр Monaco Editor (создаётся после загрузки).
let editor = null;

// Начинаем перехватывать логи только после первого Run, чтобы не ловить лишние сообщения библиотек.
let captureEnabled = false;

const DEFAULT_CODE = `function hello() {
console.log("Hello from compiler");
}

hello();
`;

// Очищает панель вывода.
function clearOutput() {
  outputEl.textContent = "";
}

// Добавляет строку в панель вывода.
// Используем textContent, чтобы избежать HTML-инъекций.
function appendLine(line) {
  outputEl.textContent += `${line}\n`;
  outputEl.scrollTop = outputEl.scrollHeight;
}

// Приводит значения из console.log к читаемому тексту.
function formatValue(value) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || value === null || value === undefined) {
    return String(value);
  }
  if (value instanceof Error) return value.stack || value.message;

  // JSON для объектов (с обработкой циклических ссылок).
  const seen = new WeakSet();
  try {
    return JSON.stringify(
      value,
      (key, val) => {
        if (typeof val === "object" && val !== null) {
          if (seen.has(val)) return "[Circular]";
          seen.add(val);
        }
        return val;
      },
      2,
    );
  } catch {
    // Фолбэк, если значение не сериализуется.
    return Object.prototype.toString.call(value);
  }
}

// Перехватываем console.log и пишем в Output.
const originalConsoleLog = console.log.bind(console);
console.log = (...args) => {
  // Не выводим в консоль браузера (требование проекта).
  // Если нужно дублировать в DevTools — раскомментируйте:
  // originalConsoleLog(...args);

  if (!captureEnabled) return;
  const message = args.map(formatValue).join(" ");
  appendLine(message);
};

// Запускает код из Monaco Editor через eval().
function run() {
  clearOutput();
  captureEnabled = true;

  if (!editor) {
    appendLine("[Editor is still loading...]");
    return;
  }

  const userCode = editor.getValue();

  try {
    // eval выполняет код в текущем контексте.
    // Это сделано намеренно (по требованиям задания).
    // Никогда не используйте eval для непроверенного кода в реальных приложениях.
    eval(userCode);
  } catch (err) {
    appendLine("[Error]");
    appendLine(formatValue(err));
  }
}

runBtn.addEventListener("click", run);
clearBtn.addEventListener("click", clearOutput);

// Отключаем Run, пока Monaco не загрузилась.
runBtn.disabled = true;

// Загрузка Monaco Editor (через CDN + AMD loader)
const MONACO_VERSION = "0.52.0";
const MONACO_BASE = `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min/`;

function initMonaco() {
  if (typeof require === "undefined") {
    // Если CDN не загрузился — показываем понятную ошибку.
    runBtn.disabled = false;
    appendLine("[Error] Monaco loader (require.js) was not loaded.");
    return;
  }

  // Помогает Monaco загружать Web Worker'ы с CDN (без проблем с origin).
  window.MonacoEnvironment = {
    getWorkerUrl() {
      const workerMain = `${MONACO_BASE}vs/base/worker/workerMain.js`;
      const proxySource = `
        self.MonacoEnvironment = { baseUrl: '${MONACO_BASE}' };
        importScripts('${workerMain}');
      `;
      return `data:text/javascript;charset=utf-8,${encodeURIComponent(proxySource)}`;
    },
  };

  require.config({ paths: { vs: `${MONACO_BASE}vs` } });

  require(["vs/editor/editor.main"], () => {
    // Применяем текущую тему к Monaco (до создания редактора).
    const monacoThemeId = ensureMonacoTheme(getCurrentTheme());

    editor = monaco.editor.create(editorContainer, {
      value: DEFAULT_CODE,
      language: "javascript",
      theme: monacoThemeId,

      // Опции в стиле мини-IDE
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 13,
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      lineNumbers: "on",
      scrollBeyondLastLine: false,
      renderLineHighlight: "line",
      roundedSelection: false,
      autoIndent: "full",
    });

    // Настройки отступов задаются у модели.
    const model = editor.getModel();
    if (model) model.updateOptions({ tabSize: 2, insertSpaces: true });

    // Включаем Run и добавляем Ctrl/Cmd + Enter прямо в Monaco.
    runBtn.disabled = false;
    runBtn.title = "Ctrl/Cmd + Enter";
    editor.focus();

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, run);
  });
}

initMonaco();
