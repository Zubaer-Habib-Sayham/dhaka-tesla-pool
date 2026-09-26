INSERT INTO users (name, email, password_hash, role)
VALUES
    ('Jashim', 'jashim@dhakateslapool.test', 'SEED_PASSWORD', 'DRIVER'),
    ('Nusrat', 'nusrat@dhakateslapool.test', 'SEED_PASSWORD', 'PASSENGER'),
    ('Rafiq', 'rafiq@dhakateslapool.test', 'SEED_PASSWORD', 'PASSENGER'),
    ('Shirin', 'shirin@dhakateslapool.test', 'SEED_PASSWORD', 'PASSENGER');
ON CONFLICT (email) DO NOTHING;

INSERT INTO teslas (driver_id, name, capacity, status)
SELECT id, 'Bullet', 3, 'OFFLINE'
FROM users
WHERE email = 'jashim@dhakateslapool.test'
  AND NOT EXISTS (
      SELECT 1
      FROM teslas
      WHERE driver_id = users.id
  );

INSERT INTO zones (name, latitude, longitude)
VALUES
    ('Banani', 23.7937, 90.4066),
    ('Gulshan 1', 23.7806, 90.4169),
    ('Mohakhali', 23.7772, 90.3996),
    ('Dhanmondi', 23.7461, 90.3742),
    ('Mirpur', 23.8223, 90.3654),
    ('Uttara', 23.8759, 90.3795),
    ('Farmgate', 23.7577, 90.3897),
    ('Bashundhara', 23.8151, 90.4255)
ON CONFLICT (name) DO NOTHING;