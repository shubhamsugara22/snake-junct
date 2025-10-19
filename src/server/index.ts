import express from 'express';
import { InitResponse, IncrementResponse, DecrementResponse, GameScoreResponse, SaveScoreRequest } from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      const [count, username] = await Promise.all([
        redis.get('count'),
        reddit.getCurrentUsername(),
      ]);

      res.json({
        type: 'init',
        postId: postId,
        count: count ? parseInt(count) : 0,
        username: username ?? 'anonymous',
      });
    } catch (error) {
      console.error(`API Init Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

router.post<{ postId: string }, IncrementResponse | { status: string; message: string }, unknown>(
  '/api/increment',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', 1),
      postId,
      type: 'increment',
    });
  }
);

router.post<{ postId: string }, DecrementResponse | { status: string; message: string }, unknown>(
  '/api/decrement',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', -1),
      postId,
      type: 'decrement',
    });
  }
);

router.post('/api/save-score', async (req, res): Promise<void> => {
  const { postId } = context;
  if (!postId) {
    res.status(400).json({
      status: 'error',
      message: 'postId is required',
    });
    return;
  }

  try {
    const { score } = req.body;
    const username = await reddit.getCurrentUsername();
    const userKey = `user:${username}:highscore`;
    const globalKey = 'global:highscore';
    
    // Get current high scores
    const [currentUserScore, currentGlobalScore] = await Promise.all([
      redis.get(userKey),
      redis.get(globalKey),
    ]);

    const userHighScore = currentUserScore ? parseInt(currentUserScore) : 0;
    const globalHighScore = currentGlobalScore ? parseInt(currentGlobalScore) : 0;

    // Update high scores if new score is higher
    const newHighScore = Math.max(userHighScore, score);
    const newGlobalHighScore = Math.max(globalHighScore, score);

    await Promise.all([
      redis.set(userKey, newHighScore.toString()),
      redis.set(globalKey, newGlobalHighScore.toString()),
      // Store individual game record for history
      redis.set(`game:${username}:${Date.now()}`, score.toString()),
    ]);

    res.json({
      type: 'score',
      postId,
      score,
      highScore: newHighScore,
    });
  } catch (error) {
    console.error('Error saving score:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to save score',
    });
  }
});

router.get('/api/high-score', async (_req, res): Promise<void> => {
  const { postId } = context;
  if (!postId) {
    res.status(400).json({
      status: 'error',
      message: 'postId is required',
    });
    return;
  }

  try {
    const username = await reddit.getCurrentUsername();
    const userKey = `user:${username}:highscore`;
    
    const userHighScore = await redis.get(userKey);
    const highScore = userHighScore ? parseInt(userHighScore) : 0;

    res.json({
      type: 'score',
      postId,
      score: 0,
      highScore,
    });
  } catch (error) {
    console.error('Error getting high score:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get high score',
    });
  }
});

router.get('/api/leaderboard', async (_req, res): Promise<void> => {
  const { postId } = context;
  if (!postId) {
    res.status(400).json({
      status: 'error',
      message: 'postId is required',
    });
    return;
  }

  try {
    // For now, return empty leaderboard - in a real implementation
    // you would use a proper leaderboard structure
    const entries: Array<{ username: string; score: number; timestamp: number }> = [];

    res.json({
      entries,
      postId,
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get leaderboard',
    });
  }
});

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);
