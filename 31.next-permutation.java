/*
 * @lc app=leetcode id=31 lang=java
 *
 * [31] Next Permutation
 */

// @lc code=start
class Solution {
    public void nextPermutation(int[] nums) {
        int i = nums.length-2;
        while(i>=0 && nums[i]>=nums[i+1]) {
            i--;
        }
        if(i>=0) {
            int j = nums.length-1;
            while(j>=0 && nums[i]>=nums[j]) {
                j--;
            }
            swap(nums,i,j);
        }
        reverse(nums,i+1);
    }
    private void reverse(int[] nums, int start) {
        int j = nums.length-1;
        while(start<j) {
            swap(nums,start,j);
            start++;
            j--;
        }
    }
    private void swap(int[] nums,int i , int j) {
        int temp = nums[i];
        nums[i] = nums[j];
        nums[j] = temp;
    }
}
// @lc code=end

