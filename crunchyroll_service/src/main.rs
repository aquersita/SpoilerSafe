use axum::{
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use crunchyroll_rs::{Crunchyroll};
use crunchyroll_rs::crunchyroll::DeviceIdentifier;

#[tokio::main]
async fn main() {
    // Inicializar rutas
    let app = Router::new()
        .route("/", get(root))
        .route("/sync", post(sync_crunchyroll));

    // Definir dirección y puerto
    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    println!("listening on {}", addr);
    
    // Arrancar servidor
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn root() -> &'static str {
    "Crunchyroll Microservice is running (with crunchyroll-rs)!"
}

#[derive(Deserialize)]
struct SyncRequest {
    email: String,
    password: String,
}

#[derive(Serialize)]
struct Episode {
    series_title: String,
    episode_number: u32,
    watched_at: String,
}

#[derive(Serialize)]
struct SyncResponse {
    status: String,
    message: String,
    history: Vec<Episode>,
}

async fn sync_crunchyroll(Json(payload): Json<SyncRequest>) -> Json<SyncResponse> {
    println!("Received sync request for email: {}", payload.email);

    // Intentar login real con crunchyroll-rs
    // Usamos el identificador de dispositivo por defecto (Chrome en Windows usualmente)
    let result = Crunchyroll::builder()
        .login_with_credentials(payload.email.clone(), payload.password.clone(), DeviceIdentifier::default())
        .await;

    match result {
        Ok(cr) => {
             // Si el login funciona, devolvemos éxito (por ahora sin historial real complejo)
             println!("Login success for {}", payload.email);
             
             Json(SyncResponse {
                status: "success".to_string(),
                message: "Login successful via crunchyroll-rs!".to_string(),
                history: vec![], // TODO: Fetch real history
            })
        }
        Err(e) => {
            println!("Login failed: {}", e);
             Json(SyncResponse {
                status: "error".to_string(),
                message: format!("Login failed: {}", e),
                history: vec![],
            })
        }
    }
}
