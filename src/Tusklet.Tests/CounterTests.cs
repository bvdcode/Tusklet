// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using NUnit.Framework;
using System.Net;
using System.Net.Http.Json;
using Tusklet.Server.Features.Counter;

namespace Tusklet.Tests
{
    public class CounterTests
    {
        private const string CounterUrl = "/api/counter";

        [Test]
        public async Task Counter_IsSharedAcrossClients()
        {
            await using TuskletFactory factory = new();
            using HttpClient firstClient = factory.CreateClient();
            using HttpClient secondClient = factory.CreateClient();

            Assert.That(await firstClient.GetFromJsonAsync<CounterResponse>(CounterUrl), Is.EqualTo(new CounterResponse(0)));
            Assert.That(await IncrementAsync(firstClient), Is.EqualTo(1));
            Assert.That(await IncrementAsync(secondClient), Is.EqualTo(2));
            Assert.That(await firstClient.GetFromJsonAsync<CounterResponse>(CounterUrl), Is.EqualTo(new CounterResponse(2)));
        }

        [Test]
        public async Task Counter_PreservesConcurrentIncrements()
        {
            const int increments = 20;

            await using TuskletFactory factory = new();
            using HttpClient client = factory.CreateClient();

            long[] counts = await Task.WhenAll(Enumerable.Range(0, increments).Select(_ => IncrementAsync(client)));

            Assert.That(counts, Is.EquivalentTo(Enumerable.Range(1, increments).Select(count => (long)count)));
            Assert.That(await client.GetFromJsonAsync<CounterResponse>(CounterUrl), Is.EqualTo(new CounterResponse(increments)));
        }

        [Test]
        public async Task MissingApiRoute_ReturnsNotFound()
        {
            await using TuskletFactory factory = new();
            using HttpClient client = factory.CreateClient();
            using HttpResponseMessage response = await client.GetAsync("/api/missing");

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
        }

        private static async Task<long> IncrementAsync(HttpClient client)
        {
            using HttpResponseMessage response = await client.PostAsync(CounterUrl, content: null);
            response.EnsureSuccessStatusCode();
            CounterResponse? counter = await response.Content.ReadFromJsonAsync<CounterResponse>();
            return (counter ?? throw new InvalidOperationException("Missing counter response.")).Count;
        }
    }
}
