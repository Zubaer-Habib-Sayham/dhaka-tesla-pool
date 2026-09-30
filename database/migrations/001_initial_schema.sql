CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT users_role_check
        CHECK (role IN ('PASSENGER', 'DRIVER'))
);

CREATE TABLE teslas (
    id BIGSERIAL PRIMARY KEY,
    driver_id BIGINT NOT NULL UNIQUE REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT teslas_capacity_check
        CHECK (capacity > 0),

    CONSTRAINT teslas_status_check
        CHECK (status IN ('OFFLINE', 'ONLINE'))
);

CREATE TABLE zones (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL
);

CREATE TABLE rides (
    id BIGSERIAL PRIMARY KEY,
    passenger_id BIGINT NOT NULL REFERENCES users(id),
    pickup_zone_id BIGINT NOT NULL REFERENCES zones(id),
    destination_zone_id BIGINT NOT NULL REFERENCES zones(id),
    requested_seats INTEGER NOT NULL,
    share_ride BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(30) NOT NULL,
    fare_amount INTEGER NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    payment_status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT rides_requested_seats_check
        CHECK (requested_seats > 0),

    CONSTRAINT rides_fare_amount_check
        CHECK (fare_amount >= 0),

    CONSTRAINT rides_status_check
        CHECK (
            status IN (
                'REQUESTED',
                'MATCHED',
                'DRIVER_ARRIVED',
                'STARTED',
                'COMPLETED',
                'CANCELLED'
            )
        ),

    CONSTRAINT rides_payment_method_check
        CHECK (payment_method IN ('CASH', 'TESLAPAY')),

    CONSTRAINT rides_payment_status_check
        CHECK (payment_status IN ('PENDING', 'PAID'))
);

CREATE TABLE pools (
    id BIGSERIAL PRIMARY KEY,
    tesla_id BIGINT NOT NULL REFERENCES teslas(id),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pools_status_check
        CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED'))
);

CREATE TABLE pool_members (
    id BIGSERIAL PRIMARY KEY,
    pool_id BIGINT NOT NULL REFERENCES pools(id),
    ride_id BIGINT NOT NULL UNIQUE REFERENCES rides(id),
    seats INTEGER NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pool_members_seats_check
        CHECK (seats > 0)
);

CREATE TABLE ride_status_history (
    id BIGSERIAL PRIMARY KEY,
    ride_id BIGINT NOT NULL REFERENCES rides(id),
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    changed_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rides_passenger_id
    ON rides(passenger_id);

CREATE INDEX idx_rides_status
    ON rides(status);

CREATE INDEX idx_rides_pickup_zone_id
    ON rides(pickup_zone_id);

CREATE INDEX idx_rides_destination_zone_id
    ON rides(destination_zone_id);

CREATE INDEX idx_pools_tesla_id
    ON pools(tesla_id);

CREATE INDEX idx_pool_members_pool_id
    ON pool_members(pool_id);

CREATE INDEX idx_ride_status_history_ride_id
    ON ride_status_history(ride_id);

CREATE UNIQUE INDEX one_active_ride_per_passenger
ON rides (passenger_id)
WHERE status IN (
    'REQUESTED',
    'MATCHED',
    'DRIVER_ARRIVED',
    'STARTED'
);

CREATE UNIQUE INDEX one_active_pool_per_tesla
ON pools (tesla_id)
WHERE status = 'ACTIVE';