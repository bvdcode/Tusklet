// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using Microsoft.AspNetCore.WebUtilities;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using NUnit.Framework;
using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;

namespace Tusklet.Tests
{
    internal class TestOpenIdProvider : HttpMessageHandler
    {
        public const string Issuer = "https://identity.test";
        public const string ClientId = "tusklet";
        public const string ClientSecret = "test-client-secret";

        private readonly RSA _rsa = RSA.Create(2048);
        private readonly JsonWebTokenHandler _tokens = new();
        private string? _nonce;
        private string? _challenge;
        private string? _code;
        private string _subject = "subject-123";
        private string? _pictureUrl;

        public Exception? CallbackFailure { get; set; }

        public string Authorize(Uri redirect, string callback, string subject = "subject-123", string? pictureUrl = null)
        {
            Dictionary<string, Microsoft.Extensions.Primitives.StringValues> query = QueryHelpers.ParseQuery(redirect.Query);
            Assert.That(redirect.GetLeftPart(UriPartial.Path), Is.EqualTo($"{Issuer}/authorize"));
            Assert.That(query["redirect_uri"].ToString(), Is.EqualTo(callback));
            Assert.That(query["code_challenge_method"].ToString(), Is.EqualTo("S256"));
            Assert.That(query["scope"].ToString().Split(' '), Does.Contain("profile"));
            _nonce = query["nonce"];
            _challenge = query["code_challenge"];
            _subject = subject;
            _pictureUrl = pictureUrl;
            _code = Guid.NewGuid().ToString("N");
            return QueryHelpers.AddQueryString(callback, new Dictionary<string, string?>
            {
                ["code"] = _code,
                ["state"] = query["state"],
            });
        }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            switch (request.RequestUri?.AbsolutePath)
            {
                case "/.well-known/openid-configuration":
                    return Json(new
                    {
                        issuer = Issuer,
                        authorization_endpoint = $"{Issuer}/authorize",
                        token_endpoint = $"{Issuer}/token",
                        jwks_uri = $"{Issuer}/keys",
                        id_token_signing_alg_values_supported = new[] { "RS256" },
                        code_challenge_methods_supported = new[] { "S256" },
                    });
                case "/keys":
                    RSAParameters key = _rsa.ExportParameters(false);
                    return Json(new
                    {
                        keys = new[] { new
                        {
                            kty = "RSA",
                            kid = "test-key",
                            alg = "RS256",
                            use = "sig",
                            n = Base64UrlEncoder.Encode(key.Modulus!),
                            e = Base64UrlEncoder.Encode(key.Exponent!),
                        } },
                    });
                case "/token":
                    return await ExchangeAsync(request, ct);
                default:
                    return new HttpResponseMessage(HttpStatusCode.NotFound);
            }
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                _rsa.Dispose();
            }
            base.Dispose(disposing);
        }

        private async Task<HttpResponseMessage> ExchangeAsync(HttpRequestMessage request, CancellationToken ct)
        {
            string body = await request.Content!.ReadAsStringAsync(ct);
            Dictionary<string, Microsoft.Extensions.Primitives.StringValues> input = QueryHelpers.ParseQuery(body);
            string verifier = input["code_verifier"].ToString();
            string challenge = Base64UrlEncoder.Encode(SHA256.HashData(System.Text.Encoding.ASCII.GetBytes(verifier)));
            if (input["code"].ToString() != _code || input["client_id"].ToString() != ClientId
                || input["client_secret"].ToString() != ClientSecret || challenge != _challenge || _nonce is null)
            {
                return new HttpResponseMessage(HttpStatusCode.BadRequest);
            }

            _code = null;
            Dictionary<string, object> claims = new() { ["sub"] = _subject, ["nonce"] = _nonce };
            if (_pictureUrl is not null)
            {
                claims["picture"] = _pictureUrl;
            }
            string token = _tokens.CreateToken(new SecurityTokenDescriptor
            {
                Issuer = Issuer,
                Audience = ClientId,
                Claims = claims,
                SigningCredentials = new SigningCredentials(
                    new RsaSecurityKey(_rsa) { KeyId = "test-key" }, SecurityAlgorithms.RsaSha256),
            });
            return Json(new { id_token = token, access_token = "test-access", token_type = "Bearer" });
        }

        private static HttpResponseMessage Json(object body)
        {
            return new HttpResponseMessage(HttpStatusCode.OK) { Content = JsonContent.Create(body) };
        }
    }
}
