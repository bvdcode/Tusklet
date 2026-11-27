using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tusklet.Server.Migrations
{
    /// <inheritdoc />
    public partial class _20261127072701_AddOpenIdPicture : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "picture_url",
                table: "external_identities",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "picture_url",
                table: "external_identities");
        }
    }
}
