using System;
using System.Collections.Generic;
using System.Text;

namespace CRS.Presale.Util.WalletRpc
{
    public class ValidateAddressResponse : RpcResponse<ValidateAddressResponse>
    {
        public bool IsValid { get; set; }
    }
}
