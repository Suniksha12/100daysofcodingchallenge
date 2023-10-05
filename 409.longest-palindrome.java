/*
 * @lc app=leetcode id=409 lang=java
 *
 * [409] Longest Palindrome
 */

// @lc code=start
class Solution {
    public int longestPalindrome(String s) {
      int[] char_counts = new int[128];
      //loop through all the characters in the string given
      for(char c : s.toCharArray()){
          //we are passing thes ascii index in this array
          //counting occurence of each character
          char_counts[c]++;
      }  
      int result =0;
      for (Integer char_count : char_counts){
          //suppose we had 3 aaa so next step gives us 3/2 =1*2=2
          result +=char_count /2*2;
          if(result%2 ==0 && char_count % 2==1){
              result +=1;
          } 
      }
      return result;
        
    }
}
// @lc code=end

