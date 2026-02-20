FROM rust:latest as builder

WORKDIR /usr/src/app
COPY . .

# Compilar el proyecto
RUN cargo install --path .

FROM debian:bookworm-slim
# Instalar dependencias necesarias (OpenSSL suele ser requerida)
RUN apt-get update && apt-get install -y libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/cargo/bin/crunchyroll_service /usr/local/bin/crunchyroll_service

CMD ["crunchyroll_service"]
