using System;
using System.Collections.Generic;
using System.Runtime.Serialization;
using System.Text;

namespace CRS.Presale.Exceptions
{
    public class UnknownMessageContentException : Exception
    {
        public UnknownMessageContentException(string message)
           : base(message)
        {
        }

        public UnknownMessageContentException(string message, Exception innerException)
            : base(message, innerException)
        {
        }

        protected UnknownMessageContentException(SerializationInfo info, StreamingContext context)
            : base(info, context)
        {
        }
    }
}
