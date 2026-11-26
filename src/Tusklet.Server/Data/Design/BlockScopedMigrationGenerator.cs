// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations.Design;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using System.Text;

namespace Tusklet.Server.Data.Design
{
    internal class BlockScopedMigrationGenerator(
        MigrationsCodeGeneratorDependencies dependencies,
        CSharpMigrationsGeneratorDependencies csharpDependencies)
        : CSharpMigrationsGenerator(dependencies, csharpDependencies)
    {
        public override string GenerateMigration(string? migrationNamespace, string migrationName,
            IReadOnlyList<MigrationOperation> upOperations, IReadOnlyList<MigrationOperation> downOperations)
        {
            return BlockScope(base.GenerateMigration(migrationNamespace, migrationName, upOperations, downOperations));
        }

        public override string GenerateMetadata(string? migrationNamespace, Type contextType, string migrationName,
            string migrationId, IModel targetModel)
        {
            return BlockScope(base.GenerateMetadata(migrationNamespace, contextType, migrationName, migrationId, targetModel));
        }

        public override string GenerateSnapshot(string? modelSnapshotNamespace, Type contextType, string modelSnapshotName,
            IModel model, string? migrationId)
        {
            return BlockScope(base.GenerateSnapshot(modelSnapshotNamespace, contextType, modelSnapshotName, model, migrationId));
        }

        private static string BlockScope(string source)
        {
            int namespaceStart = source.IndexOf("\nnamespace ", StringComparison.Ordinal);
            if (namespaceStart < 0)
            {
                return source;
            }
            int namespaceEnd = source.IndexOf(';', namespaceStart);
            int lineEnd = source.IndexOf('\n', namespaceStart + 1);
            if (namespaceEnd < 0 || namespaceEnd > lineEnd)
            {
                return source;
            }
            StringBuilder code = new(source[..namespaceEnd]);
            code.Append('\n').Append("{\n");
            using StringReader body = new(source[(namespaceEnd + 1)..].Trim('\r', '\n'));
            while (body.ReadLine() is string line)
            {
                if (line.Length > 0)
                {
                    code.Append("    ");
                }
                code.Append(line).Append('\n');
            }
            code.Append("}\n");
            return code.ToString();
        }
    }
}
