# chitter

An app to handcraft LLM conversations.

## Usage

1. [Download](https://github.com/kyleect/chitter/actions/workflows/build-artifacts.yml)
2. Unzip the `chitter` in a directory on the `PATH`
3. `cd` in to your project's root directory
4. Create a `.env` file in the project's root directory and [define an encryption key](#define-the-encryption-key).
5. Run `chitter` from a terminal

## Database Encryption

An encryption key must be defined before starting the app. This will be used to encrypt the app's database. Requests that references secrets will have secret values in the run history. Encryption helps ensure those values stay safe.

### Define The Encryption Key

Create a `.env` file at the root of your project directory, where `chitter` will be ran, then define the `CHIITER_DB_KEY` environment variable.

```shell
CHIITER_DB_KEY=strongPassword1!
```

Be sure to also add `.env` to your source control ignore list (e.g. `.gitignore`). You don't want to commit this file.

### Changing The Encryption Key

The `CHIITER_DB_REKEY` environment variable is used when you'd like to change the database's encryption key. The `CHIITER_DB_REKEY` environment variable is still required.

```shell
CHIITER_DB_KEY=strongPassword1!

CHIITER_DB_REKEY=strongPassword2@
```

## Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for details.
