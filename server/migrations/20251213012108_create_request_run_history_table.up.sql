CREATE TABLE RequestRunHistory (
    id INTEGER PRIMARY KEY,
    uuid TEXT NOT NULL,

    -- REQUEST FILE
    request_file_path TEXT NOT NULL,
    request_file_content TEXT NOT NULL,
    request_file_hash TEXT NOT NULL,

    -- PARAMS
    params_from_client_json TEXT NOT NULL,

    -- RESPONSE
    response TEXT NOT NULL,

    -- TEST RESULT
    pass INTEGER NOT NULL,
    diff TEXT NULL,

    -- TIMINGS
    request_at TIMESTAMP NOT NULL,
    response_at TIMESTAMP NOT NULL
);
