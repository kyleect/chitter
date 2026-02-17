app-name := "chitter"

default:
    @just --list

# Delete build artifacts for server and client
clean:
    cd server && just clean
    cd types && just clean
    cd client && just clean

# Build the code
build:
    cd types && just build
    just build-client
    just build-server
    just build-app

# Build the server
[private]
build-server:
    cd server && just build

# Build the client
[private]
build-client:
    cd client && just build

# Build the app
[private]
build-app:
    cd app && just build

# Build the code for release
build-release:
    cd types && just build-release
    just build-client-release
    just build-server-release
    just build-app-release

# Build the server for release
[private]
build-server-release:
    cd server && just build-release

# Build the client for release
[private]
build-client-release:
    cd client && just build-release

# Build the server for release
[private]
build-app-release:
    cd app && just build-release

# Watch the client for changes and rebuild
[private]
watch-client:
    cd client && just watch

# Watch the server for changes and rebuild
[private]
watch-server:
    cd server && just watch

# Watch the types for changes and rebuild
[private]
watch-types:
    cd types && just watch

[unix]
install: build
    cp target/debug/chitter ~/.cargo/bin/chitter
    cp target/debug/chitter ~/.cargo/bin/chitter

[windows]
install: build
    cp target/debug/chitter.exe ~/.cargo/bin/chitter.exe
    cp target/debug/chitter.exe ~/.cargo/bin/chitter.exe

[unix]
install-release: build-release
    cp target/release/chitter ~/.cargo/bin/chitter
    cp target/release/chitter ~/.cargo/bin/chitter

[windows]
install-release: build-release
    cp target/release/chitter.exe ~/.cargo/bin/chitter.exe
    cp target/release/chitter.exe ~/.cargo/bin/chitter.exe

# Start the server and client in development mode
watch: build
    #!/usr/bin/env -S parallel --shebang --ungroup --jobs {{ num_cpus() }}
    just watch-types
    just watch-client
    just watch-server

[private]
run-server-dev port:
    cargo run -F development_mode --bin server -- --port {{ port }} --open false

# Check linters against code
lint:
    cd server && just lint
    cd client && just lint

# Automatically fix linting errors in code
lint-fix:
    cd server && just lint-fix
    cd client && just lint-fix

# Format code
format:
    cd server && just format
    cd client && just format

# Check that the code is formatted correctly
format-check:
    cd server && just format-check
    cd client && just format-check

# Run all non-test checks against code
check:
    cd types && just build
    cd server && just check
    cd client && just check

# Run all checks, tests, and build the code
verify:
    cd types && just build
    cd server && just verify
    cd client && just verify

# Run all tests
test:
    cd types && just build
    cd server && just test
    cd client && just test

# Remove local branches that have been merged upstream
clean-git-branches:
    git branch -d $(git branch --merged=main | grep -v main) && git fetch --prune

# Build the code for release
build-for-e2e-release:
    cd types && just build-release
    just build-client-release
    just build-server-for-e2e-release

# Build the server for release
[private]
build-server-for-e2e-release:
    cd server && just build-for-e2e-release

e2e-with-build: build-for-e2e-release
    cd e2e && just test

e2e:
    cd e2e && just test

e2e-ui-mode:
    cd e2e && just test-ui-mode

e2e-report:
    cd e2e && npm run report

db *args:
    cargo sqlx {{ args }} --database-url sqlite://db.sqlite3

db-revert:
    cargo sqlx migrate revert --database-url sqlite://db.sqlite3 --source ./server/migrations

db-create:
    cargo sqlx database create --database-url sqlite://db.sqlite3

db-drop:
    cargo sqlx database drop --database-url sqlite://db.sqlite3

db-create-migration name:
    cargo sqlx migrate add -r {{ name }} --source ./server/migrations

db-run-migrations:
    cargo sqlx migrate run --source ./server/migrations --database-url sqlite://db.sqlite3

db-prepare:
    cd server && cargo sqlx prepare --database-url sqlite://db.sqlite3
