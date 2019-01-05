using CRS.Presale.Config;
using CRS.Presale.Data;
using CRS.Presale.Exceptions;
using CRS.Presale.Queues.Messages;
using CRS.Presale.Util.WalletRpc;
using Microsoft.Azure.ServiceBus;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System;
using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace CRS.Presale.Workers.SendCoins
{
    public class Program
    {
        private static string serviceBusConnectionString;
        private static string sendCoinsQueueName;

        private static DbContextOptionsBuilder<DataContext> optionsBuilder;

        private static WalletRpcClient rpcClient;

        private static DataManager dataManager;

        private static IQueueClient queueClient;

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

            queueClient = new QueueClient(serviceBusConnectionString, sendCoinsQueueName);

            dataManager = new DataManager(() => new DataContext(optionsBuilder.Options));

            MainAsync().GetAwaiter().GetResult();
        }

        private static async Task MainAsync()
        {
            Console.WriteLine("=============================");
            Console.WriteLine("Starting send coins worker...");
            Console.WriteLine("=============================");

            try
            {
                queueClient.RegisterMessageHandler(
                    ProcessMessagesAsync,
                    new MessageHandlerOptions(ExceptionReceivedHandler) { MaxConcurrentCalls = 1, AutoComplete = false });

                while (true)
                {
                    await Task.Delay(5000);
                }
            }
            catch (Exception exception)
            {
                Console.WriteLine($"{DateTime.UtcNow} > Exception: {exception.Message}");
            }
            finally
            {
                await queueClient.CloseAsync();
            }
        }

        private static async Task ProcessMessagesAsync(Message message, CancellationToken token)
        {
            // Process the message
            var messageBody = Encoding.UTF8.GetString(message.Body);

            Console.WriteLine($"Received message: SequenceNumber:{message.SystemProperties.SequenceNumber} Body:{messageBody}");

            var sendCoinsMessage = JsonConvert.DeserializeObject<SendCoinsMessage>(messageBody);

            if (sendCoinsMessage == null)
            {
                throw new UnknownMessageContentException("Content: " + messageBody);
            }

            var presaleInfo = await dataManager.GetPresaleInfoByIdAsync(sendCoinsMessage.PresaleId);

            if (presaleInfo == null)
            {
                Console.WriteLine("Given presale ID not found - something went really wrong :(");
                Console.ReadLine();
            }

            // wait until wallet is ready to send the coins out
            var walletBalance = await rpcClient.GetBalanceAsync();

            if (walletBalance == null)
            {
                presaleInfo.AdditionalData = $"get balance error - retry in the next cycle (message will be requeued)";
                Console.WriteLine(presaleInfo.AdditionalData);

                await dataManager.SaveOrUpdatePresaleInfoAsync(presaleInfo);

                await Task.Delay(30000);

                await queueClient.AbandonAsync(message.SystemProperties.LockToken);

                return;
            }

            if (presaleInfo.SentToTargetTimestamp != null)
            {
                presaleInfo.AdditionalData = $"coins were already sent - don't send them multiple times - drop message from queue";
                Console.WriteLine(presaleInfo.AdditionalData);

                await dataManager.SaveOrUpdatePresaleInfoAsync(presaleInfo);

                await queueClient.CompleteAsync(message.SystemProperties.LockToken);

                return;
            }

            // greater since we have to pay a tx fee
            if (walletBalance.Value > presaleInfo.NrOfCoins + 1)
            {
                var validateAddressResult = await rpcClient.ValidateAddressAsync(presaleInfo.TargetAddressCoins);

                if (validateAddressResult != null)
                {
                    // set target address state
                    presaleInfo.TargetAddressValid = validateAddressResult.IsValid;

                    if (!validateAddressResult.IsValid)
                    {
                        presaleInfo.AdditionalData = "target address invalid - check manually";
                        Console.WriteLine(presaleInfo.AdditionalData);

                        await dataManager.SaveOrUpdatePresaleInfoAsync(presaleInfo);

                        await queueClient.CompleteAsync(message.SystemProperties.LockToken);

                        return;
                    }

                    var transactionResult = await rpcClient.SendToAddressAsync(presaleInfo.TargetAddressCoins, presaleInfo.NrOfCoins, "coin presale " + presaleInfo.Id, sendCoinsMessage.PresaleId.ToString());

                    // if the result is invalid, try again (requeue)
                    if (transactionResult != null)
                    {
                        presaleInfo.SentToTargetTxId = transactionResult;
                        presaleInfo.SentToTargetTimestamp = DateTime.UtcNow;
                        presaleInfo.AdditionalData = "coins sent";
                        Console.WriteLine(presaleInfo.AdditionalData);
                    }
                    else
                    {
                        presaleInfo.AdditionalData = $"send to address error: transactionResult null -> please send {presaleInfo.NrOfCoins} coins manually";
                        Console.WriteLine(presaleInfo.AdditionalData);
                    }

                    await dataManager.SaveOrUpdatePresaleInfoAsync(presaleInfo);

                    await queueClient.CompleteAsync(message.SystemProperties.LockToken);
                }
                else
                {
                    presaleInfo.AdditionalData = "address check error: validateAddressResult null";
                    Console.WriteLine(presaleInfo.AdditionalData);

                    await dataManager.SaveOrUpdatePresaleInfoAsync(presaleInfo);

                    await Task.Delay(30000);

                    await queueClient.AbandonAsync(message.SystemProperties.LockToken);
                }
            }
            else
            {
                presaleInfo.AdditionalData = $"balance error - not enough coins available -> requeue";
                Console.WriteLine(presaleInfo.AdditionalData);

                await dataManager.SaveOrUpdatePresaleInfoAsync(presaleInfo);

                await Task.Delay(30000);

                await queueClient.AbandonAsync(message.SystemProperties.LockToken);
            }
        }

        // Use this handler to examine the exceptions received on the message pump.
        private static Task ExceptionReceivedHandler(ExceptionReceivedEventArgs exceptionReceivedEventArgs)
        {
            Console.WriteLine($"Message handler encountered an exception {exceptionReceivedEventArgs.Exception}.");
            var context = exceptionReceivedEventArgs.ExceptionReceivedContext;
            Console.WriteLine("Exception context for troubleshooting:");
            Console.WriteLine($"- Endpoint: {context.Endpoint}");
            Console.WriteLine($"- Entity Path: {context.EntityPath}");
            Console.WriteLine($"- Executing Action: {context.Action}");
            return Task.CompletedTask;
        }
    }
}
