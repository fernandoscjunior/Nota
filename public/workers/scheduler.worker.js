/**
 * @file scheduler.worker.js
 * @description Dedicated background Web Worker for rock-solid timing ticks.
 * Web Workers are not subject to main-thread UI layout jank or tab throttling.
 */

let timerId = null;
let intervalMs = 25;

self.onmessage = function (e) {
  const msg = e.data;

  if (msg.type === 'START') {
    if (msg.intervalMs && typeof msg.intervalMs === 'number') {
      intervalMs = msg.intervalMs;
    }
    if (timerId !== null) {
      clearInterval(timerId);
    }
    timerId = setInterval(function () {
      self.postMessage({ type: 'TICK' });
    }, intervalMs);
  } else if (msg.type === 'STOP') {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  } else if (msg.type === 'PING') {
    self.postMessage({ type: 'PONG', timestamp: Date.now() });
  }
};
