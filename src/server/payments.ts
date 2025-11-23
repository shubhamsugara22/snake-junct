import type { Context } from '@devvit/public-api';
import { redis, reddit } from '@devvit/web/server';

// Power-up product definitions
export const POWERUP_PRODUCTS = {
  shield: {
    sku: 'powerup_shield',
    displayName: 'Shield Protection',
    description: 'Invincibility for 20 seconds',
    price: 5, // Gold amount
  },
  fire: {
    sku: 'powerup_fire',
    displayName: 'Fire Power',
    description: 'Destroy enemies on contact',
    price: 10, // Gold amount
  },
  speed: {
    sku: 'powerup_speed',
    displayName: 'Speed Boost',
    description: 'Increase movement speed',
    price: 5,
  },
  slowmo: {
    sku: 'powerup_slowmo',
    displayName: 'Slow Motion',
    description: 'Slow down all enemies',
    price: 5,
  },
  'double-points': {
    sku: 'powerup_double_points',
    displayName: 'Double Points',
    description: 'Earn 2x points',
    price: 5,
  },
  magnet: {
    sku: 'powerup_magnet',
    displayName: 'Magnet',
    description: 'Attract collectibles',
    price: 5,
  },
  ghost: {
    sku: 'powerup_ghost',
    displayName: 'Ghost Mode',
    description: 'Phase through obstacles',
    price: 5,
  },
  'multi-jump': {
    sku: 'powerup_multi_jump',
    displayName: 'Multi-Jump',
    description: 'Double or triple jump',
    price: 5,
  },
};

// Helper to get inventory key
function getInventoryKey(postId: string, userId: string, powerUpId: string): string {
  return `inventory:${postId}:${userId}:${powerUpId}`;
}

// Handle power-up purchase (called from API endpoint)
export async function handlePowerUpPurchase(
  powerUpId: string,
  goldAmount: number
) {
  try {
    const product = POWERUP_PRODUCTS[powerUpId as keyof typeof POWERUP_PRODUCTS];
    
    if (!product) {
      throw new Error(`Invalid power-up ID: ${powerUpId}`);
    }

    if (product.price !== goldAmount) {
      throw new Error(`Invalid gold amount for ${powerUpId}`);
    }

    // Get current user from global reddit instance
    const username = await reddit.getCurrentUsername();
    if (!username) {
      throw new Error('User not authenticated');
    }

    return {
      success: true,
      message: `Purchase initiated for ${product.displayName}. Awaiting payment confirmation.`,
      sku: product.sku,
    };
  } catch (error) {
    console.error('Power-up purchase error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Purchase failed',
    };
  }
}

// Handle payment fulfillment (called by Devvit when payment completes)
// This should be registered with addPaymentHandler in the main Devvit app
export async function fulfillPowerUpOrder(order: any, ctx: Context) {
  try {
    // Find which power-up was purchased
    const purchasedProduct = order.products.find((p: any) => 
      Object.values(POWERUP_PRODUCTS).some(product => product.sku === p.sku)
    );

    if (!purchasedProduct) {
      throw new Error('Unable to fulfill order: power-up sku not found');
    }

    if (order.status !== 'PAID') {
      throw new Error('Order must be paid before fulfillment');
    }

    // Find the power-up ID from the SKU
    const powerUpId = Object.entries(POWERUP_PRODUCTS).find(
      ([_, product]) => product.sku === purchasedProduct.sku
    )?.[0];

    if (!powerUpId) {
      throw new Error('Power-up ID not found for SKU');
    }

    // Add to user's inventory using context
    const inventoryKey = getInventoryKey(ctx.postId!, ctx.userId!, powerUpId);
    const currentCount = await ctx.redis.get(inventoryKey);
    const newCount = (currentCount ? parseInt(currentCount) : 0) + 1;
    await ctx.redis.set(inventoryKey, newCount.toString());

    console.log(`✅ Fulfilled power-up ${powerUpId} for user ${ctx.userId} in post ${ctx.postId}`);

    return {
      success: true,
      message: 'Power-up delivered to inventory',
    };
  } catch (error) {
    console.error('Fulfillment error:', error);
    throw error; // Re-throw so Devvit knows fulfillment failed
  }
}

// Get user's power-up inventory
export async function getUserInventory(username: string) {
  try {
    const inventoryKey = `inventory:${username}`;
    const inventory = await redis.hGetAll(inventoryKey);
    
    return {
      success: true,
      inventory: inventory || {},
    };
  } catch (error) {
    console.error('Get inventory error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get inventory',
      inventory: {},
    };
  }
}

// Use a power-up (decrement from inventory)
export async function usePowerUp(username: string, powerUpId: string) {
  try {
    const inventoryKey = `inventory:${username}`;
    
    // Check if user has the power-up
    const count = await redis.hGet(inventoryKey, powerUpId);
    const currentCount = count ? parseInt(count) : 0;
    
    if (currentCount <= 0) {
      return {
        success: false,
        error: 'Power-up not available in inventory',
      };
    }

    // Decrement count
    await redis.hIncrBy(inventoryKey, powerUpId, -1);
    
    return {
      success: true,
      remainingCount: currentCount - 1,
    };
  } catch (error) {
    console.error('Use power-up error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to use power-up',
    };
  }
}
