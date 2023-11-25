/*
 * @lc app=leetcode id=48 lang=java
 *
 * [48] Rotate Image
 */

// @lc code=start
class Solution {
    public void rotate(int[][] matrix) {
        int first;
        int max = matrix.length - 1;
        for(int i = 0;i<(matrix.length + 1)/2;i++) {
            for(int j = 0;j<matrix.length/2;j++) {
                first = matrix[i][j];
                matrix[i][j] = matrix[max - j][i];
                matrix[max - j][i] = matrix[max - i][max - j];
                matrix[max - i][max - j] = matrix[j][max - i];
                matrix[j][max - i] = first;
            }
        }
    }
}
// @lc code=end

