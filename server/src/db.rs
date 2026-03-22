use sqlx::{Pool, Sqlite, SqlitePool, migrate::Migrator, sqlite::SqliteConnectOptions};

pub static MIGRATOR: Migrator = sqlx::migrate!();

pub const DATABASE_URL_ENV_VAR: &str = "DATABASE_URL";
pub const DEFAULT_DB_FILENAME: &str = "chitter.sqlite3";

pub async fn connect_to_db(db_options: DbOptions, default_db_path: String) -> Pool<Sqlite> {
    let mut pool_options = SqliteConnectOptions::new()
        .filename(db_options.path.unwrap_or(default_db_path))
        .create_if_missing(true);

    if let DbEncryption::Encrypted(encryption_key, _) = &db_options.encryption {
        let encryption_key = format!("'{}'", encryption_key.replace("'", "''"));

        pool_options = pool_options.pragma("key", encryption_key);
    }

    if let DbEncryption::Encrypted(_, Some(encryption_rekey)) = &db_options.encryption {
        let encryption_rekey = format!("'{}'", encryption_rekey.replace("'", "''"));

        pool_options = pool_options.pragma("rekey", encryption_rekey);
    }

    let pool = SqlitePool::connect_with(pool_options)
        .await
        .expect("should connect to db");

    let _ = MIGRATOR.run(&pool).await;

    pool
}

pub struct DbOptions {
    pub path: Option<String>,
    pub encryption: DbEncryption,
}

#[derive(Debug)]
pub enum DbEncryption {
    Unencrypted,
    Encrypted(String, Option<String>),
}
