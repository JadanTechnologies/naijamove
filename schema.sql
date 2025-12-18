-- AmanaRide Supabase Database Schema
-- Copy and paste this into Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'DRIVER', 'PASSENGER', 'STAFF')),
    wallet_balance DECIMAL(10,2) DEFAULT 0,
    phone TEXT,
    nin TEXT,
    is_nin_verified BOOLEAN DEFAULT FALSE,
    bank_account JSONB,
    avatar TEXT,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'BANNED', 'SUSPENDED')),
    suspension_reason TEXT,
    ip TEXT,
    device TEXT,
    isp TEXT,
    location JSONB,
    is_online BOOLEAN DEFAULT FALSE,
    vehicle_type TEXT,
    license_plate TEXT,
    rating DECIMAL(3,2),
    total_trips INTEGER DEFAULT 0,
    vehicle_capacity_kg INTEGER,
    current_load_kg INTEGER DEFAULT 0,
    load_status TEXT DEFAULT 'EMPTY' CHECK (load_status IN ('EMPTY', 'HALF_LOAD', 'FULL_LOAD', 'OVERLOAD')),
    password TEXT,
    totp_secret TEXT,
    is_totp_setup BOOLEAN DEFAULT FALSE,
    magic_link TEXT,
    magic_link_expires TIMESTAMP WITH TIME ZONE,
    permissions TEXT[],
    token TEXT,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES users(id),
    referral_count INTEGER DEFAULT 0,
    referral_earnings DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rides table
CREATE TABLE rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passenger_id UUID REFERENCES users(id),
    driver_id UUID REFERENCES users(id),
    type TEXT NOT NULL CHECK (type IN ('RIDE', 'LOGISTICS')),
    vehicle_type TEXT NOT NULL,
    pickup_address TEXT NOT NULL,
    dropoff_address TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    distance_km DECIMAL(5,2) NOT NULL,
    parcel_description TEXT,
    parcel_weight TEXT,
    parcel_weight_value DECIMAL(5,2),
    receiver_phone TEXT,
    rejected_by UUID[],
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    estimated_weight_kg DECIMAL(5,2)
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID REFERENCES rides(id),
    ticket_id TEXT,
    sender_id UUID REFERENCES users(id),
    sender_name TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE,
    is_ai BOOLEAN DEFAULT FALSE
);

-- Support tickets table
CREATE TABLE support_tickets (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    user_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED', 'ESCALATED')),
    priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    messages JSONB DEFAULT '[]'::jsonb
);

-- Knowledge base table
CREATE TABLE knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}'
);

-- Payment transactions table
CREATE TABLE payment_transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('EARNING', 'WITHDRAWAL', 'PAYMENT', 'DEPOSIT')),
    ride_id UUID REFERENCES rides(id),
    passenger_id UUID REFERENCES users(id),
    passenger_name TEXT,
    driver_id UUID REFERENCES users(id),
    driver_name TEXT,
    amount DECIMAL(10,2) NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('PAYSTACK', 'WALLET', 'CASH', 'TRANSFER', 'FLUTTERWAVE')),
    status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'PENDING', 'FAILED', 'PENDING_APPROVAL')),
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reference TEXT NOT NULL,
    bank_details TEXT,
    proof_url TEXT
);

-- User activity table
CREATE TABLE user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details TEXT NOT NULL,
    ip TEXT NOT NULL
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings table (single row)
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branding JSONB NOT NULL,
    seo JSONB,
    landing_page JSONB NOT NULL,
    mobile_apps JSONB NOT NULL,
    payments JSONB NOT NULL,
    communication JSONB NOT NULL,
    ai JSONB NOT NULL,
    trackers JSONB NOT NULL,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    security JSONB NOT NULL,
    pricing JSONB NOT NULL,
    integrations JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cron jobs table
CREATE TABLE cron_jobs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    schedule TEXT NOT NULL,
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'IDLE' CHECK (status IN ('IDLE', 'RUNNING', 'FAILED')),
    enabled BOOLEAN DEFAULT TRUE
);

-- Templates table
CREATE TABLE notification_templates (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('EMAIL', 'SMS', 'PUSH')),
    name TEXT NOT NULL,
    subject TEXT,
    body TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}'
);

-- Announcements table
CREATE TABLE announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target TEXT NOT NULL CHECK (target IN ('ALL', 'DRIVERS', 'PASSENGERS')),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE
);

