using Microsoft.Azure.ServiceBus;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CRS.Presale.Queues
{
    public class QueueWriter<T>
    {
        private readonly string serviceBusConnectionString;
        private readonly string queueName;

        public QueueWriter(string serviceBusConnectionString, string queueName)
        {
            this.serviceBusConnectionString = serviceBusConnectionString ?? throw new ArgumentNullException(nameof(serviceBusConnectionString));
            this.queueName = queueName ?? throw new ArgumentNullException(nameof(queueName));
        }

        public async Task WriteMessagesToQueueAsync(IEnumerable<T> messages)
        {
            if (messages.Any())
            {
                var queueClient = new QueueClient(this.serviceBusConnectionString, this.queueName);

                var msg = messages.Select(m => new Message(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(m)))).ToList();

                await queueClient.SendAsync(msg);
            }
        }
    }
}
