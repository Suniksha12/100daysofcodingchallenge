/*
 * @lc app=leetcode id=46 lang=java
 *
 * [46] Permutations
 */

// @lc code=start
import java.util.ArrayList;
import java.util.List;

public class Solution {
    public void permuteRec(int i , int[] nums,List<List<Integer>> ans) {
        if(i == nums.length) {
            List<Integer> permutation = new ArrayList<>();
            for( int num : nums) {
                permutation.add(num);
            }
            ans.add(permutation);
            return;
        }
        for(int j = i ; j<nums.length;j++) {
            int temp = nums[i];
            nums[i] = nums[j];
            nums[j] = temp;

     permuteRec(i + 1, nums, ans);

            // Swap back
            temp = nums[i];
            nums[i] = nums[j];
            nums[j] = temp;
        }
    }

    public List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> ans = new ArrayList<>();
        permuteRec(0, nums, ans);
        return ans;
    }
}
// @lc code=end

