using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace CRS.Presale.Util.WalletRpc
{
    public static class WebRequestRpcExtensions
    {
        public static async Task<bool> SendJsonRpcRequest(this WebRequest webRequest, JsonRpcRequest request)
        {
            var jsonRequestBytes = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(request));
            webRequest.ContentLength = jsonRequestBytes.Length;

            try
            {
                using (var stream = await webRequest.GetRequestStreamAsync())
                {
                    stream.Write(jsonRequestBytes, 0, jsonRequestBytes.Length);
                }

                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public static async Task<T> ReadJsonRpcResponse<T>(this WebRequest request)
        {
            try
            {
                string result;
                using (var response = await request.GetResponseAsync())
                {
                    using (var stream = response.GetResponseStream())
                    {
                        using (var reader = new StreamReader(stream))
                        {
                            result = reader.ReadToEnd();
                            reader.Dispose();
                        }
                    }
                }

                return JsonConvert.DeserializeObject<T>(result);
            }
            catch (Exception)
            {
                return default(T);
            }
        }
    }
}
