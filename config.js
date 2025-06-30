// Конфиг приложения для универсальности
const APP_CONFIG = {
  title: 'Учет и контроль конкурса в вузы',
  entityName: 'Абитуриент',
  entityNamePlural: 'Абитуриенты',
  groups: [
    {
      name: 'Личные данные',
      fields: ['fio', 'birthdate', 'photo']
    },
    {
      name: 'Информация о конкурсе',
      fields: ['university', 'score']
    }
  ],
  fields: {
    fio: {
      label: 'ФИО',
      type: 'text',
      required: true,
      validate: value => value.trim().length > 0 || 'Введите ФИО'
    },
    birthdate: {
      label: 'Дата рождения',
      type: 'date',
      required: true,
      validate: value => !!value || 'Укажите дату рождения'
    },
    photo: {
      label: 'Фото',
      type: 'image',
      required: false,
      validate: () => true
    },
    university: {
      label: 'Вуз',
      type: 'select',
      options: ['МГУ', 'СПбГУ', 'ВШЭ', 'Другое'],
      required: true,
      validate: value => value && value !== '' || 'Выберите вуз'
    },
    score: {
      label: 'Баллы',
      type: 'number',
      required: true,
      validate: value => !isNaN(Number(value)) && Number(value) >= 0 && Number(value) <= 400 || 'Баллы должны быть от 0 до 400'
    }
  }
}; 