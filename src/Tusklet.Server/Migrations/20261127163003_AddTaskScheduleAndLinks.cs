using System;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tusklet.Server.Migrations
{
    /// <inheritdoc />
    public partial class _20261127163003_AddTaskScheduleAndLinks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "progress",
                table: "task_items",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<JsonElement>(
                name: "recurrence",
                table: "task_items",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "reminder_at",
                table: "task_items",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "reminder_enabled",
                table: "task_items",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "reminder_time_zone",
                table: "task_items",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "start_time_zone",
                table: "task_items",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "starts_at",
                table: "task_items",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "task_links",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    task_item_id = table.Column<Guid>(type: "uuid", nullable: false),
                    url = table.Column<string>(type: "text", nullable: false),
                    display_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    application_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    external_id = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_task_links", x => x.id);
                    table.ForeignKey(
                        name: "FK_task_links_task_items_task_item_id",
                        column: x => x.task_item_id,
                        principalTable: "task_items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_task_links_task_item_id",
                table: "task_links",
                column: "task_item_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "task_links");

            migrationBuilder.DropColumn(
                name: "progress",
                table: "task_items");

            migrationBuilder.DropColumn(
                name: "recurrence",
                table: "task_items");

            migrationBuilder.DropColumn(
                name: "reminder_at",
                table: "task_items");

            migrationBuilder.DropColumn(
                name: "reminder_enabled",
                table: "task_items");

            migrationBuilder.DropColumn(
                name: "reminder_time_zone",
                table: "task_items");

            migrationBuilder.DropColumn(
                name: "start_time_zone",
                table: "task_items");

            migrationBuilder.DropColumn(
                name: "starts_at",
                table: "task_items");
        }
    }
}
