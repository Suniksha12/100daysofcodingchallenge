/*
 * @lc app=leetcode id=704 lang=java
 *
 * [704] Binary Search
 */

// @lc code=start
class Solution {
    public int search(int[] nums, int target) {
      int l = 0, r = nums.length - 1;
        while (l <= r) {
            int m = l + (r - l) / 2;
 
            // Check if x is present at mid
            if (nums[m] == target)
                return m;
 
            // If x greater, ignore left half
            if (nums[m] < target)
                l = m + 1;
 
            // If x is smaller, ignore right half
            else
                r = m - 1;
       }
        return -1;
    }
}
// @lc code=end

