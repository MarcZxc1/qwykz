# syntax=docker/dockerfile:1
FROM rust:1.88-slim-bookworm AS builder

WORKDIR /usr/src/app
COPY Cargo.toml ./
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    mkdir -p src && \
    printf 'fn main() {}\n' > src/main.rs && \
    cargo fetch

COPY migrations ./migrations
COPY src ./src
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/src/app/target \
    cargo build --release && \
    install -D -m 0755 target/release/qwykz-rust-template /out/qwykz-api && \
    strip /out/qwykz-api

FROM debian:bookworm-slim
WORKDIR /app
COPY --from=builder --chown=10001:10001 /out/qwykz-api ./qwykz-api

USER 10001:10001
EXPOSE 8080

CMD ["./qwykz-api"]
