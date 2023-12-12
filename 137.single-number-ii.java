/*
 * @lc app=leetcode id=137 lang=java
 *
 * [137] Single Number II
 */

// @lc code=start
class Solution {
    public int singleNumber(int[] nums) {
        Map<Integer , Integer> map = new HashMap<>();

        for(int x : nums) {
            map.put(x,map.getOrDefault(x,0) + 1);

        }
        for(Map.Entry<Integer,Integer> entry : map.entrySet()) {
            if(entry.getValue() == 1) {
                return entry.getKey();
            }
        }
        return -1;
    }
}
// @lc code=end

