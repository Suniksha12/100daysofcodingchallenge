/*
 * @lc app=leetcode id=405 lang=java
 *
 * [405] Convert a Number to Hexadecimal
 */

// @lc code=start
class Solution {
    public String toHex(int num1) {
        long num = num1;
        if(num ==0) return "0";
        if(num < 0){
            num =  (long)Math.pow(2, 32) + num ;
        }
        char[] map = {'0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'};
        StringBuffer sb = new StringBuffer();
        while(num > 0){
            sb.append(map[(int)Math.abs(num%16)]);
            num = (long)Math.floor(num / 16);   
        }
        return sb.reverse().toString();
    }
}
// @lc code=end

