import { Mutex } from 'async-mutex';

export const insertOperationLogMutex = new Mutex();
