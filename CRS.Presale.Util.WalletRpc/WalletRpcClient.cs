using System;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace CRS.Presale.Util.WalletRpc
{
    public class WalletRpcClient
    {
        private readonly string username;
        private readonly string password;
        private readonly string passPhrase;
        private string daemonUrl;

        public WalletRpcClient(int port, string username, string password, string passPhrase = "")
        {
            this.username = username;
            this.password = password;
            this.passPhrase = passPhrase;
            this.daemonUrl = $"http://localhost:{port}";
        }

        private async Task UnlockWallet()
        {
            if (!string.IsNullOrEmpty(this.passPhrase))
            {
                var jsonRequest = new JsonRpcRequest("walletpassphrase", passPhrase, 10);
                var daemonRequest = this.CreateDaemonRequest(jsonRequest);

                var sendResult = await daemonRequest.SendJsonRpcRequest(jsonRequest);
                var response = await daemonRequest.ReadJsonRpcResponse<RpcResponse<object>>();
            }
        }

        private async Task LockWallet()
        {
            if (!string.IsNullOrEmpty(this.passPhrase))
            {
                var jsonRequest = new JsonRpcRequest("walletlock");
                var daemonRequest = this.CreateDaemonRequest(jsonRequest);

                var sendResult = await daemonRequest.SendJsonRpcRequest(jsonRequest);
                var response = await daemonRequest.ReadJsonRpcResponse<RpcResponse<object>>();
            }
        }

        public async Task<bool> PingWalletAsync()
        {
            var jsonRequest = new JsonRpcRequest("ping");
            var daemonRequest = this.CreateDaemonRequest(jsonRequest);

            var sendResult = await daemonRequest.SendJsonRpcRequest(jsonRequest);
            var response = await daemonRequest.ReadJsonRpcResponse<RpcResponse<object>>();
            return response != null;
        }

        public async Task<string> GenerateAddressAsync(string label)
        {
            await this.UnlockWallet();
            var jsonRequest = new JsonRpcRequest("getaccountaddress", label);
            var daemonRequest = this.CreateDaemonRequest(jsonRequest);

            var sendResult = await daemonRequest.SendJsonRpcRequest(jsonRequest);
            var response = await daemonRequest.ReadJsonRpcResponse<RpcResponse<string>>();
            return response?.Result;
        }

        public async Task<double?> GetReceivedAmmountAsync(string address)
        {
            var jsonRequest = new JsonRpcRequest("getreceivedbyaddress", address);
            var daemonRequest = this.CreateDaemonRequest(jsonRequest);

            var sendResult = await daemonRequest.SendJsonRpcRequest(jsonRequest);
            var response = await daemonRequest.ReadJsonRpcResponse<RpcResponse<double>>();
            return response?.Result;
        }

        private WebRequest CreateDaemonRequest(JsonRpcRequest jsonRequest)
        {
            var daemonRequest = WebRequest.Create(this.daemonUrl);

            var authInfo = this.username + ":" + this.password;
            authInfo = Convert.ToBase64String(Encoding.Default.GetBytes(authInfo));
            daemonRequest.Headers["Authorization"] = $"Basic {authInfo}";

            daemonRequest.Credentials = new NetworkCredential(this.username, this.password);

            daemonRequest.ContentType = "application/json-rpc";
            daemonRequest.Method = "POST";
            daemonRequest.Proxy = null;

            return daemonRequest;
        }

        public async Task<ValidateAddressResponse> ValidateAddressAsync(string address)
        {
            var jsonRequest = new JsonRpcRequest("validateaddress", address);
            var daemonRequest = this.CreateDaemonRequest(jsonRequest);

            var sendResult = await daemonRequest.SendJsonRpcRequest(jsonRequest);
            var response = await daemonRequest.ReadJsonRpcResponse<RpcResponse<ValidateAddressResponse>>();
            return response?.Result;
        }

        public async Task<decimal?> GetBalanceAsync()
        {
            var jsonRequest = new JsonRpcRequest("getbalance");
            var daemonRequest = this.CreateDaemonRequest(jsonRequest);

            var sendResult = await daemonRequest.SendJsonRpcRequest(jsonRequest);
            var response = await daemonRequest.ReadJsonRpcResponse<RpcResponse<decimal>>();
            return response?.Result;
        }

        public async Task<decimal?> GetReceivedByAddressAsync(string address)
        {
            var jsonRequest = new JsonRpcRequest("getreceivedbyaddress", address);
            var daemonRequest = this.CreateDaemonRequest(jsonRequest);

            var sendResult = await daemonRequest.SendJsonRpcRequest(jsonRequest);
            var response = await daemonRequest.ReadJsonRpcResponse<RpcResponse<decimal>>();
            return response?.Result;
        }

        public async Task<string> SendToAddressAsync(string address, decimal amount, string comment, string commentTo)
        {
            await this.UnlockWallet();

            var jsonRequest = new JsonRpcRequest("sendtoaddress", address, amount, comment, commentTo);
            var daemonRequest = this.CreateDaemonRequest(jsonRequest);

            var sendResult = await daemonRequest.SendJsonRpcRequest(jsonRequest);
            var response = await daemonRequest.ReadJsonRpcResponse<RpcResponse<string>>();

            await this.LockWallet();

            return response?.Result;
        }

        public async Task<string> GetAccountByAddressAsync(string address)
        {
            await this.UnlockWallet();

            var jsonRequest = new JsonRpcRequest("getaccount", address);
            var daemonRequest = this.CreateDaemonRequest(jsonRequest);

            var result = await daemonRequest.SendJsonRpcRequest(jsonRequest);
            var response = await daemonRequest.ReadJsonRpcResponse<RpcResponse<string>>();
            return response?.Result;
        }
    }
}
