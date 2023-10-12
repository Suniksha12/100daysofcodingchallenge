/*
 * @lc app=leetcode id=976 lang=java
 *
 * [976] Largest Perimeter Triangle
 */

// @lc code=start

import java.util.Arrays;

class Solution {
    public int largestPerimeter(int[] nums) {
        //sort the array 
       Arrays.sort(nums);
       //loop from backwards so we get the biggest number first.
       for(int i =nums.length-1;i>1;i--){
           if(nums[i-1]+nums[i-2]>nums[i]){
               return nums[i-1]+nums[i-2]+nums[i];
           }
       } 
    return 0;
    }
}
// @lc code=end

