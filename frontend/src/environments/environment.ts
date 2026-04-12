interface Environment {
  readonly mode: 'server' | 'wiki';
  readonly manifestUrl: string;
}

export const environment: Environment = {
  mode: 'server',
  manifestUrl: '',
};
