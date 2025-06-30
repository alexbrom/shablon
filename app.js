// Класс сущности (универсальный)
class Entity {
  constructor(data) {
    Object.assign(this, data);
    this.id = data.id || Entity.generateId();
  }
  static generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
  }
}

// Имитация "бэкенда" (данные в памяти + localStorage)
let entities = [];
let editingEntity = null;

// --- LocalStorage helpers ---
const STORAGE_KEY = 'abiturients_data';
function saveEntities() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entities));
}
function loadEntities() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      const arr = JSON.parse(data);
      entities = arr.map(obj => new Entity(obj));
    } catch (e) {
      entities = [];
    }
  }
}

// Инициализация приложения
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('app-title').textContent = APP_CONFIG.title;
  loadEntities();
  renderList();
  document.getElementById('search-btn').onclick = onSearch;
  document.getElementById('search-input').oninput = onSearch;
  document.getElementById('modal-close').onclick = closeModal;
});

// Рендер списка
function renderList(filtered = null) {
  const section = document.getElementById('list-section');
  section.innerHTML = '';
  const addBtn = document.createElement('button');
  addBtn.textContent = 'Добавить ' + APP_CONFIG.entityName.toLowerCase();
  addBtn.className = 'btn btn-add';
  addBtn.onclick = () => showForm();
  section.appendChild(addBtn);
  const table = document.createElement('table');
  table.className = 'table';
  const thead = document.createElement('thead');
  const tr = document.createElement('tr');
  for (const group of APP_CONFIG.groups) {
    for (const field of group.fields) {
      const th = document.createElement('th');
      th.textContent = APP_CONFIG.fields[field].label;
      tr.appendChild(th);
    }
  }
  tr.appendChild(document.createElement('th')).textContent = 'Действия';
  thead.appendChild(tr);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  const data = filtered || entities;
  for (const entity of data) {
    const tr = document.createElement('tr');
    for (const group of APP_CONFIG.groups) {
      for (const field of group.fields) {
        const td = document.createElement('td');
        if (APP_CONFIG.fields[field].type === 'image' && entity[field]) {
          const img = document.createElement('img');
          img.src = entity[field];
          td.appendChild(img);
        } else {
          td.textContent = entity[field] || '';
        }
        tr.appendChild(td);
      }
    }
    // Действия
    const tdActions = document.createElement('td');
    const editBtn = document.createElement('button');
    editBtn.textContent = '✏️';
    editBtn.className = 'btn btn-edit';
    editBtn.onclick = () => showForm(entity);
    tdActions.appendChild(editBtn);
    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑️';
    delBtn.className = 'btn btn-delete';
    delBtn.onclick = () => confirmDelete(entity);
    tdActions.appendChild(delBtn);
    tr.appendChild(tdActions);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  section.appendChild(table);
  document.getElementById('form-section').style.display = 'none';
  section.style.display = '';
}

// Показать форму (добавление/редактирование)
function showForm(entity = null) {
  editingEntity = entity;
  const section = document.getElementById('form-section');
  section.innerHTML = '';
  const form = document.createElement('form');
  form.onsubmit = onFormSubmit;
  for (const group of APP_CONFIG.groups) {
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = group.name;
    fieldset.appendChild(legend);
    for (const field of group.fields) {
      const cfg = APP_CONFIG.fields[field];
      const div = document.createElement('div');
      div.className = 'form-group';
      const label = document.createElement('label');
      label.textContent = cfg.label + (cfg.required ? ' *' : '');
      label.htmlFor = field;
      let input;
      if (cfg.type === 'select') {
        input = document.createElement('select');
        input.name = field;
        input.id = field;
        input.required = cfg.required;
        input.tabIndex = 0;
        const optEmpty = document.createElement('option');
        optEmpty.value = '';
        optEmpty.textContent = '—';
        input.appendChild(optEmpty);
        for (const opt of cfg.options) {
          const option = document.createElement('option');
          option.value = opt;
          option.textContent = opt;
          input.appendChild(option);
        }
      } else if (cfg.type === 'image') {
        input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.id = field;
        input.name = field;
        input.tabIndex = 0;
        input.onchange = e => previewImage(e, form, field);
      } else {
        input = document.createElement('input');
        input.type = cfg.type;
        input.id = field;
        input.name = field;
        input.required = cfg.required;
        input.tabIndex = 0;
      }
      if (entity && field !== 'photo') {
        input.value = entity[field] || '';
      }
      label.appendChild(input);
      div.appendChild(label);
      fieldset.appendChild(div);
    }
    form.appendChild(fieldset);
  }
  // Фото превью
  if (entity && entity.photo) {
    const img = document.createElement('img');
    img.src = entity.photo;
    img.style.maxWidth = '100px';
    img.style.display = 'block';
    img.style.marginBottom = '1rem';
    form.appendChild(img);
  }
  // Кнопки
  const actions = document.createElement('div');
  actions.className = 'form-actions';
  const saveBtn = document.createElement('button');
  saveBtn.type = 'submit';
  saveBtn.className = 'btn btn-add';
  saveBtn.textContent = entity ? 'Сохранить' : 'Добавить';
  actions.appendChild(saveBtn);
  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn';
  cancelBtn.textContent = 'Отмена';
  cancelBtn.onclick = () => {
    section.style.display = 'none';
    document.getElementById('list-section').style.display = '';
  };
  actions.appendChild(cancelBtn);
  form.appendChild(actions);
  section.appendChild(form);
  section.style.display = '';
  document.getElementById('list-section').style.display = 'none';
  // Фокус на первом поле
  setTimeout(() => {
    const firstInput = form.querySelector('input, select, textarea');
    if (firstInput) firstInput.focus();
  }, 100);
}

// Превью изображения
function previewImage(e, form, field) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    let img = form.querySelector('img[data-preview="' + field + '"]');
    if (!img) {
      img = document.createElement('img');
      img.setAttribute('data-preview', field);
      img.style.maxWidth = '100px';
      img.style.display = 'block';
      img.style.marginBottom = '1rem';
      form.insertBefore(img, form.firstChild);
    }
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

// Обработка отправки формы
function onFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const data = {};
  let hasError = false;
  let errorMsg = '';
  for (const group of APP_CONFIG.groups) {
    for (const field of group.fields) {
      const cfg = APP_CONFIG.fields[field];
      let value;
      if (cfg.type === 'image') {
        const input = form.querySelector('input[name="' + field + '"]');
        if (input && input.files && input.files[0]) {
          value = form.querySelector('img[data-preview="' + field + '"]')?.src || '';
        } else if (editingEntity && editingEntity[field]) {
          value = editingEntity[field];
        } else {
          value = '';
        }
      } else {
        value = form.elements[field]?.value || '';
      }
      // Валидация
      const valid = cfg.validate(value);
      if (valid !== true) {
        hasError = true;
        errorMsg = valid;
        showModal(errorMsg);
        form.elements[field]?.focus();
        break;
      }
      data[field] = value;
    }
    if (hasError) break;
  }
  if (hasError) return;
  if (editingEntity) {
    // Редактирование
    Object.assign(editingEntity, data);
    showModal('Запись успешно обновлена!', false);
  } else {
    // Добавление
    const entity = new Entity(data);
    entities.push(entity);
    showModal('Запись успешно добавлена!', false);
  }
  editingEntity = null;
  saveEntities();
  renderList();
}

// Поиск
function onSearch() {
  const query = document.getElementById('search-input').value.trim().toLowerCase();
  if (!query) {
    renderList();
    return;
  }
  const filtered = entities.filter(entity => {
    return Object.keys(APP_CONFIG.fields).some(field => {
      const val = (entity[field] || '').toString().toLowerCase();
      return val.includes(query);
    });
  });
  renderList(filtered);
}

// Удаление
function confirmDelete(entity) {
  if (confirm('Удалить запись?')) {
    entities = entities.filter(e => e.id !== entity.id);
    showModal('Запись удалена.', false);
    saveEntities();
    renderList();
  }
}

// Модальное окно
function showModal(msg, isError = true) {
  const modal = document.getElementById('modal');
  const message = document.getElementById('modal-message');
  message.textContent = msg;
  modal.style.display = 'flex';
  if (isError) message.style.color = '#e94e77';
  else message.style.color = '#2ecc71';
}
function closeModal() {
  document.getElementById('modal').style.display = 'none';
} 