// Reference: https://segmentfault.com/a/1190000023157856

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
function resolvePromise(promise, x, resolve, reject) {
  if (promise === x) {
    return reject(new TypeError('promise and x are the same'));
  }
  if (x instanceof MyPromise) {
    // 该 if 与下面判断 then 并调用重复，可有可无
    x.then((y) => {
      resolvePromise(promise, y, resolve, reject);
    }, reject);
  } else if (typeof x === 'object' || typeof x === 'function') {
    if (x === null) {
      return resolve(x);
    }
    try {
      const { then } = x;
      if (typeof then === 'function') {
        let called = false;
        try {
          then.call(
            x,
            (y) => {
              if (called) {
                return;
              }
              called = true;
              resolvePromise(promise, y, resolve, reject);
            },
            (r) => {
              if (called) {
                return;
              }
              called = true;
              reject(r);
            },
          );
        } catch (e) {
          if (called) {
            return;
          }
          reject(e);
        }
      } else {
        resolve(x);
      }
    } catch (e) {
      return reject(e);
    }
  } else {
    resolve(x);
  }
}

MyPromise.prototype.then = function (onFulfilled, onRejected) {
  // 在真正执行时会判断传入 onfulfilled 和 onRejected 的是否为函数
  // 因此，下面两个 if 是多余的
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

  if (this.status === FULFILLED) {
    const promise2 = new MyPromise((resolve, reject) => {
      // setTimeout 确保异步执行
      setTimeout(() => {
        try {
          if (typeof onFulfilled !== 'function') {
            resolve(this.value);
          } else {
            const x = realOnFulfilled(this.value);
            resolvePromise(promise2, x, resolve, reject);
          }
        } catch (e) {
          reject(e);
        }
      }, 0);
    });
    return promise2;
  }

  if (this.status === REJECTED) {
    const promise2 = new MyPromise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (typeof onRejected !== 'function') {
            reject(this.reason);
          } else {
            const x = realOnRejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
          }
        } catch (e) {
          reject(e);
        }
      }, 0);
    });
    return promise2;
  }

  // 解决异步问题
  if (this.status === PENDING) {
    const promise2 = new MyPromise((resolve, reject) => {
      this.onFulfilledCallbacks.push(() => {
        setTimeout(() => {
          try {
            if (typeof onFulfilled !== 'function') {
              resolve(this.value);
            } else {
              const x = realOnFulfilled(this.value);
              resolvePromise(promise2, x, resolve, reject);
            }
          } catch (e) {
            reject(e);
          }
        }, 0);
      });

      this.onRejectedCallbacks.push(() => {
        setTimeout(() => {
          try {
            if (typeof onRejected !== 'function') {
              reject(this.reason);
            } else {
              const x = realOnRejected(this.reason);
              resolvePromise(promise2, x, resolve, reject);
            }
          } catch (e) {
            reject(e);
          }
        }, 0);
      });
    });
    return promise2;
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
