/*
 * @lc app=leetcode id=605 lang=java
 *
 * [605] Can Place Flowers
 */

// @lc code=start
class Solution {
    public boolean canPlaceFlowers(int[] flowerbed, int n) {
      int count =0;
      for(int i =0;i<flowerbed.length;i++){
        if(flowerbed[i]==0){
            int prev =(i==0 || flowerbed[i-1]==0)?0:1;
            int next = (i==flowerbed[i-1]||flowerbed[i+1]==0)?0:1;
            if(prev==0 && next==0){
                flowerbed[i]=1;
                count++;
            }
        }
      }  
      return count>=n;
    }
}
// @lc code=end

