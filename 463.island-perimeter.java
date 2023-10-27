/*
 * @lc app=leetcode id=463 lang=java
 *
 * [463] Island Perimeter
 */

// @lc code=start
class Solution {
    public int islandPerimeter(int[][] grid) {
        int n = grid.length;
        int n1=grid[0].length;
        int peri =0;
        for(int i=0;i<n;i++){
            for(int j=0;j<n1;j++){
                if(grid[i][j]==1){
                    peri+=4;
                    if(i>0 &&grid[i-1][j]==1){
                        peri = peri-2;
                    }
                    if(j>0 && grid[i][j-1]==1){
                        peri -= 2;
                    }
                }
            }
        }
        return peri;
    }
}
// @lc code=end

