// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using System.Security.Cryptography;
using System.Text;

namespace Tusklet.Server.Features.Accounts
{
    internal class SetupCode(IConfiguration configuration, IHostEnvironment environment)
    {
        private const int CodeLength = 32;
        private string? _code;

        public string FilePath { get; } = Path.GetFullPath(
            configuration["Tusklet:SetupCodeFile"] ?? "data/setup-code", environment.ContentRootPath);

        public async Task CreateAsync(CancellationToken ct)
        {
            string directory = Path.GetDirectoryName(FilePath)
                ?? throw new InvalidOperationException("Configure Tusklet:SetupCodeFile as a file path.");
            if (OperatingSystem.IsWindows())
            {
                Directory.CreateDirectory(directory);
            }
            else
            {
                Directory.CreateDirectory(directory, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);
            }
            string code = Convert.ToHexString(RandomNumberGenerator.GetBytes(CodeLength / 2));
            FileStreamOptions options = new()
            {
                Access = FileAccess.Write,
                Mode = FileMode.Create,
                Share = FileShare.None,
            };
            if (!OperatingSystem.IsWindows())
            {
                options.UnixCreateMode = UnixFileMode.UserRead | UnixFileMode.UserWrite;
            }
            await using FileStream file = new(FilePath, options);
            await file.WriteAsync(Encoding.ASCII.GetBytes(code), ct);
            Volatile.Write(ref _code, code);
        }

        public bool Matches(string supplied)
        {
            string? code = Volatile.Read(ref _code);
            return code is not null && supplied.Length == CodeLength
                && CryptographicOperations.FixedTimeEquals(
                Encoding.ASCII.GetBytes(code),
                Encoding.ASCII.GetBytes(supplied.ToUpperInvariant()));
        }

        public void Clear()
        {
            Volatile.Write(ref _code, null);
            if (File.Exists(FilePath))
            {
                File.Delete(FilePath);
            }
        }
    }
}
