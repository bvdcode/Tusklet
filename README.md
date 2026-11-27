# Tusklet

Tusklet is a self-hosted task manager in early development. The current preview supports creating and completing tasks, import from Microsoft To Do backups, and password and OpenID Connect sign-in. A single ASP.NET Core 11 process hosts the API and React client.

[![CI](https://github.com/bvdcode/Tusklet/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/bvdcode/Tusklet/actions/workflows/ci.yml)
[![Release](https://badgen.net/github/release/bvdcode/Tusklet)](https://github.com/bvdcode/Tusklet/releases/latest)
[![Docker Hub](https://badgen.net/docker/pulls/bvdcode/tusklet?icon=docker&label=Docker%20Hub)](https://hub.docker.com/r/bvdcode/tusklet)
[![MIT License](https://badgen.net/github/license/bvdcode/Tusklet)](LICENSE)

## Run with Docker

The image serves the client and API together. Release images for Linux AMD64 and ARM64 are available on [Docker Hub](https://hub.docker.com/r/bvdcode/tusklet) and [GitHub Container Registry](https://github.com/bvdcode/Tusklet/pkgs/container/tusklet).

Create a UTF-8 PostgreSQL database and a dedicated login with permission to manage its schema. Set the PostgreSQL environment variables for the container. Tusklet applies its EF Core migrations at startup.

```sh
export TUSKLET_PG_HOST='<postgres host>'
export TUSKLET_PG_PORT=5432
export TUSKLET_PG_DATABASE=tusklet
export TUSKLET_PG_USERNAME=tusklet_client
export TUSKLET_PG_PASSWORD='<password>'
docker run -d --name tusklet -p 127.0.0.1:8080:8080 \
  -e TUSKLET_PG_HOST -e TUSKLET_PG_PORT -e TUSKLET_PG_DATABASE \
  -e TUSKLET_PG_USERNAME -e TUSKLET_PG_PASSWORD bvdcode/tusklet:latest
```

`TUSKLET_PG_PORT` defaults to `5432`. Open [localhost:8080](http://localhost:8080) and choose a username and password. The first account created on an empty database becomes the administrator.

PostgreSQL stores accounts, OpenID settings, and the keys that protect sessions and the OpenID client secret. Use HTTPS when publishing the application behind a reverse proxy.

Install Tusklet from the browser’s app menu when served over HTTPS. The installed app connects to your server for sign-in and tasks. When an update is ready, Tusklet lets you choose when to reload.

## OpenID Connect

Configure one OpenID Connect provider per Tusklet instance.

1. Sign in as the administrator. Open the account menu and choose **Administration**. Copy the callback URL under **OpenID Connect**.
2. In Pocket ID or another OpenID Connect provider, create a confidential client. Enter that callback URL and enable authorization code flow with PKCE.
3. In Tusklet, enter the provider's HTTPS issuer URL, client ID, and client secret. Enable OpenID sign-in and save.
4. Choose **Profile settings** from the account menu, select **Link OpenID account**, and sign in with the provider. The next time you sign in to Tusklet you can choose **Sign in with OpenID**.

The local password remains available for administration. OpenID sign-in is limited to accounts linked from a signed-in profile.

## Import from Microsoft To Do

In **Profile settings**, choose a Microsoft To Do backup ZIP. The supported format is `microsoft-todo-export` version 1, with `tasks.json` and its referenced attachment files. Review the counts and choose **Import tasks** or **Restore details**. Repeat imports fill missing imported details on existing tasks and preserve edits in Tusklet.

The import stores text notes, dates, priorities, task statuses, checklist steps, attachments, linked resources, recurrence rules and reminder settings. Imported schedules and links are available in task details. Shared lists become personal copies. The preview identifies tasks with unsupported details.

## Interface language

Choose a language in **Profile settings**. **Auto** follows the browser’s preferred languages. The available languages are English, Russian, Spanish, French, Portuguese, Indonesian, Simplified Chinese, Hindi, Bengali, Arabic and Urdu. The selection is stored in the browser.

## Develop

Install the .NET 11 SDK and Node.js 26.

| Path | Contents |
| --- | --- |
| `src/Tusklet.slnx` | Solution containing all three projects |
| `src/Tusklet.Server` | ASP.NET Core API and static hosting |
| `src/tusklet.client` | React, TypeScript, and Vite client |
| `src/Tusklet.Tests` | API integration tests |

Point the `TUSKLET_PG_*` variables at a development PostgreSQL database and start the API from the repository root.

```sh
dotnet run --project src/Tusklet.Server
```

In a second terminal, start Vite and open [localhost:5173](http://localhost:5173).

```sh
cd src/tusklet.client
npm ci
npm run dev
```

Set `TUSKLET_TEST_POSTGRES` to a PostgreSQL server for integration tests. The test login needs permission to create isolated test databases. Run `dotnet test src/Tusklet.slnx -c Release` from the repository root. Run `npm run lint`, `npm test`, and `npm run build` from `src/tusklet.client`. Use `dotnet publish src/Tusklet.Server -c Release` to publish the API and client together.

To generate a migration, use `dotnet-ef` 11 and the `Migrations` configuration, which includes the migration code generator.

```sh
dotnet ef migrations add MigrationName --project src/Tusklet.Server \
  --configuration Migrations --output-dir Migrations
```

## Task storage

On the **Tasks** page, use **New task** to add a task to the selected list. The first task in an empty account creates an **Inbox**. The circle next to a task toggles its completion.

Each task belongs to a list owned by a user. A task stores its title, priority, position, optional due date, completion time and one plain-text note. Checklist steps carry their own order and completion time. Attachments store the file name, media type and contents in separate PostgreSQL rows, so task lists can be read without loading file contents.

## API

- `GET /api/auth/session` reads the setup status, current account and CSRF token.
- `GET /health` checks server health.
- `GET /api/counter` reads the current count.
- `POST /api/counter` increments the count and returns the new value.

## Support

[Support Tusklet on Ko-fi](https://ko-fi.com/bvdcode).

## License

[MIT](LICENSE)
