using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace CRS.Presale.Migrations
{
    public partial class InitialMigration : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PresaleInfos",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false, defaultValueSql: "newsequentialid()"),
                    CreationTimestamp = table.Column<DateTime>(nullable: false),
                    BuyerAddress = table.Column<string>(nullable: true),
                    BlockNumber = table.Column<decimal>(nullable: false),
                    TxHash = table.Column<string>(nullable: true),
                    TargetAddressCoins = table.Column<string>(nullable: true),
                    TargetAddressValid = table.Column<bool>(nullable: false),
                    Price = table.Column<decimal>(nullable: false),
                    NrOfCoins = table.Column<decimal>(type: "decimal(20, 10)", nullable: false),
                    Referral = table.Column<bool>(nullable: false),
                    SentToTargetTimestamp = table.Column<DateTime>(nullable: true),
                    SentToTargetTxId = table.Column<string>(nullable: true),
                    AdditionalData = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PresaleInfos", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PresaleInfos_TxHash",
                table: "PresaleInfos",
                column: "TxHash",
                unique: true,
                filter: "[TxHash] IS NOT NULL");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PresaleInfos");
        }
    }
}
