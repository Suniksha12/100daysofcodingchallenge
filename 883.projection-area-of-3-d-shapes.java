/*
 * @lc app=leetcode id=883 lang=java
 *
 * [883] Projection Area of 3D Shapes
 */

// @lc code=start
class Solution {
    public int projectionArea(int[][] grid) {
        int a=0,x=0;
        for(int i=0;i<grid.length;i++)
        {
            int mr=Integer.MIN_VALUE;
            int mc=Integer.MIN_VALUE;
            for(int j=0;j<grid[0].length;j++)
            {
                if(grid[i][j]!=0)x+=1;//calculate number of non zero elements for area from top view
                if(grid[i][j]>mr)mr=grid[i][j];//calculate maximum element of each row
                if(grid[j][i]>mc)mc=grid[j][i];//calculate maximum element of each column
            }
            a+=mr+mc; //add max of each row and each column 
        }
        return (a+x);
    }
}
// @lc code=end

