using System;
using System.Collections.Generic;
using System.Text;

namespace CRS.Presale.Queues.Messages
{
    public class SendCoinsMessage
    {
        public Guid PresaleId { get; set; }

        public SendCoinsMessage(Guid presaleId)
        {
            this.PresaleId = presaleId;
        }
    }
}
