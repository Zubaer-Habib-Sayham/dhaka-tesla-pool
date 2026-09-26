    USERS {
        bigint id PK
        varchar name
        varchar email UK
        varchar password_hash
        varchar role
        timestamp created_at
        timestamp updated_at
    }

    TESLAS {
        bigint id PK
        bigint driver_id FK,UK
        varchar name
        integer capacity
        varchar status
        timestamp created_at
        timestamp updated_at
    }

    ZONES {
        bigint id PK
        varchar name UK
        decimal latitude
        decimal longitude
    }

    RIDES {
        bigint id PK
        bigint passenger_id FK
        bigint pickup_zone_id FK
        bigint destination_zone_id FK
        integer requested_seats
        varchar status
        integer fare_amount
        varchar payment_method
        varchar payment_status
        timestamp created_at
        timestamp updated_at
    }

    POOLS {
        bigint id PK
        bigint tesla_id FK
        varchar status
        timestamp created_at
        timestamp updated_at
    }

    POOL_MEMBERS {
        bigint id PK
        bigint pool_id FK
        bigint ride_id FK,UK
        integer seats
        timestamp joined_at
    }

    RIDE_STATUS_HISTORY {
        bigint id PK
        bigint ride_id FK
        varchar from_status
        varchar to_status
        bigint changed_by FK
        timestamp created_at
    }
