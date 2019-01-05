using System;
using System.Collections.Generic;
using System.Text;

namespace CRS.Presale.Domain
{
    public class PresaleInfo
    {
        public Guid Id { get; set; }

        public DateTime CreationTimestamp { get; set; }

        public string BuyerAddress { get; set; }

        public ulong BlockNumber { get; set; }

        public string TxHash { get; set; }

        public string TargetAddressCoins { get; set; }

        public bool TargetAddressValid { get; set; }

        public decimal Price { get; set; }

        public decimal NrOfCoins { get; set; }

        public bool Referral { get; set; }

        public DateTime? SentToTargetTimestamp { get; set; }

        public string SentToTargetTxId { get; set; }

        public string AdditionalData { get; set; }
    }
}
