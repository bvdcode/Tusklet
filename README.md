# Tusklet

Tusklet is a self-hosted task manager in early development. The current preview includes a React page with a shared counter backed by an ASP.NET Core 11 API. The counter resets when the server restarts.

[![CI](https://github.com/bvdcode/Tusklet/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/bvdcode/Tusklet/actions/workflows/ci.yml)
[![Release](https://badgen.net/github/release/bvdcode/Tusklet)](https://github.com/bvdcode/Tusklet/releases/latest)
[![Docker Hub](https://badgen.net/docker/pulls/bvdcode/tusklet?icon=docker&label=Docker%20Hub)](https://hub.docker.com/r/bvdcode/tusklet)
[![MIT License](https://badgen.net/github/license/bvdcode/Tusklet)](LICENSE)

## Run with Docker

The image serves the client and API together. Release images for Linux AMD64 and ARM64 are available on [Docker Hub](https://hub.docker.com/r/bvdcode/tusklet) and [GitHub Container Registry](https://github.com/bvdcode/Tusklet/pkgs/container/tusklet).

```sh
docker run --rm -p 127.0.0.1:8080:8080 bvdcode/tusklet:latest
```

Open [localhost:8080](http://localhost:8080) and click **Increment**. To build the image from a checkout, run these commands from the repository root.

```sh
docker build -f src/Tusklet.Server/Dockerfile -t tusklet:local src
docker run --rm -p 127.0.0.1:8080:8080 tusklet:local
```

## Develop

Install the .NET 11 SDK and Node.js 26.

| Path | Contents |
| --- | --- |
| `src/Tusklet.slnx` | Solution containing all three projects |
| `src/Tusklet.Server` | ASP.NET Core API and static hosting |
| `src/tusklet.client` | React, TypeScript, and Vite client |
| `src/Tusklet.Tests` | API integration tests |

Start the API from the repository root.

```sh
dotnet run --project src/Tusklet.Server
```

In a second terminal, start Vite and open [localhost:5173](http://localhost:5173).

```sh
cd src/tusklet.client
npm ci
npm run dev
```

Run `dotnet test src/Tusklet.slnx -c Release` from the repository root. Run `npm run lint`, `npm test`, and `npm run build` from `src/tusklet.client`. Use `dotnet publish src/Tusklet.Server -c Release` to publish the API and client together.

## API

- `GET /api/counter` reads the current count.
- `POST /api/counter` increments the count and returns the new value.
- `GET /health` checks server health.

## Support

[Support Tusklet on Ko-fi](https://ko-fi.com/bvdcode).

## License

[MIT](LICENSE)
