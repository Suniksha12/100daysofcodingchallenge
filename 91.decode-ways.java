/*
 * @lc app=leetcode id=91 lang=java
 *
 * [91] Decode Ways
 */

// @lc code=start
class Solution {
    public int numDecodings(String s) {
       return s.length()==0?0:numDecodings(0,s); 
    }
    private int numDecodings(int p , String s) {
        int n = s.length();
        if(p==n) return 1;
        if(s.charAt(p)=='0') return 0;
        int res = numDecodings(p+1,s);
        if(p<n-1&&(s.charAt(p)=='1' || s.charAt(p)=='2' && s.charAt(p+1)<'7'))
           res += numDecodings(p+2,s);
        return res;
    }
}
// @lc code=end

