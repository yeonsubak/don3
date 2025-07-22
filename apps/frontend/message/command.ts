export type CommandType = 'createSnapshot' | 'createOpLog';

export type Command<T> = {
  type: CommandType;
  timestamp: string;
  corelationId?: string;
  data: T;
};
