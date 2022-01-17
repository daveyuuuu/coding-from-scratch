const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

function MyPromise(fn) {
  this.status = PENDING;
  this.value = null;
  this.reason = null;

  this.onFulfilledCallbacks = [];
  this.onRejectedCallbacks = [];

  const that = this;
  function resolve(value) {
    if (that.status === PENDING) {
      that.status = FULFILLED;
      that.value = value;
      that.onFulfilledCallbacks.forEach((cb) => cb(that.value));
    }
  }

  function reject(reason) {
    if (that.status === PENDING) {
      that.status = REJECTED;
      that.reason = reason;
      that.onRejectedCallbacks.forEach((cb) => cb(that.reason));
    }
  }

  try {
    fn(resolve, reject);
  } catch (e) {
    reject(e);
  }
}

MyPromise.prototype.then = function (onFulfilled, onRejected) {
  let realOnFulfilled = onFulfilled;
  if (typeof onFulfilled !== 'function') {
    realOnFulfilled = function (value) {
      return value;
    };
  }

  let realOnRejected = onRejected;
  if (typeof onRejected !== 'function') {
    realOnRejected = function (reason) {
      throw reason;
    };
  }

  if (this.status === PENDING) {
    this.onFulfilledCallbacks.push(realOnFulfilled);
    this.onRejectedCallbacks.push(realOnRejected);
  }

  if (this.status === FULFILLED) {
    realOnFulfilled(this.value);
  }

  if (this.status === REJECTED) {
    realOnRejected(this.reason);
  }
};

MyPromise.deferred = function () {
  const result = {};
  result.promise = new MyPromise((resolve, reject) => {
    result.resolve = resolve;
    result.reject = reject;
  });

  return result;
};

module.exports = MyPromise;