-- Insert demo data
-- System settings
INSERT INTO system_settings (branding, landing_page, mobile_apps, payments, communication, ai, trackers, security, pricing, integrations) VALUES (
    '{"appName": "AmanaRide", "logoUrl": "https://cdn-icons-png.flaticon.com/512/2972/2972185.png", "primaryColor": "#10b981"}',
    '{"heroTitle": "The Future of Logistics & Rides", "heroSubtitle": "Moving Sokoto & Nigeria Forward", "heroDescription": "Move parcels, people, and cargo with Nigeria''s most advanced AI-powered fleet. Real-time tracking for Okada, Keke, and Mini-bus in Sokoto and beyond.", "stats": {"rides": "2.5M+", "drivers": "50k+", "matchTime": "0.5s", "cities": "36"}, "contactEmail": "support@amanaride.ng", "contactPhone": "+234 800 NAIJA"}',
    '{"androidUrl": "https://play.google.com/store/apps/details?id=com.amanaride.app", "iosUrl": "https://apps.apple.com/ng/app/amanaride", "version": "2.1.0", "releaseNotes": "Performance improvements and new dark mode.", "lastUpdated": "2024-12-17T00:00:00Z"}',
    '{"paystackEnabled": true, "paystackSecretKey": "sk_test_xxxxxxxxxxxxxxxxxxxx", "flutterwaveEnabled": false, "flutterwaveSecretKey": "", "monnifyEnabled": false, "manualEnabled": true, "manualBankDetails": "GTBank - 0123456789 - AmanaRide Ltd"}',
    '{"emailProvider": "RESEND", "emailApiKey": "re_123456789", "smsProvider": "TWILIO", "smsApiKey": "", "pushProvider": "ONESIGNAL", "pushApiKey": ""}',
    '{"geminiEnabled": true, "provider": "GEMINI", "apiKey": ""}',
    '{"enabled": true, "integrations": [{"id": "trk-1", "provider": "TELTONIKA", "name": "Okada Fleet Tracker", "enabled": true, "serverIp": "192.168.1.50", "port": 5027, "protocol": "TCP"}]}',
    '{"magicLinkExpiryHours": 24, "blockedIps": [], "blockedCountries": [], "blockedRegions": [], "blockedDevices": [], "blockedOs": [], "blockedBrowsers": []}',
    '{"OKADA": {"base": 200, "perKm": 50}, "KEKE": {"base": 300, "perKm": 80}, "MINIBUS": {"base": 500, "perKm": 120}, "TRUCK": {"base": 2000, "perKm": 500}, "logistics": {"baseFare": 500, "perKg": 100, "perKm": 50, "interstateMultiplier": 1.5}}',
    '{"ninApiKey": "nin_live_xxxxxxxx", "voiceProvider": "ZEGOCLOUD", "voiceAppId": "1234567890", "voiceAppSign": "abcdef1234567890"}'
);

-- Demo users
INSERT INTO users (id, name, email, role, wallet_balance, phone, avatar, status, location, is_totp_setup, totp_secret, referral_code) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Super Admin', 'admin@amanaride.ng', 'ADMIN', 5000000, '+2348012345678', 'https://ui-avatars.com/api/?name=Super+Admin&background=10b981&color=fff', 'ACTIVE', '{"lat": 13.0059, "lng": 5.2476}', true, 'AMANARIDEADMIN', 'ADMIN2024'),
('550e8400-e29b-41d4-a716-446655440001', 'Support Agent', 'staff@amanaride.ng', 'STAFF', 0, '+2348023456789', 'https://ui-avatars.com/api/?name=Support+Agent&background=6366f1&color=fff', 'ACTIVE', '{"lat": 13.0060, "lng": 5.2470}', false, null, 'STAFF2024'),
('550e8400-e29b-41d4-a716-446655440002', 'Musa Ibrahim', 'musa@amanaride.ng', 'DRIVER', 12500, '+2348012345678', 'https://ui-avatars.com/api/?name=Musa+Ibrahim&background=f97316&color=fff', 'ACTIVE', '{"lat": 13.0100, "lng": 5.2500}', true, 'DRIVERSECRET', 'MUSA123'),
('550e8400-e29b-41d4-a716-446655440003', 'Tola Adebayo', 'tola@gmail.com', 'PASSENGER', 5000, '+2348098765432', 'https://ui-avatars.com/api/?name=Tola+Adebayo&background=3b82f6&color=fff', 'ACTIVE', '{"lat": 13.0080, "lng": 5.2480}', true, 'PASSENGERSECRET', 'TOLA456');

-- Update driver details
UPDATE users SET
    vehicle_type = 'OKADA',
    license_plate = 'SOK-882-AB',
    rating = 4.8,
    total_trips = 1240,
    is_online = true,
    vehicle_capacity_kg = 150,
    current_load_kg = 0,
    load_status = 'EMPTY',
    bank_account = '{"bankName": "Wema Bank", "accountNumber": "9923456781", "accountName": "AmanaRide - Musa Ibrahim"}'
WHERE id = '550e8400-e29b-41d4-a716-446655440002';

-- Update passenger details
UPDATE users SET
    bank_account = '{"bankName": "GTBank", "accountNumber": "0123456789", "accountName": "AmanaRide - Tola Adebayo"}'
