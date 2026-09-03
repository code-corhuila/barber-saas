import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Prueba de carga basica contra el backend real (dentro de la red de Docker,
 * API_URL apunta al servicio "backend"). Simula usuarios logueandose y
 * consultando endpoints publicos/autenticados representativos.
 *
 * Uso: docker compose --profile test run --rm perf-tests
 */
const API_URL = __ENV.API_URL || 'http://localhost:8080';

export const options = {
  scenarios: {
    carga_normal: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 10 }, // sube a 10 usuarios concurrentes
        { duration: '40s', target: 10 }, // sostiene la carga
        { duration: '10s', target: 0 },  // baja a 0
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<800'], // 95% de las respuestas bajo 800ms
    http_req_failed: ['rate<0.01'],   // menos de 1% de errores
  },
};

const ADMIN = { email: 'carlos@estilourbano.com', password: 'Password123' };

export default function () {
  // 1. Endpoint publico: listar barberias (lo que ve un cliente sin loguearse)
  const publicRes = http.get(`${API_URL}/api/public/barbershops`);
  check(publicRes, {
    'GET /api/public/barbershops -> 200': (r) => r.status === 200,
  });

  // 2. Login
  const loginRes = http.post(
    `${API_URL}/api/auth/login`,
    JSON.stringify(ADMIN),
    { headers: { 'Content-Type': 'application/json' } }
  );
  const loginOk = check(loginRes, {
    'POST /api/auth/login -> 200': (r) => r.status === 200,
  });

  if (loginOk) {
    const token = loginRes.json('token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // 3. Endpoint autenticado tipico: agenda del dia del admin
    const today = new Date().toISOString().split('T')[0];
    const agendaRes = http.get(`${API_URL}/api/admin/appointments?date=${today}`, authHeaders);
    check(agendaRes, {
      'GET /api/admin/appointments -> 200': (r) => r.status === 200,
    });

    // 4. Dashboard (agrega varias consultas del lado del servidor -- el mas pesado)
    const startOfMonth = today.slice(0, 8) + '01';
    const dashboardRes = http.get(
      `${API_URL}/api/admin/dashboard?from=${startOfMonth}&to=${today}`,
      authHeaders
    );
    check(dashboardRes, {
      'GET /api/admin/dashboard -> 200': (r) => r.status === 200,
    });
  }

  sleep(1);
}
