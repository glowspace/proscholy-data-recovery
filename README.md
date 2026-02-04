# Zpevnik recovery (import of mobile data into an old database backup)

## Setup and running

It is required to install [Bun](https://bun.com/). After that, install the dependencies:

```bash
bun install
```

In order to work with the MySQL database, you need to have Docker (Compose) installed, too.

## Project structure

`/database_backup_data`: Old backups, gzipped. The `proscholy_2022_migrated.sql.gz` file is the old backup with applied migrations from the Laravel project.

`/database_docker`:

- Running `docker compose up -d` inside this folder spawns a MySQL container.
- Running `bun import.ts` imports the `_migrated` file into the running container.
- You can examine the data via `adminer` (at localhost:8080), with credentials stored in the `.env` file.

`/database_repository`: Contains interfaces and methods for convenient and type-safe work with the database.

`/query`: Queries for observing the state of the data (especially mobile_data). The `lost_files.ts` file is reproducible with downloading the `zps_public_files` backup (~4GB). There is a `lost_files.csv` file as the result of the script execution.

`/import`: Numbered stages of importing the data. See also `import/status.md`.
