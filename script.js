/*
 * script.js
 * Улучшенная, хорошо документированная логика фронтенда:
 * - Доступная навигация (menu + focus trap)
 * - Reveal-анимации через IntersectionObserver
 * - Аккордеон с ARIA
 * - Форма контакта: валидация, асинхронная отправка, локальное резервирование при оффлайне
 *
 * Код написан с учётом edge-cases: проверка доступности API, graceful fallback,
 * и максимальной устойчивости при отсутствии JS-фич в браузере.
 */

'use strict';

/** Утилиты DOM */
const $ = (selector, ctx = document) => ctx.querySelector(selector);
const $$ = (selector, ctx = document) => Array.from(ctx.querySelectorAll(selector));

/** Возвращает первый фокусируемый элемент внутри контейнера */
const getFocusable = (container) => {
  if (!container) return null;
  const focusable = container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  return focusable.length ? focusable[0] : null;
};

/** Простая безопасная лог-функция для отладки в dev. Убирается в проде. */
const log = (...args) => {
  if (window.__DEV__) console.log('[app]', ...args);
};

/* ----------------------- Navigation (menu) ----------------------- */
/**
 * Инициализация мобильного меню с поддержкой keyboard-accessibility и trap focus.
 * @param {HTMLElement} toggleElem - Кнопка открытия меню
 * @param {HTMLElement} menuElem - Блок меню
 */
function initMenu(toggleElem, menuElem) {
  if (!toggleElem || !menuElem) return;

  let previousActive = null;

  const openMenu = () => {
    previousActive = document.activeElement;
    menuElem.classList.add('is-open');
    toggleElem.setAttribute('aria-expanded', 'true');
    toggleElem.setAttribute('aria-label', 'Close menu');
    // ставим фокус на первый фокусируемый элемент
    const first = getFocusable(menuElem) || menuElem;
    first.focus();
    document.addEventListener('keydown', onKeyDown);
    trapFocus(menuElem);
  };

  const closeMenu = () => {
    menuElem.classList.remove('is-open');
    toggleElem.setAttribute('aria-expanded', 'false');
    toggleElem.setAttribute('aria-label', 'Open menu');
    document.removeEventListener('keydown', onKeyDown);
    releaseTrap(menuElem);
    if (previousActive instanceof HTMLElement) previousActive.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') closeMenu();
  };

  toggleElem.addEventListener('click', () => {
    const isOpen = menuElem.classList.toggle('is-open');
    if (isOpen) openMenu(); else closeMenu();
  });

  // Закрываем меню при клике по ссылке
  $$('a', menuElem).forEach((link) => link.addEventListener('click', () => closeMenu()));
}

/* ----------------------- Focus trap (simple) ----------------------- */
/**
 * Ограничивает фокус внутри контейнера (минимальная реализация).
 * @param {HTMLElement} container
 */
function trapFocus(container) {
  if (!container) return;
  const focusable = Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  container.__trap = function (e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  container.addEventListener('keydown', container.__trap);
}

function releaseTrap(container) {
  if (!container || !container.__trap) return;
  container.removeEventListener('keydown', container.__trap);
  delete container.__trap;
}

/* ----------------------- Reveal (IntersectionObserver) ----------------------- */
/**
 * Инициализирует наблюдение за элементами с классом `reveal`.
 * Дает graceful-fallback, если IntersectionObserver не поддерживается.
 */
function initReveal() {
  const items = $$('.reveal');
  if (!items.length) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('is-visible', entry.isIntersecting);
        });
      },
      { threshold: 0.22 }
    );
    items.forEach((it) => observer.observe(it));
  } else {
    items.forEach((it) => it.classList.add('is-visible'));
  }
}

/* ----------------------- Accordion (FAQ) ----------------------- */
/**
 * Инициализация аккордеона с ARIA
 * @param {HTMLElement} container
 */
function initAccordion(container) {
  if (!container) return;
  container.querySelectorAll('.faq-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      if (!item) return;
      const isOpen = item.classList.contains('is-open');

      // Закрываем все
      container.querySelectorAll('.faq-item').forEach((el) => {
        el.classList.remove('is-open');
        const b = el.querySelector('.faq-btn');
        if (b) b.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* ----------------------- Form handling ----------------------- */
const STORAGE_KEY = 'alexweb_pending_leads';

/** Простая валидация полей формы */
function validateLead({ name, phone, service }) {
  if (!name || typeof name !== 'string' || name.trim().length < 2)
    return { ok: false, message: 'Please enter a valid name (at least 2 characters).' };

  if (!phone || typeof phone !== 'string' || phone.trim().length < 5)
    return { ok: false, message: 'Please provide a phone number or Telegram contact.' };

  if (!service) return { ok: false, message: 'Please select a plan.' };

  return { ok: true };
}

/** Сохраняет заявку в локальную очередь (failing-safe) */
function enqueueLead(payload) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push({ payload, ts: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {
    log('enqueueLead error', e);
  }
}

/** Пытается отправить одну заявку на бекенд. Возвращает boolean успеха */
async function sendLead(payload) {
  // Здесь можно подставить ваш реальный endpoint
  const ENDPOINT = 'https://example.com/api/lead';

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error('Network response was not ok');
    return true;
  } catch (err) {
    log('sendLead failed', err);
    return false;
  }
}

/** Попытка отправить сохранённые заявки из localStorage */
async function flushPendingLeads() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (!arr.length) return;

    const remaining = [];
    for (const item of arr) {
      const ok = await sendLead(item.payload);
      if (!ok) remaining.push(item);
    }

    if (remaining.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    else localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    log('flushPendingLeads error', e);
  }
}

/** Инициализация формы: валидация, отправка, UI-статусы */
function initForm(formSelector = '#lead-form') {
  const form = document.querySelector(formSelector);
  if (!form) return;
  const statusEl = $('#form-status');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      name: form.elements.name.value.trim(),
      phone: form.elements.phone.value.trim(),
      service: form.elements.service.value,
      message: form.elements.message.value.trim(),
      url: location.href,
      ts: Date.now(),
    };

    statusEl && statusEl.classList.remove('error', 'success');

    const valid = validateLead(data);
    if (!valid.ok) {
      if (statusEl) {
        statusEl.textContent = valid.message;
        statusEl.classList.add('error');
      }
      return;
    }

    // optimistic UI
    if (statusEl) {
      statusEl.textContent = 'Sending...';
    }

    const ok = await sendLead(data);
    if (ok) {
      if (statusEl) {
        statusEl.textContent = 'Request sent. I will contact you shortly.';
        statusEl.classList.add('success');
      }
      form.reset();
    } else {
      // offline/failure fallback: сохраняем локально и уведомляем пользователя
      enqueueLead(data);
      if (statusEl) {
        statusEl.textContent = 'Network issue: your request was saved and will be sent automatically.';
        statusEl.classList.add('error');
      }
    }
  });
}

/* ----------------------- Init ----------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Инициализация меню
  initMenu($('.menu-toggle'), $('.menu'));

  // Reveal анимации
  initReveal();

  // Accordion
  initAccordion(document.querySelector('[data-accordion]'));

  // Форма
  initForm('#lead-form');

  // Попытаться отправить ожидающие заявки (если есть)
  flushPendingLeads().catch((e) => log('flush error', e));
});
