// Конфигурация
const formcarryUrl = "https://formcarry.com/s/ВАШ_ID_ФОРМЫ"; // ЗАМЕНИТЕ на свой URL с formcarry.com
const storageKey = "feedbackFormData";

// Элементы DOM
const openPopupBtn = document.getElementById('openPopupBtn');
const closePopupBtn = document.getElementById('closePopupBtn');
const cancelBtn = document.getElementById('cancelBtn');
const popupOverlay = document.getElementById('popupOverlay');
const feedbackPopup = document.getElementById('feedbackPopup');
const feedbackForm = document.getElementById('feedbackForm');
const formMessage = document.getElementById('formMessage');

// Поля формы
const formFields = ['fullName', 'email', 'phone', 'organization', 'message', 'consent'];
const fieldElements = {};
formFields.forEach(field => {
    fieldElements[field] = document.getElementById(field);
});

// ========== УПРАВЛЕНИЕ ПОПАПОМ ==========
function openPopup() {
    popupOverlay.style.display = 'block';
    feedbackPopup.style.display = 'block';
    document.body.classList.add('popup-open'); // Для мобильных
    // Изменяем URL с помощью History API [citation:9]
    history.pushState({ popupOpen: true }, '', '#feedback');
    loadFormDataFromStorage(); // Загружаем сохраненные данные
}
function closePopup() {
    popupOverlay.style.display = 'none';
    feedbackPopup.style.display = 'none';
    document.body.classList.remove('popup-open');
    // Возвращаем исходный URL
    history.pushState({ popupOpen: false }, '', window.location.pathname);
    clearFormMessage(); // Скрываем сообщения
}

// Обработчики открытия/закрытия
openPopupBtn.addEventListener('click', openPopup);
closePopupBtn.addEventListener('click', closePopup);
cancelBtn.addEventListener('click', closePopup);
popupOverlay.addEventListener('click', closePopup);

// Обработка кнопки "Назад" в браузере
window.addEventListener('popstate', function(event) {
    if (window.location.hash !== '#feedback') {
        closePopup();
    }
});

// ========== РАБОТА С LOCALSTORAGE ==========
// Сохранение данных формы
function saveFormDataToStorage() {
    const formData = {};
    formFields.forEach(field => {
        if (fieldElements[field].type === 'checkbox') {
            formData[field] = fieldElements[field].checked;
        } else {
            formData[field] = fieldElements[field].value;
        }
    });
    localStorage.setItem(storageKey, JSON.stringify(formData));
}
// Загрузка данных формы
function loadFormDataFromStorage() {
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
        const formData = JSON.parse(savedData);
        formFields.forEach(field => {
            if (fieldElements[field]) {
                if (fieldElements[field].type === 'checkbox') {
                    fieldElements[field].checked = formData[field] || false;
                } else {
                    fieldElements[field].value = formData[field] || '';
                }
            }
        });
    }
}
// Очистка данных формы из хранилища
function clearFormDataFromStorage() {
    localStorage.removeItem(storageKey);
}

// Автосохранение при вводе
formFields.forEach(field => {
    if (fieldElements[field]) {
        const eventType = fieldElements[field].type === 'checkbox' ? 'change' : 'input';
        fieldElements[field].addEventListener(eventType, saveFormDataToStorage);
    }
});

// ========== ОТПРАВКА ФОРМЫ (FETCH API) ==========
async function handleFormSubmit(event) {
    event.preventDefault(); // Отменяем стандартную отправку

    // Блокируем кнопку отправки
    const submitBtn = feedbackForm.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
    submitBtn.disabled = true;

    // Собираем данные формы
    const formData = new FormData(feedbackForm);
    const dataToSend = {};
    formData.forEach((value, key) => {
        dataToSend[key] = value;
    });

    try {
        // Отправляем запрос с помощью Fetch API [citation:4]
        const response = await fetch(formcarryUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend)
        });

        const result = await response.json();

        if (response.ok && result.code === 200) {
            // Успешная отправка
            showFormMessage('Ваше сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.', 'success');
            feedbackForm.reset(); // Очищаем форму
            clearFormDataFromStorage(); // Очищаем LocalStorage
        } else {
            // Ошибка от сервера
            showFormMessage(`Ошибка при отправке: ${result.message || 'Неизвестная ошибка сервера'}`, 'error');
        }
    } catch (error) {
        // Ошибка сети или другая проблема
        console.error('Fetch error:', error);
        showFormMessage('Произошла ошибка сети. Проверьте подключение и попробуйте еще раз.', 'error');
    } finally {
        // Разблокируем кнопку отправки
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Показ сообщений
function showFormMessage(text, type) {
    formMessage.textContent = text;
    formMessage.className = `form-message ${type}`;
    formMessage.style.display = 'block';
    // Автоматически скрыть сообщение через 7 секунд
    setTimeout(clearFormMessage, 7000);
}
function clearFormMessage() {
    formMessage.style.display = 'none';
    formMessage.textContent = '';
}

// Назначаем обработчик отправки формы
feedbackForm.addEventListener('submit', handleFormSubmit);

// ========== ДОПОЛНИТЕЛЬНАЯ ЛОГИКА ==========
// Маска для телефона (упрощенная)
const phoneInput = fieldElements['phone'];
phoneInput.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
        value = '+7 (' + value.substring(1, 4) + ') ' + value.substring(4, 7) + '-' + value.substring(7, 9) + '-' + value.substring(9, 11);
    }
    e.target.value = value.substring(0, 18);
});

// Закрытие попапа по клавише Esc
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && feedbackPopup.style.display === 'block') {
        closePopup();
    }
});

// Проверяем hash при загрузке страницы
window.addEventListener('load', function() {
    if (window.location.hash === '#feedback') {
        openPopup();
    }
});
