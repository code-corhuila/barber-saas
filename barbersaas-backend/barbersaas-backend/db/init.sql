-- =========================================================
-- BARBERSAAS - SCRIPT DE BASE DE DATOS
-- Motor: PostgreSQL 16.x
-- =========================================================
-- La base de datos "barbersaas" ya existe al ejecutar este script
-- (creada por POSTGRES_DB en docker-compose, o manualmente con
-- `createdb barbersaas` en instalacion local).

-- Funcion reutilizable para simular el "ON UPDATE CURRENT_TIMESTAMP" de MySQL
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 1. PLANES DE SUSCRIPCION
-- =========================================================
CREATE TABLE subscription_plans (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    max_barbers INT NOT NULL,
    features_json JSON NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 2. BARBERIAS (TENANTS)
-- =========================================================
CREATE TABLE barbershops (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    address VARCHAR(255),
    city VARCHAR(80) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    phone VARCHAR(20),
    whatsapp_number VARCHAR(20),
    logo_url VARCHAR(255),
    status VARCHAR(255) NOT NULL DEFAULT 'TRIAL'
        CHECK (status IN ('ACTIVE','SUSPENDED','TRIAL','CANCELLED')),
    plan_id BIGINT NULL,
    timezone VARCHAR(255) NOT NULL DEFAULT 'America/Bogota',
    cancellation_policy_hours INT NOT NULL DEFAULT 2,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    trial_ends_at TIMESTAMP NULL,
    default_commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 50.00,
    CONSTRAINT fk_barbershop_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
);

CREATE TRIGGER trg_barbershops_updated_at
    BEFORE UPDATE ON barbershops
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_barbershops_city ON barbershops(city);
CREATE INDEX idx_barbershops_status ON barbershops(status);
CREATE INDEX idx_barbershops_location ON barbershops(latitude, longitude);

-- =========================================================
-- 3. USUARIOS (todos los roles)
-- =========================================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    barbershop_id BIGINT NULL, -- NULL para SUPER_ADMIN y CLIENT
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    profile_photo_url VARCHAR(255),
    role VARCHAR(255) NOT NULL
        CHECK (role IN ('SUPER_ADMIN','ADMIN_BARBERSHOP','BARBER','CLIENT')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_barbershop FOREIGN KEY (barbershop_id) REFERENCES barbershops(id) ON DELETE CASCADE
);

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_barbershop ON users(barbershop_id);
CREATE INDEX idx_users_email ON users(email);

-- =========================================================
-- 4. SERVICIOS
-- =========================================================
CREATE TABLE services (
    id BIGSERIAL PRIMARY KEY,
    barbershop_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    duration_minutes INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_services_barbershop FOREIGN KEY (barbershop_id) REFERENCES barbershops(id) ON DELETE CASCADE
);

CREATE INDEX idx_services_barbershop ON services(barbershop_id);

-- =========================================================
-- 5. PERFILES DE BARBERO
-- =========================================================
CREATE TABLE barber_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    barbershop_id BIGINT NOT NULL,
    experience_years INT DEFAULT 0,
    bio VARCHAR(500),
    rating_avg DECIMAL(3,2) DEFAULT 0.00,
    rating_count INT DEFAULT 0,
    commission_percentage DECIMAL(5,2) NULL,
    CONSTRAINT fk_barberprofile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_barberprofile_barbershop FOREIGN KEY (barbershop_id) REFERENCES barbershops(id) ON DELETE CASCADE
);

CREATE TABLE barber_specialties (
    id BIGSERIAL PRIMARY KEY,
    barber_profile_id BIGINT NOT NULL,
    specialty_name VARCHAR(80) NOT NULL,
    CONSTRAINT fk_specialty_barber FOREIGN KEY (barber_profile_id) REFERENCES barber_profiles(id) ON DELETE CASCADE
);

-- =========================================================
-- 6. HORARIOS DE BARBEROS
-- =========================================================
CREATE TABLE barber_schedules (
    id BIGSERIAL PRIMARY KEY,
    barber_profile_id BIGINT NOT NULL,
    day_of_week INT NOT NULL, -- 0=Domingo ... 6=Sabado
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_schedule_barber FOREIGN KEY (barber_profile_id) REFERENCES barber_profiles(id) ON DELETE CASCADE,
    CONSTRAINT chk_schedule_time CHECK (end_time > start_time)
);

