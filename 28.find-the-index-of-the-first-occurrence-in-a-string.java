/*
 * @lc app=leetcode id=28 lang=java
 *
 * [28] Find the Index of the First Occurrence in a String
 */

// @lc code=start
class Solution {
    public int strStr(String haystack, String needle) {
      if(haystack.contains(needle)){
        return haystack.indexOf(needle);
      }  
      return -1;
    }
}
// @lc code=end

