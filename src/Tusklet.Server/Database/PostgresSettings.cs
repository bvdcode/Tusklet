// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using Npgsql;

namespace Tusklet.Server.Database
{
    internal static class PostgresSettings
    {
        public static string ReadConnectionString(IConfiguration configuration)
        {
            NpgsqlConnectionStringBuilder connection = new()
            {
                Host = GetRequiredValue(configuration, "TUSKLET_PG_HOST"),
                Port = configuration.GetValue("TUSKLET_PG_PORT", 5432),
                Database = GetRequiredValue(configuration, "TUSKLET_PG_DATABASE"),
                Username = GetRequiredValue(configuration, "TUSKLET_PG_USERNAME"),
                Password = configuration["TUSKLET_PG_PASSWORD"],
            };
            return connection.ConnectionString;
        }

        private static string GetRequiredValue(IConfiguration configuration, string name)
        {
            string? value = configuration[name];
            return string.IsNullOrWhiteSpace(value)
                ? throw new InvalidOperationException($"Set {name} to connect to PostgreSQL.")
                : value;
        }
    }
}
