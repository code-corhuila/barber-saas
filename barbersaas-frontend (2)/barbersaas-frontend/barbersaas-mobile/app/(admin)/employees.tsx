import { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, Modal, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEmployees,
  createEmployee,
  deactivateEmployee,
  getDefaultCommission,
  updateDefaultCommission,
  updateBarberCommission,
  getPayroll,
} from '../../src/api/employees';
import { EmployeeResponse, EmployeeRole, BarberPayrollResponse } from '../../src/types/employee';
import { showAlert } from '../../src/utils/alertBridge';
import { getStartOfMonthString, getEndOfMonthString, formatCurrency } from '../../src/utils/dates';
import { Toast } from '../../src/components/Toast';
import { useToast } from '../../src/hooks/useToast';

export default function EmployeesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCommissionFor, setEditingCommissionFor] = useState<EmployeeResponse | null>(null);
  const [editingDefault, setEditingDefault] = useState(false);

  const from = getStartOfMonthString();
  const to = getEndOfMonthString();

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });

  const { data: defaultCommission } = useQuery({
    queryKey: ['commission-default'],
    queryFn: getDefaultCommission,
  });

  const { data: payroll, isLoading: loadingPayroll } = useQuery({
    queryKey: ['payroll', from, to],
    queryFn: () => getPayroll(from, to),
  });

  const payrollByBarber = new Map((payroll ?? []).map((p) => [p.userId, p]));
  const totalToPay = (payroll ?? []).reduce((sum, p) => sum + p.amountToPay, 0);

  const deactivateMutation = useMutation({
    mutationFn: deactivateEmployee,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
    onError: (error: any) => {
      showAlert('Error', error.response?.data?.error ?? 'No se pudo desactivar');
    },
  });

  const handleDeactivate = (employee: EmployeeResponse) => {
    showAlert(
      'Desactivar empleado',
      `¿Seguro que deseas desactivar a ${employee.fullName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Desactivar', style: 'destructive', onPress: () => deactivateMutation.mutate(employee.userId) },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Equipo</Text>
        <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Agregar</Text>
        </Pressable>
      </View>

      <FlatList
        data={employees}
        keyExtractor={(item) => String(item.userId)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <View style={styles.payrollHeaderRow}>
              <Text style={styles.sectionTitle}>Comisiones y nomina</Text>
              <Pressable onPress={() => setEditingDefault(true)}>
                <Text style={styles.defaultCommissionText}>
                  Por defecto: {defaultCommission ?? '...'}% ✏️
                </Text>
              </Pressable>
            </View>
            <Text style={styles.hint}>Del {from} al {to} — lo que le corresponde a cada barbero segun sus cortes facturados</Text>

            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total a pagar este mes</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalToPay)}</Text>
            </View>

            {loadingPayroll ? (
              <ActivityIndicator color="#D4AF37" style={{ marginVertical: 16 }} />
            ) : (
              (payroll ?? []).map((p) => (
                <View key={p.barberProfileId} style={styles.payrollCard}>
                  <View style={styles.payrollCardTop}>
                    <Text style={styles.payrollName}>{p.barberName}</Text>
                    <Pressable onPress={() => {
                      const employee = employees?.find((e) => e.userId === p.userId);
                      if (employee) setEditingCommissionFor(employee);
                    }}>
                      <Text style={styles.payrollPct}>{p.commissionPercentage}% {p.usesDefaultCommission ? '(default)' : ''} ✏️</Text>
                    </Pressable>
                  </View>
                  <View style={styles.payrollCardBottom}>
                    <Text style={styles.payrollMeta}>{p.cutsCount} cortes · {formatCurrency(p.totalRevenue)} facturados</Text>
                    <Text style={styles.payrollAmount}>{formatCurrency(p.amountToPay)}</Text>
                  </View>
                </View>
              ))
            )}

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Mi Equipo</Text>
          </>
        }
        ListEmptyComponent={<Text style={styles.emptyText}>Aun no tienes empleados registrados.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.fullName}</Text>
              <Text style={styles.cardEmail}>{item.email}</Text>
              <View style={styles.badgeRow}>
                <View style={[styles.roleBadge, item.role === 'BARBER' ? styles.roleBadgeBarber : styles.roleBadgeAdmin]}>
                  <Text style={styles.roleBadgeText}>{item.role === 'BARBER' ? 'Barbero' : 'Admin'}</Text>
                </View>
                {!item.isActive && (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveBadgeText}>Inactivo</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.cardActions}>
              {item.role === 'BARBER' && item.barberProfileId && (
                <Pressable
                  style={styles.actionButton}
                  onPress={() => router.push(`/(admin)/schedule/${item.barberProfileId}`)}
                >
                  <Text style={styles.actionButtonText}>Horario</Text>
                </Pressable>
              )}
              {item.isActive && (
                <Pressable style={styles.deactivateButton} onPress={() => handleDeactivate(item)}>
                  <Text style={styles.deactivateButtonText}>Desactivar</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      />

      <CreateEmployeeModal visible={modalVisible} onClose={() => setModalVisible(false)} />

      <DefaultCommissionModal
        visible={editingDefault}
        current={defaultCommission}
        onClose={() => setEditingDefault(false)}
        onDone={() => toast.show('Comision por defecto actualizada')}
      />

      <BarberCommissionModal
        employee={editingCommissionFor}
        defaultCommission={defaultCommission}
        onClose={() => setEditingCommissionFor(null)}
        onDone={() => toast.show('Comision del barbero actualizada')}
      />

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={toast.hide} />
    </View>
  );
}

function DefaultCommissionModal({
  visible,
  current,
  onClose,
  onDone,
}: {
  visible: boolean;
  current: number | undefined;
  onClose: () => void;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(current != null ? String(current) : '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => updateDefaultCommission(Number(value)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['commission-default'] });
      await queryClient.invalidateQueries({ queryKey: ['payroll'] });
      onDone();
      onClose();
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.error ?? 'No se pudo actualizar');
    },
  });

  const handleSubmit = () => {
    const num = Number(value);
    if (!value.trim() || Number.isNaN(num) || num < 0 || num > 100) {
      setErrorMessage('Ingresa un numero entre 0 y 100');
      return;
    }
    setErrorMessage(null);
    mutation.mutate();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} onShow={() => setValue(current != null ? String(current) : '')}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Comision por defecto de la barberia</Text>
          <Text style={styles.modalSubtitle}>Se usa para cualquier barbero que no tenga su propio % configurado.</Text>
          <TextInput style={styles.input} placeholder="Ej. 50" placeholderTextColor="#888" value={value} onChangeText={setValue} keyboardType="numeric" />
          {errorMessage && <Text style={styles.modalError}>{errorMessage}</Text>}
          <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? <ActivityIndicator color="#121212" /> : <Text style={styles.submitButtonText}>Guardar</Text>}
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function BarberCommissionModal({
  employee,
  defaultCommission,
  onClose,
  onDone,
}: {
  employee: EmployeeResponse | null;
  defaultCommission: number | undefined;
  onClose: () => void;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (commissionPercentage: number | null) =>
      updateBarberCommission(employee!.userId, { commissionPercentage }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
      await queryClient.invalidateQueries({ queryKey: ['payroll'] });
      onDone();
      onClose();
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.error ?? 'No se pudo actualizar');
    },
  });

  const handleSubmit = () => {
    const num = Number(value);
    if (!value.trim() || Number.isNaN(num) || num < 0 || num > 100) {
      setErrorMessage('Ingresa un numero entre 0 y 100');
      return;
    }
    setErrorMessage(null);
    mutation.mutate(num);
  };

  const handleUseDefault = () => {
    setErrorMessage(null);
    mutation.mutate(null);
  };

  return (
    <Modal
      visible={!!employee}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => setValue(employee?.commissionPercentage != null ? String(employee.commissionPercentage) : '')}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Comision de {employee?.fullName}</Text>
          <Text style={styles.modalSubtitle}>
            Actualmente usa {employee?.commissionPercentage != null ? `${employee.commissionPercentage}% propio` : `el ${defaultCommission ?? '...'}% por defecto de la barberia`}.
          </Text>
          <TextInput style={styles.input} placeholder="Ej. 60" placeholderTextColor="#888" value={value} onChangeText={setValue} keyboardType="numeric" />
          {errorMessage && <Text style={styles.modalError}>{errorMessage}</Text>}
          <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? <ActivityIndicator color="#121212" /> : <Text style={styles.submitButtonText}>Guardar % propio</Text>}
          </Pressable>
          <Pressable style={styles.useDefaultButton} onPress={handleUseDefault} disabled={mutation.isPending}>
            <Text style={styles.useDefaultButtonText}>Usar el % por defecto de la barberia</Text>
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function CreateEmployeeModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<EmployeeRole>('BARBER');
  const [experienceYears, setExperienceYears] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      resetAndClose();
    },
    onError: (error: any) => {
      const fieldErrors = error.response?.data?.fields;
      if (fieldErrors) {
        setErrorMessage(String(Object.values(fieldErrors)[0]));
      } else {
        setErrorMessage(error.response?.data?.error ?? 'No se pudo crear el empleado');
      }
    },
  });

  const resetAndClose = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setRole('BARBER');
    setExperienceYears('');
    setErrorMessage(null);
    onClose();
  };

  const handleSubmit = () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setErrorMessage('Completa todos los campos obligatorios');
      return;
    }

    mutation.mutate({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      role,
      experienceYears: role === 'BARBER' && experienceYears ? Number(experienceYears) : undefined,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={resetAndClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>Nuevo empleado</Text>

            <View style={styles.roleToggle}>
              <Pressable
                style={[styles.roleOption, role === 'BARBER' && styles.roleOptionSelected]}
                onPress={() => setRole('BARBER')}
              >
                <Text style={[styles.roleOptionText, role === 'BARBER' && styles.roleOptionTextSelected]}>Barbero</Text>
              </Pressable>
              <Pressable
                style={[styles.roleOption, role === 'ADMIN_BARBERSHOP' && styles.roleOptionSelected]}
                onPress={() => setRole('ADMIN_BARBERSHOP')}
              >
                <Text style={[styles.roleOptionText, role === 'ADMIN_BARBERSHOP' && styles.roleOptionTextSelected]}>Administrador</Text>
              </Pressable>
            </View>

            <TextInput style={styles.input} placeholder="Nombre completo" placeholderTextColor="#888" value={fullName} onChangeText={setFullName} />
            <TextInput style={styles.input} placeholder="Correo" placeholderTextColor="#888" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <TextInput style={styles.input} placeholder="Telefono" placeholderTextColor="#888" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Contrasena (min. 8 caracteres)" placeholderTextColor="#888" value={password} onChangeText={setPassword} secureTextEntry />

            {role === 'BARBER' && (
              <TextInput style={styles.input} placeholder="Años de experiencia (opcional)" placeholderTextColor="#888" value={experienceYears} onChangeText={setExperienceYears} keyboardType="number-pad" />
            )}

            {errorMessage && <Text style={styles.modalError}>{errorMessage}</Text>}

            <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={mutation.isPending}>
              {mutation.isPending ? <ActivityIndicator color="#121212" /> : <Text style={styles.submitButtonText}>Crear empleado</Text>}
            </Pressable>

            <Pressable style={styles.cancelButton} onPress={resetAndClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  addButton: { backgroundColor: '#D4AF37', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addButtonText: { color: '#121212', fontWeight: '700', fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 40 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  payrollHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  defaultCommissionText: { color: '#D4AF37', fontSize: 13, fontWeight: '600' },
  hint: { color: '#888', fontSize: 11, marginBottom: 12 },
  totalCard: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#D4AF37' },
  totalLabel: { color: '#888', fontSize: 12 },
  totalValue: { color: '#D4AF37', fontSize: 22, fontWeight: '700', marginTop: 4 },
  payrollCard: { backgroundColor: '#1E1E1E', borderRadius: 10, padding: 12, marginBottom: 8 },
  payrollCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payrollName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  payrollPct: { color: '#D4AF37', fontSize: 12, fontWeight: '600' },
  payrollCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  payrollMeta: { color: '#888', fontSize: 12 },
  payrollAmount: { color: '#4CAF50', fontSize: 15, fontWeight: '700' },
  card: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardInfo: { marginBottom: 10 },
  cardName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  cardEmail: { color: '#aaa', fontSize: 12, marginTop: 2 },
  badgeRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
  roleBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  roleBadgeBarber: { backgroundColor: '#2196F3' },
  roleBadgeAdmin: { backgroundColor: '#9C27B0' },
  roleBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  inactiveBadge: { backgroundColor: '#3A3A3A', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  inactiveBadgeText: { color: '#888', fontSize: 11 },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionButton: { borderWidth: 1, borderColor: '#D4AF37', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  actionButtonText: { color: '#D4AF37', fontSize: 12, fontWeight: '600' },
  deactivateButton: { borderWidth: 1, borderColor: '#FF6B6B', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  deactivateButtonText: { color: '#FF6B6B', fontSize: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  modalSubtitle: { color: '#888', fontSize: 12, marginBottom: 14 },
  roleToggle: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  roleOption: { flex: 1, borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  roleOptionSelected: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  roleOptionText: { color: '#fff', fontSize: 13 },
  roleOptionTextSelected: { color: '#121212', fontWeight: '700' },
  input: { backgroundColor: '#121212', color: '#fff', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, fontSize: 14, borderWidth: 1, borderColor: '#2A2A2A' },
  modalError: { color: '#FF6B6B', fontSize: 13, marginBottom: 8, textAlign: 'center' },
  submitButton: { backgroundColor: '#D4AF37', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitButtonText: { color: '#121212', fontWeight: '700' },
  useDefaultButton: { borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  useDefaultButtonText: { color: '#888', fontSize: 13, fontWeight: '600' },
  cancelButton: { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  cancelButtonText: { color: '#888' },
});
