// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using System.Globalization;
using Tusklet.Server;
using Tusklet.Server.Database;

namespace Tusklet.Tests
{
    internal class TuskletFactory(TestOpenIdProvider? backchannel = null) : WebApplicationFactory<Program>
    {
        private readonly NpgsqlConnectionStringBuilder _connection = TestConnection();

        public HttpClient CreateBrowser(WebApplicationFactory<Program>? instance = null)
        {
            return (instance ?? this).CreateClient(new WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri("https://tusklet.test"),
                AllowAutoRedirect = false,
            });
        }

        public WebApplicationFactory<Program> ReplaceContainer()
        {
            return WithWebHostBuilder(builder => builder.UseEnvironment("Production"));
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureAppConfiguration(configuration =>
            {
                configuration.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["TUSKLET_PG_HOST"] = _connection.Host,
                    ["TUSKLET_PG_PORT"] = _connection.Port.ToString(CultureInfo.InvariantCulture),
                    ["TUSKLET_PG_DATABASE"] = _connection.Database,
                    ["TUSKLET_PG_USERNAME"] = _connection.Username,
                    ["TUSKLET_PG_PASSWORD"] = _connection.Password,
                });
            });
            if (backchannel is not null)
            {
                builder.ConfigureTestServices(services => services.Configure<OpenIdConnectOptions>(
                    OpenIdConnectDefaults.AuthenticationScheme, options =>
                    {
                        options.BackchannelHttpHandler = backchannel;
                        Func<RemoteFailureContext, Task> handleFailure = options.Events.OnRemoteFailure;
                        options.Events.OnRemoteFailure = context =>
                        {
                            backchannel.CallbackFailure = context.Failure;
                            return handleFailure(context);
                        };
                    }));
            }
        }

        public override async ValueTask DisposeAsync()
        {
            await base.DisposeAsync();
            DbContextOptions<TuskletDbContext> options = new DbContextOptionsBuilder<TuskletDbContext>()
                .UseNpgsql(_connection.ConnectionString).Options;
            await using TuskletDbContext db = new(options);
            await db.Database.EnsureDeletedAsync();
        }

        private static NpgsqlConnectionStringBuilder TestConnection()
        {
            string connection = Environment.GetEnvironmentVariable("TUSKLET_TEST_POSTGRES")
                ?? throw new InvalidOperationException("Set TUSKLET_TEST_POSTGRES to the PostgreSQL integration test server.");
            return new NpgsqlConnectionStringBuilder(connection)
            {
                Database = $"tusklet_test_{Guid.NewGuid():N}",
                Pooling = false,
            };
        }
    }
}
