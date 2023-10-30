/*
 * @lc app=leetcode id=733 lang=java
 *
 * [733] Flood Fill
 */

// @lc code=start
class Solution {
    public int[][] floodFill(int[][] image, int sr, int sc, int newColor) {
       int m = image.length;
       int n = image[0].length;
       int origColor = image[sr][sc];

       if(newColor == origColor) return image;

       dfs(image, sr , sc , origColor, newColor);
       return image; 
    }
    private void dfs(int[][] image, int row , int col,int origColor , int newColor) {
        if(row<0 || col<0 || row==image.length || col == image[0].length || image[row][col] != origColor ) {
            return;
        }
        image[row][col] = newColor;

        dfs(image, row-1,col,origColor , newColor);
        dfs(image, row+1,col,origColor , newColor);
        dfs(image, row, col+1,origColor , newColor);
        dfs(image, row, col-1,origColor , newColor);
    }
}
// @lc code=end

