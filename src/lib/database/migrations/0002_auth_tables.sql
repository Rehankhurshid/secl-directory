-- Create OTP Verifications table
CREATE TABLE IF NOT EXISTS otp_verifications (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  session_id VARCHAR(32) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for OTP verifications
CREATE INDEX IF NOT EXISTS session_id_idx ON otp_verifications(session_id);
CREATE INDEX IF NOT EXISTS employee_id_idx ON otp_verifications(employee_id);

-- Create Authentication Sessions table
CREATE TABLE IF NOT EXISTS auth_sessions (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(50) NOT NULL,
  session_token VARCHAR(64) NOT NULL UNIQUE,
  device_info TEXT, -- JSON string of device info
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for auth sessions
CREATE INDEX IF NOT EXISTS session_token_idx ON auth_sessions(session_token);
CREATE INDEX IF NOT EXISTS auth_employee_id_idx ON auth_sessions(employee_id);
CREATE INDEX IF NOT EXISTS expires_at_idx ON auth_sessions(expires_at);

-- Create Biometric Credentials table (for future implementation)
CREATE TABLE IF NOT EXISTS biometric_credentials (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(50) NOT NULL,
  credential_id VARCHAR(255) NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  device_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for biometric credentials
CREATE INDEX IF NOT EXISTS bio_employee_id_idx ON biometric_credentials(employee_id);
CREATE INDEX IF NOT EXISTS credential_id_idx ON biometric_credentials(credential_id);

-- Add comments for documentation
COMMENT ON TABLE otp_verifications IS 'Stores OTP verification sessions for two-factor authentication';
COMMENT ON TABLE auth_sessions IS 'Stores active authentication sessions with expiry';
COMMENT ON TABLE biometric_credentials IS 'Stores WebAuthn/biometric credentials for passwordless authentication';

-- Grant appropriate permissions (adjust based on your database user setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON otp_verifications TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON auth_sessions TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON biometric_credentials TO your_app_user;