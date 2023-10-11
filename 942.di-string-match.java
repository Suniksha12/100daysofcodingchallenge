/*
 * @lc app=leetcode id=942 lang=java
 *
 * [942] DI String Match
 */

// @lc code=start
class Solution {
    public int[] diStringMatch(String s) {
       int n = s.length();
        int[] perm = new int[n + 1];

        int start = 0;
        int end = n;
        for (int i = 0; i < n; i++) {
            if (s.charAt(i) == 'I') {
                perm[i] = start++;
            } else {
                perm[i] = end--;
            }
        }
        perm[n] = start;

        return perm;
    }
} 
// @lc code=end

