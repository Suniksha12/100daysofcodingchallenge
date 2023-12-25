/*
 * @lc app=leetcode id=260 lang=java
 *
 * [260] Single Number III
 */

// @lc code=start
class Solution {
    public int[] singleNumber(int[] nums) {
        int[] arr = new int[2];
        HashMap<Integer,Integer> hm= new HashMap<Integer,Integer>();
        for(int i =0;i<nums.length;i++) {
            if(hm.containsKey(nums[i])) {
                hm.put(nums[i],hm.get(nums[i]) +1);
            } else {
                hm.put(nums[i],1);
            }
        }
        int index=0;
        for(Map.Entry<Integer,Integer> entry:hm.entrySet()) {
            if(entry.getValue()==1) {
                arr[index++]= entry.getKey();
                if(index==2) break;
            }
        }
        return arr;
    }
}
// @lc code=end

