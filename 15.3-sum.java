/*
 * @lc app=leetcode id=15 lang=java
 *
 * [15] 3Sum
 */

// @lc code=start

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        List<List<Integer>> ans = new ArrayList<>();
        Arrays.sort(nums);
        for(int i =0;i<nums.length-2;i++) {
            //skip duplicate elements for i
            if(i>0 && nums[i] == nums[i-1]) {
                continue;
            }
            int j = i+1;
            int k = nums.length - 1;

            while(j<k) {
                int sum = nums[i] + nums[j] + nums[k];

                if(sum == 0) {
                    //found a triplet with zero sum
                    ans.add(Arrays.asList(nums[i],nums[j],nums[k]));

                    //skip duplicate elements for k
                    while(j<k && nums[j]==nums[j+1]) {
                        j++;
                    }

                    //skip duplicate elements for k
                    while(j<k && nums[k]==nums[k-1]) {
                        k--;
                    }

                    //move the pointers
                    j++;
                    k--;
                } else if(sum<0) {
                    //Sum is less than zero , increment j to increase the sum
                    j++;
                } else {
                    //sum is greater than zero , decrement k to decrease the sum
                    k--;
                }
            }
        }
        return ans;
    }
}
// @lc code=end

