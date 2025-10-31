// Quick test to verify boss trigger logic
type BossType = 'octopus' | 'bat';

const checkBossTrigger = (score: number, defeatedBosses: BossType[]): BossType | null => {
  // Check for Bat Boss at score 250 (higher score first)
  if (score >= 250 && !defeatedBosses.includes('bat')) {
    return 'bat';
  }
  // Check for Octopus Boss at score 100
  if (score >= 100 && !defeatedBosses.includes('octopus')) {
    return 'octopus';
  }
  return null;
};

const shouldTriggerBoss = (
  score: number,
  halloweenActive: boolean,
  bossesEnabled: boolean,
  defeatedBosses: BossType[]
): BossType | null => {
  // Check feature flags
  if (!bossesEnabled || !halloweenActive) {
    return null;
  }
  
  // Call checkBossTrigger with error handling
  try {
    return checkBossTrigger(score, defeatedBosses);
  } catch (error) {
    console.error('Error checking boss trigger:', error);
    return null;
  }
};

// Test cases
console.log('Test 1 - Score 50, no bosses defeated:', checkBossTrigger(50, [])); // Should be null
console.log('Test 2 - Score 100, no bosses defeated:', checkBossTrigger(100, [])); // Should be 'octopus'
console.log('Test 3 - Score 150, no bosses defeated:', checkBossTrigger(150, [])); // Should be 'octopus'
console.log('Test 4 - Score 250, no bosses defeated:', checkBossTrigger(250, [])); // Should be 'bat'
console.log('Test 5 - Score 100, octopus defeated:', checkBossTrigger(100, ['octopus'])); // Should be null
console.log('Test 6 - Score 250, octopus defeated:', checkBossTrigger(250, ['octopus'])); // Should be 'bat'
console.log('Test 7 - Score 250, both defeated:', checkBossTrigger(250, ['octopus', 'bat'])); // Should be null

console.log('\nFeature flag tests:');
console.log('Test 8 - Bosses disabled:', shouldTriggerBoss(100, true, false, [])); // Should be null
console.log('Test 9 - Halloween inactive:', shouldTriggerBoss(100, false, true, [])); // Should be null
console.log('Test 10 - Both enabled:', shouldTriggerBoss(100, true, true, [])); // Should be 'octopus'
