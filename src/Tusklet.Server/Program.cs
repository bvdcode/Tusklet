// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using Tusklet.Server.Features.Counter;

namespace Tusklet.Server
{
    public class Program
    {
        public static Task Main(string[] args)
        {
            WebApplicationBuilder builder = WebApplication.CreateBuilder(args);
            builder.Services.AddControllers();
            builder.Services.AddHealthChecks();
            builder.Services.AddMediator();
            builder.Services.AddSingleton<CounterState>();

            WebApplication app = builder.Build();
            app.UseDefaultFiles();
            app.UseStaticFiles();
            app.MapControllers();
            app.MapHealthChecks("/health");

            return app.RunAsync();
        }
    }
}
