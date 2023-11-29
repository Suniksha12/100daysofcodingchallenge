/*
 * @lc app=leetcode id=47 lang=java
 *
 * [47] Permutations II
 */

// @lc code=start
class Solution {
    public List<List<Integer>> permuteUnique(int[] nums) {
       List<List<Integer>> result = new ArrayList<>();
       Arrays.sort(nums);
       helper(nums,result,new ArrayList<>(),new boolean[nums.length]);
       return result; 
    }
    private void helper(int[] nums,List<List<Integer>> result,List<Integer> current, boolean[] used) {
        if(current.size() == nums.length) {
            result.add(new ArrayList<>(current));
            return;
        }
        for(int i =0;i<nums.length;i++) {
            if(used[i]) {
                continue;
            }
            used[i] = true;
            current.add(nums[i]);
            helper(nums,result,current,used);

            current.remove(current.size()-1);
            used[i] = false;

            while(i + 1 < nums.length && nums[i]==nums[i+1]) {
                i++;
            }
        }
    }
}
// @lc code=end

