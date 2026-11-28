// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using Tusklet.Server.Extensions;
using Tusklet.Server.Services;

namespace Tusklet.Server
{
    public class Program
    {
        public static Task Main(string[] args)
        {
            WebApplicationBuilder builder = WebApplication.CreateBuilder(args);
            builder.Services.AddControllersWithViews();
            builder.Services.AddHealthChecks();
            builder.Services.AddMediator();
            builder.Services.AddAccounts();
            builder.Services.AddSingleton<CounterState>();

            WebApplication app = builder.Build();
            app.UseDefaultFiles();
            app.UseStaticFiles();
            app.UseRouting();
            app.UseRateLimiter();
            app.UseAuthentication();
            app.UseAuthorization();
            app.MapControllers();
            app.MapHealthChecks("/health");
            app.MapFallbackToFile("/tasks", "index.html");
            app.MapFallbackToFile("/tasks/{taskId:guid}", "index.html");
            app.MapFallbackToFile("/profile", "index.html");
            app.MapFallbackToFile("/admin", "index.html");

            return app.RunAsync();
        }
    }
}
