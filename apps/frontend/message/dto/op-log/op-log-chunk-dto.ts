import type { OpLogDTO } from './op-log-dto';

export type OpLogChunkDTO = {
  chunkId: string;
  opLogs: OpLogDTO[];
};
