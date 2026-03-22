use clap::Parser;

#[derive(Parser)]
pub struct Args {
    /// Set which port to use (default: random)
    #[arg(long)]
    pub port: Option<u16>,
    /// Open the URL in a browser after starting the server (default: true)
    #[arg(long)]
    pub open: Option<bool>,
    /// Path to sqlite3 database file
    #[arg(long)]
    pub db: Option<String>,
    /// Key used to encrypt the database
    #[arg(long = "db_encryption_key", env = "CHITTER_DB_KEY")]
    pub db_encryption_key: String,
    /// Key used as database's new encryption key
    #[arg(long = "db_encryption_rekey", env = "CHITTER_DB_REKEY")]
    pub db_encryption_rekey: Option<String>,
}
