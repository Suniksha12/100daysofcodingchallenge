/*
 * @lc app=leetcode id=122 lang=java
 *
 * [122] Best Time to Buy and Sell Stock II
 */

// @lc code=start

import java.util.Arrays;

class Solution {
        static int dp[][];
        static int helper(int arr[],int i , int flag) {
            if(i==arr.length) return 0;

            if(dp[flag][i]!=-1) return dp[flag][i];

            int ans = Integer.MIN_VALUE;
            ans = helper(arr,i+1,flag);
            
            if(flag==1) {
                ans = Math.max(ans,helper(arr,i+1,0)+arr[i]);
            } else {
                ans = Math.max(ans,helper(arr,i+1,1)-arr[i]);
            }
            return dp[flag][i] = ans;
        }
        public int maxProfit(int[] arr) {
            dp = new int[2][30005];
            for(var a : dp) Arrays.fill(a,-1);
            return helper(arr,0,0);
        }
}
// @lc code=end

