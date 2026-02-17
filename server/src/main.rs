use clap::Parser;
use server::{Args, DbEncryption, DbOptions, Error, InitServerOptions, init_server};

#[tokio::main]
async fn main() -> Result<(), Error> {
    dotenv::dotenv().expect("should load dotenv");

    let args = Args::parse();

    let server_port = args.port;
    let db_path = args.db;
    let db_rekey = args.db_encryption_rekey;
    let db_encryption = DbEncryption::Encrypted(args.db_encryption_key, db_rekey);

    let open_browser_on_start = args.open.unwrap_or(true);

    let server = init_server(InitServerOptions {
        port: server_port,
        open_browser: open_browser_on_start,
        db_options: DbOptions {
            path: db_path,
            encryption: db_encryption,
        },
    })
    .await;

    match server {
        Ok(server) => server.start(&|| {}).await,
        Err(err) => {
            panic!("Failed to start server: {err}");
        }
    }
}
