import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { AnalysisResponse } from '@/lib/api';

// Используем 100% проверенные ссылки на полные шрифты Roboto (с кириллицей)
Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Roboto-Bold.ttf', fontWeight: 'bold' }
  ]
});

// Цветовая палитра
const colors = {
  primary: '#1e40af', // Глубокий синий
  textMain: '#1e293b',
  textMuted: '#64748b',
  border: '#e2e8f0',
  bgLight: '#f8fafc',
  critical: '#ef4444',
  high: '#d97706',
  normal: '#10b981',
};

const styles = StyleSheet.create({
  page: { 
    padding: 0, // Убрали общие отступы, чтобы сделать цветную шапку на всю ширину
    fontFamily: 'Roboto', 
    fontSize: 10, 
    color: colors.textMain, 
    lineHeight: 1.5 
  },
  
  // Красивая цветная шапка
  headerSection: { 
    backgroundColor: colors.primary, 
    padding: 30, 
    paddingTop: 40,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
  headerSubtitle: { fontSize: 10, color: '#93c5fd', marginTop: 4 },
  headerRightText: { fontSize: 10, color: '#e0e7ff', textAlign: 'right' },

  // Основной контейнер контента
  content: { padding: 30, paddingTop: 20 },

  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: colors.primary, marginTop: 20, marginBottom: 12, textTransform: 'uppercase' },
  
  // Блок информации о пациенте
  infoBox: { backgroundColor: colors.bgLight, padding: 15, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', marginBottom: 6 },
  label: { width: 100, color: colors.textMuted, fontWeight: 'bold' },
  value: { flex: 1, color: colors.textMain },
  commentText: { marginTop: 8, color: '#475569' },

  // Современная таблица
  table: { width: '100%', borderWidth: 1, borderColor: colors.border, borderRadius: 6, overflow: 'hidden', marginBottom: 20 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderBottomWidth: 1, borderBottomColor: colors.border },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tableColHeader: { padding: 8, fontWeight: 'bold', color: '#334155' },
  tableCol: { padding: 8 },
  
  colName: { width: '40%' },
  colValue: { width: '20%' },
  colRef: { width: '20%' },
  colStatus: { width: '20%' },

  // Статусы
  statusCritical: { color: colors.critical, fontWeight: 'bold' },
  statusHigh: { color: colors.high, fontWeight: 'bold' },
  statusNormal: { color: colors.normal },
  
  // Списки (Причины и рекомендации)
  listItem: { flexDirection: 'row', marginBottom: 10, backgroundColor: colors.bgLight, padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#f1f5f9' },
  bulletContainer: { width: 24, alignItems: 'center' },
  bulletNumber: { backgroundColor: '#dbeafe', color: colors.primary, fontSize: 9, fontWeight: 'bold', paddingVertical: 2, paddingHorizontal: 5, borderRadius: 10 },
  listTextContainer: { flex: 1 },
  causeTitle: { fontWeight: 'bold', color: colors.textMain, marginBottom: 4, fontSize: 11 },
  causeDesc: { color: colors.textMuted },
  
  footer: { position: 'absolute', bottom: 20, left: 30, right: 30, textAlign: 'center', fontSize: 8, color: colors.textMuted, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }
});

export const AnalysisPDF = ({ data }: { data: AnalysisResponse }) => {
  const result = data.ai_result!;
  const info = result.patient_info;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Цветная шапка на всю ширину */}
        <View style={styles.headerSection} fixed>
          <View>
            <Text style={styles.headerTitle}>Результаты анализа DataDoctor.pro</Text>
          </View>
          <View>
            <Text style={styles.headerRightText}>ID: {data.uid.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.headerRightText}>Дата: {new Date().toLocaleDateString('ru-RU')}</Text>
          </View>
        </View>

        {/* Основной контент */}
        <View style={styles.content}>
            
            {/* Пациент и Статус */}
            <View style={styles.infoBox}>
            {info?.extracted_name && (
                <View style={styles.row}>
                <Text style={styles.label}>Пациент:</Text>
                <Text style={styles.value}>{info.extracted_name}</Text>
                </View>
            )}
            {info?.extracted_birth_date && (
                <View style={styles.row}>
                <Text style={styles.label}>Возраст/Г.Р.:</Text>
                <Text style={styles.value}>{info.extracted_birth_date}</Text>
                </View>
            )}
            <View style={styles.row}>
                <Text style={styles.label}>Общий статус:</Text>
                <Text style={{ ...styles.value, color: result.summary.is_critical ? colors.critical : colors.normal, fontWeight: 'bold' }}>
                {result.summary.is_critical ? 'ТРЕБУЕТСЯ ВНИМАНИЕ ВРАЧА' : 'В ПРЕДЕЛАХ НОРМЫ'}
                </Text>
            </View>
            <Text style={styles.commentText}>
                "{result.summary.general_comment}"
            </Text>
            </View>

            {/* Таблица показателей */}
            <Text style={styles.sectionTitle}>Детализация показателей</Text>
            <View style={styles.table}>
            {/* Заголовок таблицы */}
            <View style={styles.tableHeaderRow}>
                <View style={[styles.tableColHeader, styles.colName]}><Text>Название</Text></View>
                <View style={[styles.tableColHeader, styles.colValue]}><Text>Результат</Text></View>
                <View style={[styles.tableColHeader, styles.colRef]}><Text>Референс</Text></View>
                <View style={[styles.tableColHeader, styles.colStatus]}><Text>Статус</Text></View>
            </View>
            
            {/* Строки таблицы */}
            {result.indicators.map((ind, i) => (
                <View style={styles.tableRow} key={i} wrap={false}>
                <View style={[styles.tableCol, styles.colName]}>
                    <Text style={{ fontWeight: 'bold' }}>{ind.name}</Text>
                </View>
                <View style={[styles.tableCol, styles.colValue]}>
                    <Text>{ind.value} <Text style={{ fontSize: 8, color: colors.textMuted }}>{ind.unit}</Text></Text>
                </View>
                <View style={[styles.tableCol, styles.colRef]}>
                    <Text style={{ color: colors.textMuted }}>{ind.ref_range || '-'}</Text>
                </View>
                <View style={[styles.tableCol, styles.colStatus]}>
                    <Text style={
                    ind.status === 'critical' ? styles.statusCritical : 
                    (ind.status === 'high' || ind.status === 'low') ? styles.statusHigh : styles.statusNormal
                    }>
                    {ind.status === 'critical' ? 'Критично' : ind.status === 'high' ? 'Повышено' : ind.status === 'low' ? 'Понижено' : 'Норма'}
                    </Text>
                </View>
                </View>
            ))}
            </View>

            {/* Причины */}
            {result.causes.length > 0 && (
            <View wrap={false}>
                <Text style={styles.sectionTitle}>Возможные причины отклонений</Text>
                {result.causes.map((cause, i) => (
                <View style={styles.listItem} key={i}>
                    <View style={styles.bulletContainer}>
                        <Text style={styles.bulletNumber}>{i + 1}</Text>
                    </View>
                    <View style={styles.listTextContainer}>
                        <Text style={styles.causeTitle}>{cause.title}</Text>
                        <Text style={styles.causeDesc}>{cause.description}</Text>
                    </View>
                </View>
                ))}
            </View>
            )}

            {/* Рекомендации */}
            <View wrap={false}>
            <Text style={styles.sectionTitle}>Рекомендации</Text>
            {result.recommendations.map((rec, i) => (
                <View style={styles.listItem} key={i}>
                <View style={styles.bulletContainer}>
                    <Text style={styles.bulletNumber}>{i + 1}</Text>
                </View>
                <View style={styles.listTextContainer}>
                    <Text style={styles.causeDesc}>{rec.text}</Text>
                </View>
                </View>
            ))}
            </View>

        </View>

        {/* Подвал */}
        <Text style={styles.footer} fixed>
          ВНИМАНИЕ: Данный отчет сгенерирован искусственным интеллектом, не является медицинским диагнозом и носит исключительно информационный характер. Пожалуйста, проконсультируйтесь с лечащим врачом.
        </Text>
      </Page>
    </Document>
  );
};