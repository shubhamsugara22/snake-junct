export type InitResponse = {
  type: 'init';
  postId: string;
  count: number;
  username: string;
};

export type IncrementResponse = {
  type: 'increment';
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: 'decrement';
  postId: string;
  count: number;
};

export type GameScoreResponse = {
  type: 'score';
  postId: string;
  score: number;
  highScore: number;
};

export type SaveScoreRequest = {
  score: number;
  level: string;
};
