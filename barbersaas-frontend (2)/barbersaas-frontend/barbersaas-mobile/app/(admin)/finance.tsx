import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart } from 'react-native-gifted-charts';
import { createFinanceRecord, getFinanceRecords, getFinanceSummary } from '../../src/api/finance';
import { FinanceRecordResponse, FinanceRecordType } from '../../src/types/finance';
import { getStartOfMonthString, getTodayString, formatCurrency } from '../../src/utils/dates';
import { Toast } from '../../src/components/Toast';
import { useToast } from '../../src/hooks/useToast';

export default function FinanceScreen() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const from = getStartOfMonthString();
  const to = getTodayString();

  const [type, setType] = useState<FinanceRecordType>('INCOME');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['finance-summary', from, to],
    queryFn: () => getFinanceSummary(from, to),
  });

  const { data: records, isLoading: loadingRecords } = useQuery({
    queryKey: ['finance-records', from, to],
    queryFn: () => getFinanceRecords(from, to),
  });

  const mutation = useMutation({
    mutationFn: createFinanceRecord,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['finance-summary', from, to] });
      await queryClient.invalidateQueries({ queryKey: ['finance-records', from, to] });
      setCategory('');
      setAmount('');
      setDescription('');
      toast.show(type === 'INCOME' ? 'Ingreso registrado' : 'Gasto registrado');
    },
    onError: (error: any) => {
      const fieldErrors = error.response?.data?.fields;
      setErrorMessage(fieldErrors ? String(Object.values(fieldErrors)[0]) : error.response?.data?.error ?? 'No se pudo registrar el movimiento');
    },
  });

  const handleSubmit = () => {
    if (!category.trim() || !amount.trim()) {
      setErrorMessage('Completa la categoria y el monto');
      return;
    }
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMessage('El monto debe ser mayor a 0');
      return;
    }
    setErrorMessage(null);
    mutation.mutate({
      type,
      category: category.trim(),
      amount: numericAmount,
      description: description.trim() || undefined,
      recordDate: getTodayString(),
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['finance-summary', from, to] }),
      queryClient.invalidateQueries({ queryKey: ['finance-records', from, to] }),
    ]);
    setRefreshing(false);
  }, [queryClient, from, to]);

  const chartData = [
    { value: summary?.totalIncome ?? 0, label: 'Ingresos', frontColor: '#4CAF50' },
    { value: summary?.totalExpenses ?? 0, label: 'Gastos', frontColor: '#FF6B6B' },
  ];

  const isLoading = loadingSummary || loadingRecords;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Finanzas' }} />

      <FlatList
        contentContainerStyle={styles.content}
        data={records ?? []}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
        ListHeaderComponent={
          isLoading ? (
            <ActivityIndicator color="#D4AF37" size="large" style={{ marginTop: 40 }} />
          ) : (
            <>
              <Text style={styles.hint}>Resumen del mes ({from} a {to})</Text>
              <View style={styles.row}>
                <MetricCard label="Ingresos" value={formatCurrency(summary?.totalIncome)} color="#4CAF50" />
                <MetricCard label="Gastos" value={formatCurrency(summary?.totalExpenses)} color="#FF6B6B" />
                <MetricCard label="Utilidad" value={formatCurrency(summary?.netProfit)} color="#D4AF37" />
              </View>

              {(summary?.totalIncome || summary?.totalExpenses) ? (
                <View style={styles.chartCard}>
                  <BarChart
                    data={chartData}
                    barWidth={40}
                    spacing={40}
                    roundedTop
                    yAxisTextStyle={{ color: '#888' }}
                    xAxisLabelTextStyle={{ color: '#888', fontSize: 12 }}
                    noOfSections={4}
                    height={140}
                  />
                </View>
              ) : null}

              <Text style={styles.sectionTitle}>Registrar movimiento</Text>
              <View style={styles.form}>
                <View style={styles.typeRow}>
                  <Pressable
                    style={[styles.typeButton, type === 'INCOME' && styles.typeButtonActiveIncome]}
                    onPress={() => setType('INCOME')}
                  >
                    <Text style={[styles.typeButtonText, type === 'INCOME' && styles.typeButtonTextActive]}>Ingreso</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.typeButton, type === 'EXPENSE' && styles.typeButtonActiveExpense]}
                    onPress={() => setType('EXPENSE')}
                  >
                    <Text style={[styles.typeButtonText, type === 'EXPENSE' && styles.typeButtonTextActive]}>Gasto</Text>
                  </Pressable>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Categoria (ej. corte, arriendo)"
                  placeholderTextColor="#888"
                  value={category}
                  onChangeText={setCategory}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Monto"
                  placeholderTextColor="#888"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Descripcion (opcional)"
                  placeholderTextColor="#888"
                  value={description}
                  onChangeText={setDescription}
                />

                {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

                <Pressable style={styles.saveButton} onPress={handleSubmit} disabled={mutation.isPending}>
                  {mutation.isPending ? <ActivityIndicator color="#121212" /> : <Text style={styles.saveButtonText}>Registrar</Text>}
                </Pressable>
              </View>

              <Text style={styles.sectionTitle}>Movimientos del mes</Text>
            </>
          )
        }
        ListEmptyComponent={!isLoading ? <Text style={styles.emptyText}>Sin movimientos registrados este mes.</Text> : null}
        renderItem={({ item }: { item: FinanceRecordResponse }) => (
          <View style={styles.recordCard}>
            <View style={styles.recordInfo}>
              <Text style={styles.recordCategory}>{item.category}</Text>
              {item.description ? <Text style={styles.recordDescription}>{item.description}</Text> : null}
              <Text style={styles.recordDate}>{item.recordDate}</Text>
            </View>
            <Text style={[styles.recordAmount, item.type === 'INCOME' ? styles.recordAmountIncome : styles.recordAmountExpense]}>
              {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount)}
            </Text>
          </View>
        )}
      />

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={toast.hide} />
    </View>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.metricCard, { borderColor: color }]}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 16, paddingBottom: 40 },
  hint: { color: '#888', fontSize: 12, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  metricCard: { flex: 1, backgroundColor: '#1E1E1E', borderRadius: 10, padding: 10, borderWidth: 1 },
  metricValue: { fontSize: 15, fontWeight: '700' },
  metricLabel: { color: '#888', fontSize: 11, marginTop: 4 },
  chartCard: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 20 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 12, marginBottom: 10 },
  form: { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 12, marginBottom: 8 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  typeButton: { flex: 1, borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  typeButtonActiveIncome: { borderColor: '#4CAF50', backgroundColor: '#1E3A1E' },
  typeButtonActiveExpense: { borderColor: '#FF6B6B', backgroundColor: '#3A1E1E' },
  typeButtonText: { color: '#888', fontWeight: '600' },
  typeButtonTextActive: { color: '#fff' },
  input: { backgroundColor: '#1E1E1E', color: '#fff', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, fontSize: 14, borderWidth: 1, borderColor: '#2A2A2A' },
  errorText: { color: '#FF6B6B', fontSize: 13, marginBottom: 8, textAlign: 'center' },
  saveButton: { backgroundColor: '#D4AF37', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  saveButtonText: { color: '#121212', fontWeight: '700', fontSize: 16 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 16 },
  recordCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E1E1E', borderRadius: 8, padding: 12, marginBottom: 6 },
  recordInfo: { flex: 1 },
  recordCategory: { color: '#fff', fontSize: 14, fontWeight: '600' },
  recordDescription: { color: '#888', fontSize: 12, marginTop: 2 },
  recordDate: { color: '#555', fontSize: 11, marginTop: 4 },
  recordAmount: { fontSize: 14, fontWeight: '700' },
  recordAmountIncome: { color: '#4CAF50' },
  recordAmountExpense: { color: '#FF6B6B' },
});
