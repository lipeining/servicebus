function Bus () {
  this.incomingMiddleware = [];
  this.outgoingMiddleware = [];
}

Bus.prototype.use = function (middleware) {
  if (middleware.handleIncoming) this.incomingMiddleware.push(middleware.handleIncoming);
  if (middleware.handleOutgoing) this.outgoingMiddleware.push(middleware.handleOutgoing);
  return this;
}

Bus.prototype.handleIncoming = function (message, headers, deliveryInfo, messageHandle, options, callback) {
  var index = this.incomingMiddleware.length - 1;
  var self = this;

  function next (err) {

    var layer;
    var args = Array.prototype.slice.call(arguments, 1);

    message = (args.length > 1) ? args[0] : message;
    headers = (args.length > 1) ? args[1] : headers;
    deliveryInfo = (args.length > 1) ? args[2] : deliveryInfo;
    messageHandle = (args.length > 1) ? args[3] : messageHandle;
    options = (args.length > 1) ? args[3] : options;

    layer = self.incomingMiddleware[index--];

    if ( undefined === layer) {
      return callback(message, headers, deliveryInfo, messageHandle, options);
    } else {
      layer.call(self, message, headers, deliveryInfo, messageHandle, options, next);
    }
  }

  next();
}

Bus.prototype.handleOutgoing = function (queueName, message, callback) {
  
  var index = 0;
  var self = this;

  function next (err) {

    var layer;
    var args = Array.prototype.slice.call(arguments, 1);

    queueName = (args.length > 1) ? args[0] : queueName;
    message = (args.length > 1) ? args[1] : message;

    layer = self.outgoingMiddleware[index];

    index++;

    if ( undefined === layer) {
      return callback(queueName, message);
    } else  {
      layer.call(self, queueName, message, next);
    } 
  }

  next(null, queueName, message);
}

Bus.prototype.correlate = require('./middleware/correlate');
Bus.prototype.logger = require('./middleware/logger');
Bus.prototype.package = require('./middleware/package');
Bus.prototype.retry = require('./middleware/retry');

module.exports = Bus;