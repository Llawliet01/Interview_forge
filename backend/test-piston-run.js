const judgeService = require('./services/judgeService');

async function run() {
  console.log('Testing Piston Service code execution...');
  
  // Test code: simple JavaScript solution for Two Sum
  const jsCode = `
    function solve(nums, target) {
      const map = new Map();
      for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
          return [map.get(complement), i];
        }
        map.set(nums[i], i);
      }
      return [];
    }
    console.log(JSON.stringify(solve([2, 7, 11, 15], 9)));
  `;

  try {
    const result = await judgeService.executeCode(jsCode, 'javascript', '', '[0,1]');
    console.log('Test Result:', result);
  } catch (error) {
    console.error('Test execution failed:', error);
  }
}

run();
