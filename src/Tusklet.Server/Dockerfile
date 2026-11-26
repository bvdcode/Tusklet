FROM --platform=$BUILDPLATFORM node:26-bookworm-slim AS node

FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:11.0 AS build
WORKDIR /src

RUN apt-get update \
    && apt-get install -y --no-install-recommends libatomic1 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules/npm/ /usr/local/lib/node_modules/npm/
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm

COPY .editorconfig Directory.Build.props ./
COPY Tusklet.Server/Tusklet.Server.csproj Tusklet.Server/
COPY tusklet.client/tusklet.client.esproj tusklet.client/package.json tusklet.client/
RUN dotnet restore Tusklet.Server/Tusklet.Server.csproj

COPY Tusklet.Server/ Tusklet.Server/
COPY tusklet.client/ tusklet.client/
ARG BUILD_VERSION=0.0.0-dev
RUN dotnet publish Tusklet.Server/Tusklet.Server.csproj -c Release -o /app/publish --no-restore /p:UseAppHost=false /p:Version="$BUILD_VERSION"

FROM mcr.microsoft.com/dotnet/aspnet:11.0 AS final
WORKDIR /app
LABEL org.opencontainers.image.title="Tusklet" \
      org.opencontainers.image.licenses="MIT"
EXPOSE 8080
ENV ASPNETCORE_HTTP_PORTS=8080
ENV Tusklet__SetupCodeFile=/tmp/tusklet/setup-code
COPY --from=build /app/publish/ ./
USER $APP_UID
ENTRYPOINT ["dotnet", "Tusklet.Server.dll"]
