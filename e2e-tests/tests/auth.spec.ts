import { test, expect } from '@playwright/test';

/**
 * Cuentas semilla de db/init.sql (barbershop_id=1, "Estilo Urbano"),
 * password unica para todas: "Password123".
 */
const ADMIN = { email: 'carlos@estilourbano.com', password: 'Password123' };
const BARBER = { email: 'andres@estilourbano.com', password: 'Password123' };
const CLIENT = { email: 'maria.cliente@gmail.com', password: 'Password123' };

async function login(page: import('@playwright/test').Page, creds: { email: string; password: string }) {
  await page.goto('/login');
  await page.getByPlaceholder('tucorreo@ejemplo.com').fill(creds.email);
  await page.getByPlaceholder('Tu contrasena').fill(creds.password);
  await page.getByText('Iniciar sesion').click();
}

test.describe('Login por rol', () => {
  test('un admin de barberia llega a su Dashboard', async ({ page }) => {
    await login(page, ADMIN);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('un barbero llega a Mi Agenda', async ({ page }) => {
    await login(page, BARBER);
    await expect(page.getByRole('heading', { name: 'Mi Agenda' })).toBeVisible();
  });

  test('un cliente llega al listado de barberias', async ({ page }) => {
    await login(page, CLIENT);
    await expect(page.getByText(/Barberias (cerca de ti|disponibles)/)).toBeVisible();
  });

  test('credenciales invalidas muestran un error y no navegan', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('tucorreo@ejemplo.com').fill(ADMIN.email);
    await page.getByPlaceholder('Tu contrasena').fill('contrasena-incorrecta');
    await page.getByText('Iniciar sesion').click();

    await expect(page.getByText(/no se pudo iniciar sesion|credenciales/i)).toBeVisible();
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Sesion y navegacion protegida', () => {
  test('entrar directo a una ruta protegida sin sesion redirige al login/bienvenida', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/welcome|login/);
  });

  test('cerrar sesion y volver atras con el navegador NO regresa a la pantalla protegida', async ({ page }) => {
    await login(page, ADMIN);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Ir al perfil y cerrar sesion.
    await page.getByText('Perfil').click();
    await page.getByText('Cerrar sesion').click();

    // Debe quedar fuera de cualquier area protegida.
    await expect(page).toHaveURL(/welcome|login/);

    // El boton "atras" del navegador no debe revivir el estado autenticado.
    // (No se afirma una URL especifica aca: como el login/logout usan
    // router.replace(), el historial real del navegador puede quedar vacio
    // y goBack() termina en about:blank -- eso tambien es un resultado
    // seguro. Lo que de verdad importa, y lo unico que se afirma, es que
    // el contenido protegido no vuelve a aparecer.)
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).not.toBeVisible();
  });

  test('recargar la pagina siempre vuelve a pedir login (sin persistencia de sesion)', async ({ page }) => {
    await login(page, CLIENT);
    await expect(page.getByText(/Barberias (cerca de ti|disponibles)/)).toBeVisible();

    await page.reload();

    await expect(page).toHaveURL(/welcome|login/);
  });
});
