export type CommandType = 'createSnapshot' | 'createOpLog';

export type Command<T> = {
  commandId: string;
  type: CommandType;
  timestamp: string;
  corelationId?: string;
  data: T;
};
