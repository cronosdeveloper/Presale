using System;
using System.Collections.Generic;
using System.Text;

namespace CRS.Presale.Util.WalletRpc
{
    public class RpcResponse<T>
    {
        public T Result { get; set; }
        public int Id { get; set; }
        public RpcError Error { get; set; }
    }

    public class RpcError
    {
        public int Code { get; set; }

        public string Message { get; set; }
    }
}
