// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using Microsoft.AspNetCore.Http.Connections;
using Microsoft.Extensions.Primitives;
using Tusklet.Server.Realtime;

namespace Tusklet.Server.Extensions
{
    internal static class TaskRealtimeRegistration
    {
        public static void AddTaskRealtime(this IServiceCollection services)
        {
            services.AddHttpContextAccessor();
            services.AddSignalR();
            services.AddSingleton<TaskWorkspacePublisher>();
        }

        public static void MapTaskRealtime(this WebApplication app)
        {
            app.UseWhen(context => context.Request.Path.StartsWithSegments(TaskWorkspaceHub.Path), branch =>
                branch.Use(async (context, next) =>
                {
                    if (!IsAllowedOrigin(context.Request))
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        return;
                    }
                    await next(context);
                }));
            app.MapHub<TaskWorkspaceHub>(TaskWorkspaceHub.Path, options =>
            {
                options.Transports = HttpTransportType.WebSockets;
                options.CloseOnAuthenticationExpiration = true;
            });
        }

        private static bool IsAllowedOrigin(HttpRequest request)
        {
            if (!request.Headers.TryGetValue("Origin", out StringValues origins))
            {
                return true;
            }
            return origins.Count == 1
                && Uri.TryCreate(origins[0], UriKind.Absolute, out Uri? origin)
                && origin.Scheme is "http" or "https"
                && string.Equals(HostString.FromUriComponent(origin).Host, request.Host.Host, StringComparison.OrdinalIgnoreCase)
                && (request.Host.Port is int port ? origin.Port == port : origin.IsDefaultPort)
                && (origin.Scheme == request.Scheme || (origin.Scheme == "https" && request.Scheme == "http"));
        }
    }
}
