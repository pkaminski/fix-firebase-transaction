(function() {
  'use strict';

  var originalTransaction = Firebase.prototype.transaction;

  Firebase.ABORT_TRANSACTION_NOW = {};

  Firebase.prototype.transaction = function transaction(updateFunction, onComplete, applyLocally) {
    var aborted, tries = 0, ref = this, updateError;

    var promise = new Promise(function(resolve, reject) {
      var wrappedUpdate = function(data) {
        // Clone data in case updateFunction modifies it before aborting.
        var originalData = JSON.parse(JSON.stringify(data));
        aborted = false;
        try {
          if (++tries > 100) throw new Error('maxretry');
          var result = updateFunction.call(this, data);
          if (result === undefined) {
            aborted = true;
            result = originalData;
          } else if (result === Firebase.ABORT_TRANSACTION_NOW) {
            aborted = true;
            result = undefined;
          }
          return result;
        } catch (e) {
          // Firebase propagates exceptions thrown by the update function to the top level.  So
          // catch them here instead, reject the promise, and abort the transaction by returning
          // undefined.
          updateError = e;
        }
      };

      function txn() {
        try {
          originalTransaction.call(ref, wrappedUpdate, function(error, committed, snapshot) {
            error = error || updateError;
            var result;
            if (error && error.message === 'set') {
              txn();
            } else if (error) {
              result = onComplete(error, false, snapshot);
              reject(error);
            } else {
              result = onComplete(error, committed && !aborted, snapshot);
              resolve({committed: committed && !aborted, snapshot: snapshot});
            }
            return result;
          }, applyLocally);
        } catch (e) {
          onComplete(e, false);
          reject(e);
        }
      }

      txn();
    });

    return promise;

  };
})();
