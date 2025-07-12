export interface RetryOptions {
  retries: number;
  baseDelayMs: number;
  jitter: boolean;
  onError: (err: unknown, attempt: number) => void;
}

function getExponentialDelay(attempt: number, base: number, jitter: boolean): number {
  let delay = base * Math.pow(2, attempt); // Exponential backoff
  if (jitter) {
    const variance = delay * 0.5;
    delay += Math.random() * variance - variance / 2; // ±25% jitter
  }
  return Math.round(delay);
}

const defaultOption: RetryOptions = {
  retries: 2,
  baseDelayMs: 100,
  jitter: true,
  onError: () => {},
};

export async function retry<T>(
  fn: () => Promise<T>,
  { retries, baseDelayMs, jitter, onError }: RetryOptions = defaultOption,
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      onError(err, attempt);
      if (attempt === retries) throw err;

      const delay = getExponentialDelay(attempt, baseDelayMs, jitter);
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  throw new Error('Retry failed unexpectedly');
}
