export type Internal = {
  type: 'init' | 'connectionStateUpdate';
  [key: string]: unknown;
};
