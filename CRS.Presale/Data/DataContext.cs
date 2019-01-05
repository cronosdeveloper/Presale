using CRS.Presale.Domain;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace CRS.Presale.Data
{
    public class DataContext : DbContext
    {
        public DataContext(DbContextOptions<DataContext> options)
            : base(options)
        {
        }

        public DbSet<PresaleInfo> PresaleInfos { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            CreatePresaleInfosModel(modelBuilder);
        }

        private static void CreatePresaleInfosModel(ModelBuilder modelBuilder)
        {
            var entity = modelBuilder.Entity<PresaleInfo>();

            entity
                .Property(t => t.Id)
                .ValueGeneratedOnAdd()
                .HasDefaultValueSql("newsequentialid()");

            entity
                .HasIndex(t => t.TxHash)
                .IsUnique(true);

            entity.Property(t => t.NrOfCoins)
                .HasColumnType("decimal(20, 10)");
        }
    }
}
