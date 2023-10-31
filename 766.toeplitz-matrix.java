/*
 * @lc app=leetcode id=766 lang=java
 *
 * [766] Toeplitz Matrix
 */

// @lc code=start
class Solution {
    public boolean isToeplitzMatrix(int[][] matrix) {
      for(int i =1;i<matrix.length;i++){
          for(int y = 1;y<matrix[0].length;y++){
           if(matrix[i][y] != matrix[i-1][y-1]) return false;   
          }
      } 
      return true; 
    }
}
// @lc code=end