CREATE INDEX idx_schedule_barber_day ON barber_schedules(barber_profile_id, day_of_week);

CREATE TABLE schedule_exceptions (
    id BIGSERIAL PRIMARY KEY,
    barber_profile_id BIGINT NOT NULL,
    exception_date DATE NOT NULL,
    is_day_off BOOLEAN NOT NULL DEFAULT TRUE,
    start_time TIME NULL,
    end_time TIME NULL,
    reason VARCHAR(150),
    CONSTRAINT fk_exception_barber FOREIGN KEY (barber_profile_id) REFERENCES barber_profiles(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_exception_unique ON schedule_exceptions(barber_profile_id, exception_date);

-- =========================================================
-- 7. CITAS (APPOINTMENTS)
-- =========================================================
CREATE TABLE appointments (
    id BIGSERIAL PRIMARY KEY,
    barbershop_id BIGINT NOT NULL,
    client_id BIGINT NOT NULL,
    barber_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW')),
    price_at_booking DECIMAL(10,2) NOT NULL,
    notes VARCHAR(500),
    cancelled_reason VARCHAR(255) NULL,
    promotion_id BIGINT NULL,
    discount_amount DECIMAL(10,2) NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appt_barbershop FOREIGN KEY (barbershop_id) REFERENCES barbershops(id) ON DELETE CASCADE,
    CONSTRAINT fk_appt_client FOREIGN KEY (client_id) REFERENCES users(id),
    CONSTRAINT fk_appt_barber FOREIGN KEY (barber_id) REFERENCES barber_profiles(id),
    CONSTRAINT fk_appt_service FOREIGN KEY (service_id) REFERENCES services(id)
);

CREATE TRIGGER trg_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_appt_barber_date ON appointments(barber_id, appointment_date, start_time);
CREATE INDEX idx_appt_barbershop_date ON appointments(barbershop_id, appointment_date);
CREATE INDEX idx_appt_client ON appointments(client_id);
CREATE INDEX idx_appt_status ON appointments(status);

-- =========================================================
-- 8. FIDELIZACION
-- =========================================================
CREATE TABLE loyalty_rewards_config (
    id BIGSERIAL PRIMARY KEY,
    barbershop_id BIGINT NOT NULL,
    stickers_required INT NOT NULL DEFAULT 10,
    reward_description VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_loyaltyconfig_barbershop FOREIGN KEY (barbershop_id) REFERENCES barbershops(id) ON DELETE CASCADE
);

CREATE TABLE loyalty_cards (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL,
    barbershop_id BIGINT NOT NULL,
    stickers_count INT NOT NULL DEFAULT 0,
    total_rewards_redeemed INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_loyaltycard_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_loyaltycard_barbershop FOREIGN KEY (barbershop_id) REFERENCES barbershops(id) ON DELETE CASCADE,
    CONSTRAINT uq_client_barbershop UNIQUE (client_id, barbershop_id)
);

CREATE TRIGGER trg_loyalty_cards_last_updated
    BEFORE UPDATE ON loyalty_cards
    FOR EACH ROW EXECUTE FUNCTION set_last_updated();

CREATE TABLE loyalty_transactions (
    id BIGSERIAL PRIMARY KEY,
    loyalty_card_id BIGINT NOT NULL,
    appointment_id BIGINT NULL,
    type VARCHAR(255) NOT NULL
        CHECK (type IN ('STICKER_EARNED','REWARD_REDEEMED')),
    granted_by_user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_loyaltytx_card FOREIGN KEY (loyalty_card_id) REFERENCES loyalty_cards(id) ON DELETE CASCADE,
    CONSTRAINT fk_loyaltytx_appt FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    CONSTRAINT fk_loyaltytx_user FOREIGN KEY (granted_by_user_id) REFERENCES users(id)
);

-- =========================================================
-- 9. CALIFICACIONES Y RESENAS
-- =========================================================
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL,
    barbershop_id BIGINT NOT NULL,
    barber_profile_id BIGINT NULL,
    appointment_id BIGINT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_client FOREIGN KEY (client_id) REFERENCES users(id),
    CONSTRAINT fk_review_barbershop FOREIGN KEY (barbershop_id) REFERENCES barbershops(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_barber FOREIGN KEY (barber_profile_id) REFERENCES barber_profiles(id),
    CONSTRAINT fk_review_appt FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

CREATE INDEX idx_review_barbershop ON reviews(barbershop_id);
CREATE INDEX idx_review_barber ON reviews(barber_profile_id);

-- =========================================================
-- 10. INVENTARIO
-- =========================================================
CREATE TABLE inventory_products (
    id BIGSERIAL PRIMARY KEY,
    barbershop_id BIGINT NOT NULL,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(255),
    unit VARCHAR(20) NOT NULL DEFAULT 'unidad',
    current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
    min_stock_alert DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_barbershop FOREIGN KEY (barbershop_id) REFERENCES barbershops(id) ON DELETE CASCADE
);

CREATE INDEX idx_product_barbershop ON inventory_products(barbershop_id);

CREATE TABLE inventory_movements (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    movement_type VARCHAR(255) NOT NULL
        CHECK (movement_type IN ('IN','OUT')),
    quantity DECIMAL(10,2) NOT NULL,
    reason VARCHAR(255),
    created_by_user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_movement_product FOREIGN KEY (product_id) REFERENCES inventory_products(id) ON DELETE CASCADE,
    CONSTRAINT fk_movement_user FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE INDEX idx_movement_product ON inventory_movements(product_id, created_at);

-- =========================================================
-- 11. FINANZAS (INGRESOS Y GASTOS)
-- =========================================================
CREATE TABLE finance_records (
    id BIGSERIAL PRIMARY KEY,
    barbershop_id BIGINT NOT NULL,
    type VARCHAR(255) NOT NULL
        CHECK (type IN ('INCOME','EXPENSE')),
    category VARCHAR(80) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description VARCHAR(255),
    record_date DATE NOT NULL,
    related_appointment_id BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_finance_barbershop FOREIGN KEY (barbershop_id) REFERENCES barbershops(id) ON DELETE CASCADE,
    CONSTRAINT fk_finance_appt FOREIGN KEY (related_appointment_id) REFERENCES appointments(id)
);

CREATE INDEX idx_finance_barbershop_date ON finance_records(barbershop_id, record_date);
CREATE INDEX idx_finance_type ON finance_records(type);

-- =========================================================
-- 12. PROMOCIONES
-- =========================================================
CREATE TABLE promotions (
    id BIGSERIAL PRIMARY KEY,
    barbershop_id BIGINT NOT NULL,
    title VARCHAR(120) NOT NULL,
    description VARCHAR(255),
    discount_type VARCHAR(255) NOT NULL
        CHECK (discount_type IN ('PERCENTAGE','FIXED_AMOUNT','TWO_FOR_ONE')),
    discount_value DECIMAL(10,2) NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_promo_barbershop FOREIGN KEY (barbershop_id) REFERENCES barbershops(id) ON DELETE CASCADE
);

CREATE INDEX idx_promo_barbershop_active ON promotions(barbershop_id, is_active);

-- La FK de appointments.promotion_id se agrega aca porque promotions se crea
-- despues de appointments en este script.
ALTER TABLE appointments
    ADD CONSTRAINT fk_appt_promotion FOREIGN KEY (promotion_id) REFERENCES promotions(id);

-- =========================================================
-- 12b. PRODUCTOS VENDIDOS EN UNA CITA (para la factura)
-- =========================================================
CREATE TABLE appointment_products (
    id BIGSERIAL PRIMARY KEY,
    appointment_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_apptproduct_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    CONSTRAINT fk_apptproduct_product FOREIGN KEY (product_id) REFERENCES inventory_products(id)
);

CREATE INDEX idx_apptproduct_appointment ON appointment_products(appointment_id);

-- =========================================================
-- 13. FAVORITOS (clientes <-> barberias)
-- =========================================================
CREATE TABLE client_favorites (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL,
    barbershop_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_favorite_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_favorite_barbershop FOREIGN KEY (barbershop_id) REFERENCES barbershops(id) ON DELETE CASCADE,
    CONSTRAINT uq_client_favorite UNIQUE (client_id, barbershop_id)
);

-- =========================================================
-- 14. GALERIA (portafolio de cortes)
-- =========================================================
CREATE TABLE gallery_images (
    id BIGSERIAL PRIMARY KEY,
    barbershop_id BIGINT NOT NULL,
    barber_profile_id BIGINT NULL,
    image_url VARCHAR(255) NOT NULL,
    caption VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_gallery_barbershop FOREIGN KEY (barbershop_id) REFERENCES barbershops(id) ON DELETE CASCADE,
    CONSTRAINT fk_gallery_barber FOREIGN KEY (barber_profile_id) REFERENCES barber_profiles(id)
);

-- =========================================================
-- 15. NOTIFICACIONES
-- =========================================================
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    body VARCHAR(500) NOT NULL,
    type VARCHAR(255) NOT NULL
        CHECK (type IN ('APPOINTMENT_CONFIRMATION','REMINDER','PROMOTION','SYSTEM')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notification_user ON notifications(user_id, is_read);

CREATE TABLE reward_coupons (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL,
    barbershop_id BIGINT NOT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'USED')),
    appointment_id BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL,
    CONSTRAINT fk_coupon_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_coupon_barbershop FOREIGN KEY (barbershop_id) REFERENCES barbershops(id) ON DELETE CASCADE,
    CONSTRAINT fk_coupon_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
);

CREATE INDEX idx_coupon_client_shop_status ON reward_coupons(client_id, barbershop_id, status);

-- =========================================================
-- 16. DISPOSITIVOS (push notifications - Firebase)
-- =========================================================
CREATE TABLE device_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    platform VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_devicetoken_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_devicetoken_user ON device_tokens(user_id);

-- =========================================================
-- 17. RECUPERACION DE CONTRASENA
-- =========================================================
CREATE TABLE password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_passwordreset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_passwordreset_user ON password_reset_tokens(user_id);

-- =========================================================
-- SEEDERS - Datos de prueba
-- =========================================================

-- Planes de suscripcion
INSERT INTO subscription_plans (name, price, max_barbers, features_json) VALUES
('Basico', 49900.00, 2, '{"reportes_avanzados": false, "promociones": true}'),
('Pro', 99900.00, 6, '{"reportes_avanzados": true, "promociones": true}'),
('Premium', 179900.00, 999, '{"reportes_avanzados": true, "promociones": true, "publicidad_destacada": true}');

-- Barberia de prueba
INSERT INTO barbershops (name, address, city, latitude, longitude, phone, whatsapp_number, status, plan_id) VALUES
('Barberia Estilo Urbano', 'Calle 10 # 5-23, Neiva', 'Neiva', 2.9273, -75.2819, '3001234567', '3001234567', 'ACTIVE', 2);

-- Usuarios
-- IMPORTANTE: el hash de abajo corresponde a la contrasena "Password123" (BCrypt, strength 10)
-- Verificado explicitamente contra ese texto plano (el hash anterior no correspondia).
INSERT INTO users (barbershop_id, full_name, email, password_hash, phone, role) VALUES
(NULL, 'Super Admin', 'superadmin@barbersaas.com', '$2a$10$jIYdOqXrpk2NtupSy3dJ4.iCWnb0CCiQFcHbnXV3zXRMMP.YiPUrW', '3000000000', 'SUPER_ADMIN'),
(1, 'Carlos Perez', 'carlos@estilourbano.com', '$2a$10$jIYdOqXrpk2NtupSy3dJ4.iCWnb0CCiQFcHbnXV3zXRMMP.YiPUrW', '3011111111', 'ADMIN_BARBERSHOP'),
(1, 'Andres Gomez', 'andres@estilourbano.com', '$2a$10$jIYdOqXrpk2NtupSy3dJ4.iCWnb0CCiQFcHbnXV3zXRMMP.YiPUrW', '3022222222', 'BARBER'),
(1, 'Luis Torres', 'luis@estilourbano.com', '$2a$10$jIYdOqXrpk2NtupSy3dJ4.iCWnb0CCiQFcHbnXV3zXRMMP.YiPUrW', '3033333333', 'BARBER'),
(NULL, 'Maria Lopez', 'maria.cliente@gmail.com', '$2a$10$jIYdOqXrpk2NtupSy3dJ4.iCWnb0CCiQFcHbnXV3zXRMMP.YiPUrW', '3044444444', 'CLIENT');

-- Servicios
INSERT INTO services (barbershop_id, name, description, duration_minutes, price) VALUES
(1, 'Corte clasico', 'Corte de cabello tradicional', 30, 20000.00),
(1, 'Corte + Barba', 'Corte de cabello y arreglo de barba', 45, 30000.00),
(1, 'Afeitado premium', 'Afeitado con toalla caliente', 25, 18000.00);

-- Perfiles de barbero
INSERT INTO barber_profiles (user_id, barbershop_id, experience_years, bio) VALUES
(3, 1, 5, 'Especialista en cortes modernos y degradados'),
(4, 1, 8, 'Experto en barbas y afeitado clasico');

INSERT INTO barber_specialties (barber_profile_id, specialty_name) VALUES
(1, 'Degradados'), (1, 'Cortes modernos'),
(2, 'Barbas'), (2, 'Afeitado clasico');

-- Horarios
INSERT INTO barber_schedules (barber_profile_id, day_of_week, start_time, end_time) VALUES
(1, 1, '08:00:00', '18:00:00'),
(1, 2, '08:00:00', '18:00:00'),
(1, 3, '08:00:00', '18:00:00'),
(1, 4, '08:00:00', '18:00:00'),
(1, 5, '08:00:00', '18:00:00'),
(1, 6, '08:00:00', '14:00:00'),
(2, 1, '09:00:00', '19:00:00'),
(2, 2, '09:00:00', '19:00:00'),
(2, 3, '09:00:00', '19:00:00'),
(2, 4, '09:00:00', '19:00:00'),
(2, 5, '09:00:00', '19:00:00');

-- Configuracion de fidelizacion
INSERT INTO loyalty_rewards_config (barbershop_id, stickers_required, reward_description) VALUES
(1, 10, 'Corte gratis al completar 10 visitas');

-- Tarjeta de fidelizacion de la cliente de prueba
INSERT INTO loyalty_cards (client_id, barbershop_id, stickers_count) VALUES
(5, 1, 3);

-- Cita de prueba
INSERT INTO appointments (barbershop_id, client_id, barber_id, service_id, appointment_date, start_time, end_time, status, price_at_booking) VALUES
(1, 5, 1, 2, '2026-06-15', '10:00:00', '10:45:00', 'CONFIRMED', 30000.00);

-- Productos de inventario
INSERT INTO inventory_products (barbershop_id, name, unit, current_stock, min_stock_alert) VALUES
(1, 'Cera para cabello', 'unidad', 12, 3),
(1, 'Shampoo profesional', 'ml', 2000, 500);

-- Registros financieros
INSERT INTO finance_records (barbershop_id, type, category, amount, description, record_date) VALUES
(1, 'INCOME', 'corte', 30000.00, 'Pago cita #1', '2026-06-15'),
(1, 'EXPENSE', 'arriendo', 800000.00, 'Arriendo mensual local', '2026-06-01');

-- =========================================================
-- Alinear las secuencias BIGSERIAL con los IDs insertados por los
-- seeders anteriores (los INSERT no pasan por nextval en algunos
-- clientes al usar valores literales via docker-entrypoint-initdb).
-- =========================================================
SELECT setval(pg_get_serial_sequence('subscription_plans', 'id'), (SELECT MAX(id) FROM subscription_plans));
SELECT setval(pg_get_serial_sequence('barbershops', 'id'), (SELECT MAX(id) FROM barbershops));
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users));
SELECT setval(pg_get_serial_sequence('services', 'id'), (SELECT MAX(id) FROM services));
SELECT setval(pg_get_serial_sequence('barber_profiles', 'id'), (SELECT MAX(id) FROM barber_profiles));
SELECT setval(pg_get_serial_sequence('barber_specialties', 'id'), (SELECT MAX(id) FROM barber_specialties));
SELECT setval(pg_get_serial_sequence('barber_schedules', 'id'), (SELECT MAX(id) FROM barber_schedules));
SELECT setval(pg_get_serial_sequence('appointments', 'id'), (SELECT MAX(id) FROM appointments));
SELECT setval(pg_get_serial_sequence('loyalty_rewards_config', 'id'), (SELECT MAX(id) FROM loyalty_rewards_config));
SELECT setval(pg_get_serial_sequence('loyalty_cards', 'id'), (SELECT MAX(id) FROM loyalty_cards));
SELECT setval(pg_get_serial_sequence('inventory_products', 'id'), (SELECT MAX(id) FROM inventory_products));
SELECT setval(pg_get_serial_sequence('finance_records', 'id'), (SELECT MAX(id) FROM finance_records));
