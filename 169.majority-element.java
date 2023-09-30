/*
 * @lc app=leetcode id=169 lang=java
 *
 * [169] Majority Element
 */

// @lc code=start
class Solution {
    public int majorityElement(int[] nums) {
       int count =0;
       int max =0;
       for (int i =0;i<nums.length;i++){
        if(count==0){
            max = nums[i];
        }
        if(max == nums[i]){
            count++;
        }else{
            count--;
        }
       } 
       return max;
    }
}
// @lc code=end

