using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Contracts;
using System.Numerics;

namespace CRS.Presale.Workers.ChainExplorer
{
    [Event("MasternodeSold")]
    public class MasternodeSoldEventDTO : IEventDTO
    {
        [Parameter("address", "buyer", 1, false)]
        public string Buyer { get; set; }

        [Parameter("uint256", "price", 2, false)]
        public BigInteger Price { get; set; }

        [Parameter("string", "coinsTargetAddress", 3, false)]
        public string CoinsTargetAddress { get; set; }

        [Parameter("bool", "referral", 4, false)]
        public bool Referral { get; set; }
    }
}