WHERE id = '550e8400-e29b-41d4-a716-446655440003';

-- Demo knowledge base
INSERT INTO knowledge_base (question, answer, tags) VALUES
('How do I fund my wallet?', 'You can fund your wallet via Bank Transfer or Paystack. Go to the Wallet section in the app.', ARRAY['wallet', 'payment']),
('What is the base fare for Okada?', 'The base fare for Okada rides is ₦200, plus ₦50 per km.', ARRAY['pricing', 'okada']),
('Do you do interstate delivery?', 'Currently, we only support logistics within Sokoto. Interstate is coming soon.', ARRAY['logistics', 'delivery']);

-- Demo cron jobs
INSERT INTO cron_jobs (id, name, schedule, next_run, status, enabled) VALUES
('job-1', 'Auto-Assign Logistics', 'Every 5 mins', NOW() + INTERVAL '5 minutes', 'IDLE', true),
('job-2', 'Cleanup Stale Requests', 'Hourly', NOW() + INTERVAL '1 hour', 'IDLE', true),
('job-3', 'Driver Payout Processing', 'Daily at 00:00', NOW() + INTERVAL '1 day', 'IDLE', false);

-- Create indexes for better performance
CREATE INDEX idx_rides_passenger_id ON rides(passenger_id);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_chat_messages_ride_id ON chat_messages(ride_id);
CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_payment_transactions_passenger_id ON payment_transactions(passenger_id);
CREATE INDEX idx_payment_transactions_driver_id ON payment_transactions(driver_id);

-- Enable Row Level Security (RLS) - optional but recommended
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies (basic example - adjust as needed)
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));

-- E-commerce tables for E-Shago

-- Companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    location TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    website TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    category TEXT,
    stock_quantity INTEGER DEFAULT 0,
    company_id UUID REFERENCES companies(id),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passenger_id UUID REFERENCES users(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    delivery_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product requests table
CREATE TABLE product_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passenger_id UUID REFERENCES users(id),
    product_name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'FULFILLED')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert demo companies
INSERT INTO companies (id, name, description, logo_url, location, contact_email, contact_phone, website) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'Shoprite Nigeria', 'Leading supermarket chain in Nigeria', 'https://example.com/shoprite-logo.png', 'Sokoto, Nigeria', 'info@shoprite.ng', '+2348012345678', 'https://shoprite.ng'),
('550e8400-e29b-41d4-a716-446655440011', 'Jumia Nigeria', 'Online marketplace for electronics and more', 'https://example.com/jumia-logo.png', 'Lagos, Nigeria', 'support@jumia.com.ng', '+2348023456789', 'https://jumia.com.ng'),
('550e8400-e29b-41d4-a716-446655440012', 'Konga', 'E-commerce platform for various products', 'https://example.com/konga-logo.png', 'Lagos, Nigeria', 'hello@konga.com', '+2348034567890', 'https://konga.com');

-- Insert demo products
INSERT INTO products (name, description, price, image_url, category, stock_quantity, company_id) VALUES
('iPhone 15 Pro', 'Latest Apple smartphone with advanced features', 1500000.00, 'https://example.com/iphone15.jpg', 'Electronics', 10, '550e8400-e29b-41d4-a716-446655440011'),
('Samsung Galaxy S24', 'High-end Android smartphone', 1200000.00, 'https://example.com/galaxy-s24.jpg', 'Electronics', 15, '550e8400-e29b-41d4-a716-446655440011'),
('Nike Air Max', 'Comfortable running shoes', 45000.00, 'https://example.com/nike-airmax.jpg', 'Fashion', 50, '550e8400-e29b-41d4-a716-446655440010'),
('Dell Laptop', 'Powerful laptop for work and gaming', 800000.00, 'https://example.com/dell-laptop.jpg', 'Electronics', 5, '550e8400-e29b-41d4-a716-446655440012'),
('Rice (50kg)', 'Premium quality rice', 35000.00, 'https://example.com/rice.jpg', 'Food', 100, '550e8400-e29b-41d4-a716-446655440010');

-- Create indexes for e-commerce tables
CREATE INDEX idx_products_company_id ON products(company_id);
CREATE INDEX idx_orders_passenger_id ON orders(passenger_id);
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_product_requests_passenger_id ON product_requests(passenger_id);

-- Enable Row Level Security for e-commerce tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_requests ENABLE ROW LEVEL SECURITY;

-- Basic policies (adjust as needed)
CREATE POLICY "Public can view active companies" ON companies FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage companies" ON companies FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "Public can view available products" ON products FOR SELECT USING (is_available = true);
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (passenger_id = auth.uid());
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "Users can view their own requests" ON product_requests FOR SELECT USING (passenger_id = auth.uid());
CREATE POLICY "Admins can view all requests" ON product_requests FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));

-- Note: Add more policies as needed for your security requirements