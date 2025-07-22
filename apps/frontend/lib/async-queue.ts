import { Mutex } from 'async-mutex';

export class AsyncQueue<T> {
  private queue: T[] = [];
  private mutex = new Mutex();

  async enqueue(item: T): Promise<void> {
    await this.mutex.runExclusive(() => {
      this.queue.push(item);
    });
  }

  async dequeue(): Promise<T | undefined> {
    return this.mutex.runExclusive(() => {
      return this.queue.shift();
    });
  }

  async drain(): Promise<T[]> {
    return this.mutex.runExclusive(() => {
      const items = [...this.queue];
      this.queue.length = 0; // clear queue
      return items;
    });
  }

  async peek(): Promise<T | undefined> {
    return this.mutex.runExclusive(() => {
      return this.queue[0];
    });
  }

  async size(): Promise<number> {
    return this.mutex.runExclusive(() => {
      return this.queue.length;
    });
  }

  async isEmpty(): Promise<boolean> {
    return this.mutex.runExclusive(() => {
      return this.queue.length === 0;
    });
  }
}
