import os
import django

# Настраиваем окружение Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from premium.models import Trait

# Полный мультиязычный справочник для предзаполнения
TRAITS_DATA = {
    'bad_habit': [
        {"ru": "Курение (сигареты)", "en": "Smoking (cigarettes)", "es": "Fumar (cigarrillos)"},
        {"ru": "Курение (электронные сигареты/вейп)", "en": "Vaping / E-cigarettes", "es": "Vapeo / Cigarrillos electrónicos"},
        {"ru": "Регулярное употребление алкоголя", "en": "Regular alcohol consumption", "es": "Consumo regular de alcohol"},
        {"ru": "Сидячий образ жизни", "en": "Sedentary lifestyle", "es": "Estilo de vida sedentario"},
        {"ru": "Недостаток сна (менее 6 часов)", "en": "Lack of sleep (< 6 hours)", "es": "Falta de sueño (< 6 horas)"},
        {"ru": "Бессонница / Нарушения сна", "en": "Insomnia / Sleep disorders", "es": "Insomnio / Trastornos del sueño"},
        {"ru": "Злоупотребление фастфудом", "en": "Junk food abuse", "es": "Consumo excesivo de comida rápida"},
        {"ru": "Переедание на ночь", "en": "Late-night overeating", "es": "Comer en exceso por la noche"},
        {"ru": "Чрезмерное употребление кофеина", "en": "Excessive caffeine intake", "es": "Consumo excesivo de cafeína"},
        {"ru": "Злоупотребление энергетическими напитками", "en": "Energy drinks abuse", "es": "Abuso de bebidas energéticas"},
        {"ru": "Зависимость от сладкого", "en": "Sugar addiction", "es": "Adicción al azúcar"},
        {"ru": "Высокий уровень ежедневного стресса", "en": "High daily stress levels", "es": "Altos niveles de estrés diario"}
    ],
    'good_habit': [
        {"ru": "Регулярные кардиотренировки", "en": "Regular cardio workouts", "es": "Entrenamientos cardiovasculares regulares"},
        {"ru": "Регулярные силовые тренировки", "en": "Regular strength training", "es": "Entrenamiento de fuerza regular"},
        {"ru": "Соблюдение режима сна (7-8 часов)", "en": "Healthy sleep routine (7-8 hours)", "es": "Rutina de sueño saludable (7-8 horas)"},
        {"ru": "Соблюдение водного баланса (от 1.5 л в день)", "en": "Optimal hydration (1.5L+ daily)", "es": "Hidratación óptima (1.5L+ diarios)"},
        {"ru": "Ежедневные прогулки (более 10 000 шагов)", "en": "Daily walking (10k+ steps)", "es": "Caminatas diarias (más de 10,000 pasos)"},
        {"ru": "Средиземноморская диета", "en": "Mediterranean diet", "es": "Dieta mediterránea"},
        {"ru": "Практика медитации / йоги", "en": "Meditation / Yoga practice", "es": "Práctica de meditación / yoga"},
        {"ru": "Регулярные профилактические медосмотры", "en": "Regular health check-ups", "es": "Chequeos médicos regulares"},
        {"ru": "Закаливание", "en": "Cold exposure training", "es": "Exposición al frío (Endurecimiento)"},
        {"ru": "Дробное питание", "en": "Frequent small meals", "es": "Comidas pequeñas y frecuentes"}
    ],
    'disease': [
        {"ru": "Сахарный диабет 1 типа", "en": "Type 1 Diabetes", "es": "Diabetes tipo 1"},
        {"ru": "Сахарный диабет 2 типа", "en": "Type 2 Diabetes", "es": "Diabetes tipo 2"},
        {"ru": "Артериальная гипертензия", "en": "Arterial hypertension", "es": "Hipertensión arterial"},
        {"ru": "Ишемическая болезнь сердца (ИБС)", "en": "Coronary artery disease (CAD)", "es": "Enfermedad de las arterias coronarias (EAC)"},
        {"ru": "Бронхиальная астма", "en": "Bronchial asthma", "es": "Asma bronquial"},
        {"ru": "Хроническая обструктивная болезнь легких (ХОБЛ)", "en": "Chronic obstructive pulmonary disease (COPD)", "es": "Enfermedad pulmonar obstructiva crónica (EPOC)"},
        {"ru": "Гипотиреоз", "en": "Hypothyroidism", "es": "Hipotiroidismo"},
        {"ru": "Гипертиреоз", "en": "Hyperthyroidism", "es": "Hipertiroidismo"},
        {"ru": "Аутоиммунный тиреоидит (АИТ)", "en": "Hashimoto's thyroiditis", "es": "Tiroiditis de Hashimoto"},
        {"ru": "Хроническая болезнь почек (ХБП)", "en": "Chronic kidney disease (CKD)", "es": "Enfermedad renal crónica (ERC)"},
        {"ru": "Жировой гепатоз (НАЖБП)", "en": "Non-alcoholic fatty liver disease (NAFLD)", "es": "Enfermedad del hígado graso no alcohólico (EHGNA)"},
        {"ru": "Цирроз печени", "en": "Liver cirrhosis", "es": "Cirrosis hepática"},
        {"ru": "Язвенная болезнь желудка или 12-перстной кишки", "en": "Peptic ulcer disease", "es": "Enfermedad de úlcera péptica"},
        {"ru": "Хронический гастрит", "en": "Chronic gastritis", "es": "Gastritis crónica"},
        {"ru": "Ревматоидный артрит", "en": "Rheumatoid arthritis", "es": "Artritis reumatoide"},
        {"ru": "Подагра", "en": "Gout", "es": "Gota"},
        {"ru": "Остеоартроз", "en": "Osteoarthritis", "es": "Osteoartritis"},
        {"ru": "Псориаз", "en": "Psoriasis", "es": "Psoriasis"},
        {"ru": "Железодефицитная анемия", "en": "Iron deficiency anemia", "es": "Anemia por deficiencia de hierro"},
        {"ru": "В12-дефицитная анемия", "en": "Vitamin B12 deficiency anemia", "es": "Anemia por deficiencia de vitamina B12"},
        {"ru": "Онкологическое заболевание (в анамнезе)", "en": "Cancer (in remission/history)", "es": "Cáncer (en remisión/antecedentes)"},
        {"ru": "Депрессия / Тревожное расстройство", "en": "Depression / Anxiety disorder", "es": "Depresión / Trastorno de ansiedad"},
        {"ru": "Хронический панкреатит", "en": "Chronic pancreatitis", "es": "Pancreatitis crónica"},
        {"ru": "Желчекаменная болезнь", "en": "Gallstone disease", "es": "Litiasis biliar (Cálculos biliares)"},
        {"ru": "Мочекаменная болезнь", "en": "Kidney stone disease", "es": "Litiasis renal (Cálculos renales)"}
    ],
    'feature': [
        {"ru": "Вегетарианство", "en": "Vegetarianism", "es": "Vegetarianismo"},
        {"ru": "Веганство", "en": "Veganism", "es": "Veganismo"},
        {"ru": "Кето-диета", "en": "Keto diet", "es": "Dieta cetogénica"},
        {"ru": "Интервальное голодание", "en": "Intermittent fasting", "es": "Ayuno intermitente"},
        {"ru": "Непереносимость лактозы", "en": "Lactose intolerance", "es": "Intolerancia a la lactosa"},
        {"ru": "Целиакия (непереносимость глютена)", "en": "Celiac disease (Gluten intolerance)", "es": "Enfermedad celíaca (Intolerancia al gluten)"},
        {"ru": "Аллергия на пыльцу (поллиноз)", "en": "Pollen allergy (Hay fever)", "es": "Alergia al polen (Fiebre del heno)"},
        {"ru": "Пищевая аллергия", "en": "Food allergy", "es": "Alergia alimentaria"},
        {"ru": "Удален желчный пузырь (холецистэктомия)", "en": "Gallbladder removed (Cholecystectomy)", "es": "Vesícula biliar extirpada (Colecistectomía)"},
        {"ru": "Удалена щитовидная железа", "en": "Thyroid removed", "es": "Tiroides extirpada"},
        {"ru": "Удален аппендикс", "en": "Appendix removed", "es": "Apéndice extirpado"},
        {"ru": "Беременность", "en": "Pregnancy", "es": "Embarazo"},
        {"ru": "Период лактации (грудное вскармливание)", "en": "Lactation (Breastfeeding)", "es": "Lactancia (Lactancia materna)"},
        {"ru": "Менопауза", "en": "Menopause", "es": "Menopausia"},
        {"ru": "Профессиональный спорт", "en": "Professional sports", "es": "Deporte profesional"},
        {"ru": "Донор крови", "en": "Blood donor", "es": "Donante de sangre"},
        {"ru": "Работа на вредном производстве", "en": "Hazardous work environment", "es": "Trabajo en un entorno peligroso"},
        {"ru": "Работа в ночные смены", "en": "Night shift work", "es": "Trabajo en turnos de noche"},
        {"ru": "Прием оральных контрацептивов (КОК)", "en": "Taking oral contraceptives", "es": "Toma de anticonceptivos orales"},
        {"ru": "Регулярный прием статинов", "en": "Regular statin use", "es": "Uso regular de estatinas"},
        {"ru": "Регулярный прием антидепрессантов", "en": "Regular antidepressant use", "es": "Uso regular de antidepresivos"}
    ]
}

def populate():
    print("⏳ Начинаем заполнение базы характеристик с переводами...")
    
    added_count = 0
    existed_count = 0
    
    for category, items in TRAITS_DATA.items():
        for translations in items:
            # Используем name_en как якорное поле для проверки существования записи
            obj, created = Trait.objects.get_or_create(
                name_en=translations['en'],
                category=category,
                defaults={
                    'is_custom': False, 
                    'created_by': None,
                    'name_ru': translations['ru'],
                    'name_es': translations['es'],
                    # Дефолтное поле name заполняем английским (или любым другим)
                    # modeltranslation сам раскидает данные по нужным колонкам
                    'name': translations['en'] 
                }
            )
            
            if created:
                added_count += 1
            else:
                # На случай, если запись существует, но переводы нужно обновить
                obj.name_ru = translations['ru']
                obj.name_es = translations['es']
                obj.save()
                existed_count += 1
                
    print(f"✅ Завершено! Добавлено новых: {added_count}. Обновлено существующих: {existed_count}.")

if __name__ == '__main__':
    populate()