using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace CRS.Presale.Util.WalletRpc
{
    public class JsonRpcRequest
    {
        public JsonRpcRequest(string method, params object[] parameters)
        {
            this.Method = method;
            this.Parameters = parameters?.ToList() ?? new List<object>();
        }

        [JsonProperty(PropertyName = "method", Order = 0)]
        public string Method { get; set; }

        [JsonProperty(PropertyName = "params", Order = 1)]
        public IList<object> Parameters { get; set; }

        [JsonProperty(PropertyName = "id", Order = 2)]
        public int Id { get; set; }
    }
}
