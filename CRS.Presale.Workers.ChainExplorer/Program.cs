using CRS.Presale.Config;
using CRS.Presale.Data;
using CRS.Presale.Domain;
using CRS.Presale.Exceptions;
using CRS.Presale.Queues;
using CRS.Presale.Queues.Messages;
using CRS.Presale.Util.WalletRpc;
using Microsoft.Azure.ServiceBus;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Nethereum.RPC.Eth.DTOs;
using Nethereum.Web3;
using Newtonsoft.Json;
using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace CRS.Presale.Workers.ChainExplorer
{
    public class Program
    {
        private static string serviceBusConnectionString;
        private static string sendCoinsQueueName;

        private static string contractAddress;
        private static string network;
        private static decimal nrOfCoins;

        private static int sleepTime;

        private static DbContextOptionsBuilder<DataContext> optionsBuilder;

        private static WalletRpcClient rpcClient;

        private static DataManager dataManager;

        private static QueueWriter<SendCoinsMessage> sendCoinsQueueWriter;

        public static void Main(string[] args)
        {
            var configuration = new ConfigurationBuilder()
              .SetBasePath(Directory.GetCurrentDirectory())
              .AddJsonFile("appsettings.json", optional: false)
              .Build();

            var rpcConfig = configuration.GetSection("RpcConfig").Get<RpcConfig>();

            rpcClient = new WalletRpcClient(rpcConfig.Port, rpcConfig.User, rpcConfig.Password, rpcConfig.Passphrase);

            optionsBuilder = new DbContextOptionsBuilder<DataContext>();
            optionsBuilder.UseSqlServer(configuration.GetConnectionString("Database"));

            serviceBusConnectionString = configuration.GetConnectionString("ServiceBusConnectionString");
            sendCoinsQueueName = configuration.GetConnectionString("SendCoinsQueueName");

            contractAddress = configuration.GetValue<string>("ContractAddress");
            network = configuration.GetValue<string>("Network");
            nrOfCoins = configuration.GetValue<decimal>("NrOfCoins");
            sleepTime = configuration.GetValue<int>("SleepTime");

            sendCoinsQueueWriter = new QueueWriter<SendCoinsMessage>(serviceBusConnectionString, sendCoinsQueueName);

            dataManager = new DataManager(() => new DataContext(optionsBuilder.Options));

            MainAsync().GetAwaiter().GetResult();
        }

        private static async Task MainAsync()
        {
            Console.WriteLine("==========================");
            Console.WriteLine("Starting chain explorer...");
            Console.WriteLine("==========================");

            try
            {
                // TODO - fetch last block from db
                ulong lastBlock = 0;

                //network = "https://mainnet.infura.io";
                var web3 = new Web3(network);

                // https://nethereum.readthedocs.io/en/latest/nethereum-events-gettingstarted/#contract-filters-and-event-logs
                var bidEvent = web3.Eth.GetEvent<MasternodeSoldEventDTO>(contractAddress);

                while (true)
                {
                    var balance = await web3.Eth.GetBalance.SendRequestAsync(contractAddress);
                    var etherAmount = Web3.Convert.FromWei(balance.Value);
                    Console.WriteLine($"Contract balance in ETH: {etherAmount}");

                    var fromBlockParameter = new BlockParameter(lastBlock + 1);
                    var filterAllTransferEventsForContract = bidEvent.CreateFilterInput(fromBlockParameter, null);

                    var allTransferEventsForContract = await bidEvent.GetAllChanges(filterAllTransferEventsForContract);

                    //    // does not work with infura :(
                    //    var filterAll = await bidEvent.CreateFilterAsync();
                    //    var log = await bidEvent.GetFilterChanges(filterAll);

                    foreach (var masternodeSoldEvent in allTransferEventsForContract)
                    {
                        var block = (ulong)masternodeSoldEvent.Log.BlockNumber.Value;

                        Console.Write($"block {block}, tx-hash: {masternodeSoldEvent.Log.TransactionHash}");

                        // check if tx is already in the db - if not, create a new one
                        var presaleInfo =  await dataManager.GetPresaleInfoByTxHashAsync(masternodeSoldEvent.Log.TransactionHash);

                        if (presaleInfo == null)
                        {
                            Console.WriteLine(" --> not in the DB create new entry");

                            var presaleInfoToAdd = new PresaleInfo();

                            presaleInfoToAdd.NrOfCoins = nrOfCoins;
                            presaleInfoToAdd.AdditionalData = "waiting for sending coins";
                            presaleInfoToAdd.BlockNumber = block;
                            presaleInfoToAdd.BuyerAddress = masternodeSoldEvent.Event.Buyer;
                            presaleInfoToAdd.TargetAddressCoins = masternodeSoldEvent.Event.CoinsTargetAddress;
                            presaleInfoToAdd.Price = Web3.Convert.FromWei(masternodeSoldEvent.Event.Price);
                            presaleInfoToAdd.Referral = masternodeSoldEvent.Event.Referral;
                            presaleInfoToAdd.TxHash = masternodeSoldEvent.Log.TransactionHash;

                            await dataManager.SaveOrUpdatePresaleInfoAsync(presaleInfoToAdd);

                            await sendCoinsQueueWriter.WriteMessagesToQueueAsync(new[] {
                                new SendCoinsMessage(presaleInfoToAdd.Id)
                            });
                        }
                        else
                        {
                            Console.WriteLine(" --> already in the DB - skip");
                        }

                        lastBlock = block;
                    }

                    Console.WriteLine($"going to sleep for {sleepTime} seconds...");
                    await Task.Delay(sleepTime * 1000);
                }
            }
            catch (Exception exception)
            {
                Console.WriteLine($"{DateTime.UtcNow} > Exception: {exception.Message}");
            }
        }
    }
}