/*
 * @lc app=leetcode id=45 lang=java
 *
 * [45] Jump Game II
 */

// @lc code=start
class Solution {
    public int jump(int[] nums) {
        int ans = 0;
        int end = 0;
        int farthest = 0;

        for(int i =0;i<nums.length - 1;++i) {
            farthest = Math.max(farthest, i + nums[i]);
            if(farthest >= nums.length - 1){
                ++ans;
                break;
            }
            if(i==end) {
                ++ans;
                end = farthest;
            }
        }
        return ans;
    }
}
// @lc code=end

