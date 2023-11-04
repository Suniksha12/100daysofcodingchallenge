/*
 * @lc app=leetcode id=1323 lang=java
 *
 * [1323] Maximum 69 Number
 */

// @lc code=start
class Solution {
    public int maximum69Number (int num) {
        String s = Integer.toString(num); //converting integer to string
        StringBuilder sb= new StringBuilder(s); //using stringbuilder to replace character as string is immutable.
        for(int i=0;i<s.length();i++){
            if(s.charAt(i)=='6'){
                sb.replace(i,i+1,"9");
                break;
            }
        }
        s=sb.toString(); //converting stringbuilder to string
        int res=Integer.parseInt(s); //converting string to integer
        return res;
    }
}
// @lc code=end

