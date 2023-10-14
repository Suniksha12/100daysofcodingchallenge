/*
 * @lc app=leetcode id=441 lang=java
 *
 * [441] Arranging Coins
 */

// @lc code=start
class Solution {
    public int arrangeCoins(int n) {
     long left =1;
     long right =n;
     long mid =0;
     while(left <=right){
         mid = (left+right)/2;
         long coins =(mid *(mid+1))/2;
         if(coins==n) return (int)mid;
         else if(coins>n) right=mid-1;
         else left = mid+1;
     }  
     return (int) right; 
    }
}
// @lc code=end

