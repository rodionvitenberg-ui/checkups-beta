import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { AnalysisResponse } from '@/lib/api';

// Регистрируем кириллический шрифт для PDF
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfChc9AMP6lQ.ttf', fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Roboto', fontSize: 11, color: '#1e293b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 10, marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  subtitle: { fontSize: 10, color: '#64748b', marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginTop: 20, marginBottom: 10 },
  
  // Блоки с инфой
  infoBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 6, marginBottom: 20 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 120, color: '#64748b', fontWeight: 'bold' },
  value: { flex: 1, color: '#0f172a' },

  // Таблица показателей
  table: { width: 'auto', borderWidth: 1, borderColor: '#e2e8f0', borderRightWidth: 0, borderBottomWidth: 0, marginBottom: 20 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tableColHeader: { width: '25%', borderRightWidth: 1, borderRightColor: '#e2e8f0', padding: 6, backgroundColor: '#f1f5f9', fontWeight: 'bold' },
  tableCol: { width: '25%', borderRightWidth: 1, borderRightColor: '#e2e8f0', padding: 6 },
  
  // Статусы
  statusCritical: { color: '#ef4444', fontWeight: 'bold' },
  statusHigh: { color: '#d97706', fontWeight: 'bold' },
  statusNormal: { color: '#10b981' },
  
  // Причины и рекомендации
  listItem: { flexDirection: 'row', marginBottom: 6 },
  bullet: { width: 10, fontSize: 14, color: '#3b82f6' },
  listText: { flex: 1, lineHeight: 1.4 },
  
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 9, color: '#94a3b8', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10 }
});

export const AnalysisPDF = ({ data }: { data: AnalysisResponse }) => {
  const result = data.ai_result!;
  const info = result.patient_info;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Шапка */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Checkups Report</Text>
            <Text style={styles.subtitle}>Медицинская расшифровка AI</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={styles.subtitle}>ID: {data.uid.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.subtitle}>Дата: {new Date().toLocaleDateString('ru-RU')}</Text>
          </View>
        </View>

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
              <Text style={styles.label}>Дата рождения:</Text>
              <Text style={styles.value}>{info.extracted_birth_date}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Общий статус:</Text>
            <Text style={styles.value}>
              {result.summary.is_critical ? 'ТРЕБУЕТСЯ ВНИМАНИЕ ВРАЧА' : 'В ПРЕДЕЛАХ НОРМЫ'}
            </Text>
          </View>
          <View style={{ ...styles.row, marginTop: 10 }}>
            <Text style={{ ...styles.value, color: '#475569' }}>
              {result.summary.general_comment}
            </Text>
          </View>
        </View>

        {/* Таблица показателей */}
        <Text style={styles.sectionTitle}>Показатели</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableColHeader, width: '40%' }}><Text>Название</Text></View>
            <View style={{ ...styles.tableColHeader, width: '20%' }}><Text>Результат</Text></View>
            <View style={{ ...styles.tableColHeader, width: '20%' }}><Text>Референс</Text></View>
            <View style={{ ...styles.tableColHeader, width: '20%' }}><Text>Статус</Text></View>
          </View>
          
          {result.indicators.map((ind, i) => (
            <View style={styles.tableRow} key={i}>
              <View style={{ ...styles.tableCol, width: '40%' }}><Text>{ind.name}</Text></View>
              <View style={{ ...styles.tableCol, width: '20%' }}><Text>{ind.value} {ind.unit}</Text></View>
              <View style={{ ...styles.tableCol, width: '20%' }}><Text>{ind.ref_range || '-'}</Text></View>
              <View style={{ ...styles.tableCol, width: '20%' }}>
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
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>
                  <Text style={{ fontWeight: 'bold' }}>{cause.title}: </Text>
                  {cause.description}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Рекомендации */}
        <View wrap={false}>
          <Text style={styles.sectionTitle}>Рекомендации</Text>
          {result.recommendations.map((rec, i) => (
            <View style={styles.listItem} key={i}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{rec.text}</Text>
            </View>
          ))}
        </View>

        {/* Подвал */}
        <Text style={styles.footer} fixed>
          Внимание: Данный отчет сгенерирован искусственным интеллектом и не является медицинским диагнозом. 
          Пожалуйста, проконсультируйтесь с лечащим врачом.
        </Text>
      </Page>
    </Document>
  );
};