# syntax=docker/dockerfile:1
FROM golang:1.21-alpine AS builder

WORKDIR /src

COPY go.mod ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download

COPY cmd ./cmd
COPY internal ./internal
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go mod tidy && \
    CGO_ENABLED=0 GOOS=linux go build \
      -trimpath \
      -ldflags="-s -w" \
      -o /out/qwykz-api ./cmd/api

FROM alpine:latest
RUN addgroup -S app && adduser -S -G app -u 10001 app
WORKDIR /app
COPY --from=builder --chown=10001:10001 /out/qwykz-api ./qwykz-api

USER 10001:10001
EXPOSE 3000

CMD ["./qwykz-api"]
