use std::sync::{
    Arc,
    atomic::{AtomicBool, Ordering},
};

use clap::Parser;
use server::{Args, DbEncryption, DbOptions, InitServerOptions, init_server};
use tao::{
    event::{Event, StartCause, WindowEvent},
    event_loop::{ControlFlow, EventLoop},
    window::WindowBuilder,
};
use tokio::spawn;
use wry::WebViewBuilder;

#[tokio::main]
async fn main() -> wry::Result<()> {
    dotenv::dotenv().expect("should load dotenv");

    let args = Args::parse();

    let server_port = args.port;
    let db_path = args.db;
    let db_rekey = args.db_encryption_rekey;
    let db_encryption = DbEncryption::Encrypted(args.db_encryption_key, db_rekey);

    let server = init_server(InitServerOptions {
        port: server_port,
        open_browser: false,
        db_options: DbOptions {
            path: db_path,
            encryption: db_encryption,
        },
    })
    .await
    .expect("should have initialized app server");

    let is_waiting_for_server = Arc::new(AtomicBool::new(true));
    let url = server.url();

    let is_waiting_for_server_clone = is_waiting_for_server.clone();
    let server_handle = spawn(async move {
        server
            .start(&|| {
                is_waiting_for_server_clone.store(false, Ordering::SeqCst);
            })
            .await
            .expect("should have started server");
    });

    while is_waiting_for_server.load(Ordering::SeqCst) {}

    app_event_loop(&url);

    server_handle.await.expect("should have exited server");

    Ok(())
}

fn app_event_loop(url: &str) {
    dotenv::dotenv().ok();

    let event_loop = EventLoop::new();
    let window = WindowBuilder::new()
        .with_maximized(true)
        .with_title("Chitter")
        .build(&event_loop)
        .unwrap();
    let builder = WebViewBuilder::new().with_url(url);

    #[cfg(any(
        target_os = "windows",
        target_os = "macos",
        target_os = "ios",
        target_os = "android"
    ))]
    let webview = builder.build(&window).expect("should build webview");
    #[cfg(not(any(
        target_os = "windows",
        target_os = "macos",
        target_os = "ios",
        target_os = "android"
    )))]
    let webview = {
        use tao::platform::unix::WindowExtUnix;
        use wry::WebViewBuilderExtUnix;
        let vbox = window.default_vbox().unwrap();
        builder.build_gtk(vbox).unwrap()
    };

    event_loop.run(move |event, _, control_flow| {
        *control_flow = ControlFlow::Wait;

        match event {
            Event::NewEvents(StartCause::Init) => {
                eprintln!("Wry has started! {:?}", webview.url())
            }
            Event::WindowEvent {
                event: WindowEvent::CloseRequested,
                ..
            } => *control_flow = ControlFlow::Exit,
            _ => (),
        }
    });
}
