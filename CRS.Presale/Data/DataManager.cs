using CRS.Presale.Domain;
using CRS.Presale.Exceptions;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace CRS.Presale.Data
{
    public class DataManager
    {
        private readonly Func<DataContext> contextFactory;

        public DataManager(Func<DataContext> contextFactory)
        {
            this.contextFactory = contextFactory ?? throw new ArgumentNullException(nameof(contextFactory));
        }

        public async Task<PresaleInfo> SaveOrUpdatePresaleInfoAsync(PresaleInfo presaleInfo)
        {
            using (var context = this.contextFactory())
            {
                if (presaleInfo.Id == null || presaleInfo.Id == Guid.Empty)
                {
                    presaleInfo.CreationTimestamp = DateTime.UtcNow;

                    context.PresaleInfos.Add(presaleInfo);
                }
                else
                {
                    var presaleInfoFromDb = await context.PresaleInfos.AsNoTracking().SingleOrDefaultAsync(p => p.Id == presaleInfo.Id);
                    if (presaleInfoFromDb == null)
                    {
                        throw new NotFoundException($"Presale info with ID {presaleInfo.Id} could not be found.");
                    }

                    context.PresaleInfos.Update(presaleInfo);
                    context.Entry(presaleInfo).Property(c => c.CreationTimestamp).IsModified = false;
                }

                await context.SaveChangesAsync();

                return presaleInfo;
            }
        }

        public async Task<PresaleInfo> GetPresaleInfoByIdAsync(Guid presaleId)
        {
            using (var context = this.contextFactory())
            {
                var presaleInfo = await context.PresaleInfos.AsNoTracking().SingleOrDefaultAsync(p => p.Id == presaleId);

                return presaleInfo;
            }
        }

        public async Task<PresaleInfo> GetPresaleInfoByTxHashAsync(string transactionHash)
        {
            using (var context = this.contextFactory())
            {
                var presaleInfo = await context.PresaleInfos.AsNoTracking().SingleOrDefaultAsync(p => p.TxHash == transactionHash);

                return presaleInfo;
            }
        }
    }
}
