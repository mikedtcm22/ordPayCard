FROM rust:1.81-bullseye as builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    git pkg-config libssl-dev build-essential ca-certificates wget && \
    rm -rf /var/lib/apt/lists/*

# Use nightly to satisfy crates requiring edition2024 features
RUN rustup toolchain install nightly && rustup default nightly

WORKDIR /src
RUN git clone https://github.com/ordinals/ord.git
WORKDIR /src/ord
# Use a known-good release tag compatible with Bitcoin Core 28.1
RUN git fetch --tags && git checkout v0.15.0
RUN cargo build --release

FROM debian:bullseye-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates wget && rm -rf /var/lib/apt/lists/*
COPY --from=builder /src/ord/target/release/ord /usr/local/bin/ord

EXPOSE 8080
WORKDIR /workspace
ENTRYPOINT ["ord"]
