FROM rust:1.75-slim AS builder

WORKDIR /usr/src/app
COPY . .

RUN cargo build --release

FROM debian:bookworm-slim
WORKDIR /app
COPY --from=builder /usr/src/app/target/release/qwykz-rust-template /app/main

EXPOSE 8080

CMD ["./main"]
