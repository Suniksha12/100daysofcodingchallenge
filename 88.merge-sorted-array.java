/*
 * @lc app=leetcode id=88 lang=java
 *
 * [88] Merge Sorted Array
 */

// @lc code=start

import java.util.Arrays;

class Solution {
    public void merge(int[] nums1, int m, int[] nums2, int n) {
       //STL approach traversing the nums2 and appending its elemnts to the end of the nums1 array starting from index m.
       for(int j =0,i=m;j<n;j++){
           //we are shifting elements of nums2 to nums1 because nums1 space is more than nums2 and also we have to display result in nums1.
           nums1[i] = nums2[j];
           i++;
       } 
       //sorting the array and Displaying results in n1 
       Arrays.sort(nums1);
    }
}
// @lc code=end

