/*
  Скрипт аналитики для Re:Market
  Здесь настраиваются обработчики пользовательских действий и отправка
  целей в Яндекс.Метрику посредством функции reachGoal.
*/

// Задайте здесь ID счётчика Яндекс.Метрики. Для корректной работы
// замените null на целое число, выданное Метрикой (например, 93212345).
const YM_ID = null;

/**
 * Отправляет событие в Метрику.
 * @param {string} goal Название цели
 * @param {Object} params Дополнительные параметры
 */
function reportGoal(goal, params = {}) {
  if (typeof YM_ID === 'number' && window.ym) {
    ym(YM_ID, 'reachGoal', goal, params);
  }
  // Можно дополнительно логировать в консоль для отладки
  console.log('reportGoal', goal, params);
}

// Инициализация событий после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  // Главная CTA
  const ctaBtn = document.getElementById('ctaBtn');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      reportGoal('cta_click');
    });
  }

  // CTA на карточках услуг на главной странице
  document.querySelectorAll('[data-goal="service_cta"]').forEach(el => {
    el.addEventListener('click', (e) => {
      const service = el.dataset.service || '';
      reportGoal('service_cta', { service });
    });
  });

  // Переход на страницу услуги (кнопки «Подробнее»)
  document.querySelectorAll('[data-goal="service_open"]').forEach(el => {
    el.addEventListener('click', () => {
      const service = el.dataset.service || '';
      reportGoal('service_open', { service });
    });
  });

  // Фильтр кейсов
  const caseFilter = document.getElementById('caseFilter');
  if (caseFilter) {
    caseFilter.addEventListener('change', () => {
      const industry = caseFilter.value;
      reportGoal('case_filter_apply', { industry });
      // Фильтрация карточек по атрибуту data-industry
      document.querySelectorAll('.case-card').forEach(card => {
        if (industry === 'all' || card.dataset.industry === industry) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }

  // Клик по кейсам
  document.querySelectorAll('[data-goal="case_open"]').forEach(link => {
    link.addEventListener('click', () => {
      const id = link.dataset.id || '';
      reportGoal('case_open', { id });
    });
  });

  // CTA в тарифах
  document.querySelectorAll('[data-goal="pricing_cta"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = btn.dataset.plan || '';
      reportGoal('pricing_cta', { plan });
    });
  });

  // Форма обратной связи
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // простая валидация
      const name = contactForm.querySelector('input[name="name"]').value.trim();
      const email = contactForm.querySelector('input[name="email"]').value.trim();
      const phone = contactForm.querySelector('input[name="phone"]').value.trim();
      const message = contactForm.querySelector('textarea[name="message"]').value.trim();

      // сброс ошибок
      contactForm.querySelectorAll('.error').forEach(el => {
        el.textContent = '';
      });
      let hasError = false;
      if (!name) {
        setError('name', 'Введите ваше имя');
        reportGoal('form_error', { field: 'name' });
        hasError = true;
      }
      if (!email || !validateEmail(email)) {
        setError('email', 'Введите корректный email');
        reportGoal('form_error', { field: 'email' });
        hasError = true;
      }
      // телефон необязателен, но можем проверять формат
      if (phone && !/^[0-9+\-()\s]+$/.test(phone)) {
        setError('phone', 'Введите корректный телефон');
        reportGoal('form_error', { field: 'phone' });
        hasError = true;
      }
      if (hasError) return;
      // если всё ок
      reportGoal('submit_brief');
      // перенаправление на страницу благодарности
      window.location.href = 'thanks.html';
    });
  }

  // Клики по мессенджерам
  document.querySelectorAll('[data-goal="messenger_click"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type || '';
      reportGoal('messenger_click', { type });
    });
  });

  // Инициализируем счётчик времени и скролла на страницах блога и кейсов
  setupEngagementTracking();
});

/**
 * Устанавливает ошибку для поля формы
 * @param {string} fieldName Имя поля
 * @param {string} message Сообщение об ошибке
 */
function setError(fieldName, message) {
  const field = document.querySelector(`[name="${fieldName}"]`);
  if (!field) return;
  let errEl = field.parentElement.querySelector('.error');
  if (!errEl) {
    errEl = document.createElement('div');
    errEl.className = 'error';
    field.parentElement.appendChild(errEl);
  }
  errEl.textContent = message;
}

// Простая проверка email
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Настройка отправки событий глубины скролла и времени на странице.
 * Работает только для страниц, где есть элемент с атрибутом data-track-engagement.
 */
function setupEngagementTracking() {
  const trackEl = document.querySelector('[data-track-engagement]');
  if (!trackEl) return;
  // Пороговые значения скролла (в процентах)
  const scrollThresholds = [25, 50, 75, 90];
  const triggeredScroll = {};
  // Таймеры времени (в секундах)
  const timeThresholds = [30, 60];
  const triggeredTime = {};
  // отслеживание прокрутки
  window.addEventListener('scroll', () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const scrolled = window.scrollY / docHeight * 100;
    scrollThresholds.forEach(percent => {
      if (!triggeredScroll[percent] && scrolled >= percent) {
        reportGoal(`scroll_${percent}`);
        triggeredScroll[percent] = true;
      }
    });
  });
  // отслеживание времени
  timeThresholds.forEach(seconds => {
    setTimeout(() => {
      reportGoal(`time_${seconds}s`);
      triggeredTime[seconds] = true;
    }, seconds * 1000);
  });
}