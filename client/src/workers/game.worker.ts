const worker = self as unknown as Worker;

worker.addEventListener('message', (event) => {
  if (event.data === 'getLevelStartMessage') {
    worker.postMessage('Web worker is working');
  }
});

export {};