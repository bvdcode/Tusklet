// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using Microsoft.AspNetCore.Mvc.Testing;
using NUnit.Framework;
using System.Net;
using Tusklet.Server;

namespace Tusklet.Tests
{
    public class HealthTests
    {
        [Test]
        public async Task HealthEndpoint_ReturnsHealthy()
        {
            await using WebApplicationFactory<Program> factory = new();
            using HttpClient client = factory.CreateClient();
            using HttpResponseMessage response = await client.GetAsync("/health");

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            Assert.That(await response.Content.ReadAsStringAsync(), Is.EqualTo("Healthy"));
        }
    }
}
