/*
 * @lc app=leetcode id=67 lang=java
 *
 * [67] Add Binary
 */

// @lc code=start
class Solution {
    public String addBinary(String a, String b) {
        //since in java we need this for string 
        StringBuilder sb = new StringBuilder();
        //will go to LSB (least significant digit)
        int i = a.length()-1;
        int j = b.length()-1;
        //carry suppose one + one = 0 carry 1
        int carry= 0;

        while(i>=0 || j>=0){
            int sum = carry;
            //seperately written i and j in if just in case while will go for or but just in case we want to run the case seperately.
            if(i >=0 ) sum += a.charAt(i) - '0';
             if ( j >= 0) sum += b.charAt(j) - '0';
            sb.append(sum % 2);
            carry = sum/2;
            //pointer should be decreased
            i--;
            j--;
        }
        //by reversing we get the answer correctly 
        if(carry !=0) sb.append(carry);
        return sb.reverse().toString();
    }
}
// @lc code=end

