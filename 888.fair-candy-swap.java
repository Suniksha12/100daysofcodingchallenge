/*
 * @lc app=leetcode id=888 lang=java
 *
 * [888] Fair Candy Swap
 */

// @lc code=start
class Solution {
    public int[] fairCandySwap(int[] aliceSizes, int[] bobSizes) {
        
        //using two pointer approach.
        int aliceTotal = 0;
        int bobTotal = 0;
        //Find sum of alice candies before exchange.
        for(int aa : aliceSizes)
            aliceTotal += aa;
        //Find sum of bob candies before exchange.
        for(int bb : bobSizes)
            bobTotal += bb;
        
        for(int i = 0; i< aliceSizes.length; i++){
            for(int j = 0; j< bobSizes.length; j++){
                int aliceExchange = aliceTotal - aliceSizes[i] + bobSizes[j];
                int bobExchange = bobTotal - bobSizes[j] + aliceSizes[i];
                if(aliceExchange == bobExchange){
                    return new int[]{aliceSizes[i], bobSizes[j]};
                }
            }
        }
        return new int[0];
    }
}
// @lc code=end

