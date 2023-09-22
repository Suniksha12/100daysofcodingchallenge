/*
 * @lc app=leetcode id=9 lang=java
 *
 * [9] Palindrome Number
 */

// @lc code=start
class Solution {
    public boolean isPalindrome(int x) {
        int s = 0;
        int num = x;
        int r;
        while(num>0 && num !=0)
        {
            r = num % 10;
            s = s*10+r;
            num = num/10;
        }
        if( x == s)
            {
                return true;
            }
        else{
                return false ;
            }
    }
}
// @lc code=end

