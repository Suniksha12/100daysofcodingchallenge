/*
 * @lc app=leetcode id=36 lang=java
 *
 * [36] Valid Sudoku
 */

// @lc code=start
class Solution {
    public boolean isValidSudoku(char[][] board) {
        HashSet<Character> row = new HashSet<>();
        HashSet<Character> column = new HashSet<>();
        HashSet<Character> smallSqr = new HashSet<>();

        for (int i = 0; i < 9; i++) {
            row.clear();
            column.clear();
            for (int j = 0; j < 9; j++) {
                char r = board[i][j];
                char c = board[j][i];
                if ( (r != '.' && !row.add(r) ) || (c != '.' && !column.add(c))) {
                    return false;
                }
            }
        }

        for (int i = 0; i < 9; i = i + 3) {
            for (int j = 0; j < 9; j = j + 3) {
                smallSqr.clear();
                int rows = i + 3;
                int cols = j + 3;
                for (int k = i; k < rows; k++) {
                    for (int l = j; l < cols; l++) {
                        char c = board[k][l];
                        if (c != '.' && !smallSqr.add(c)) {
                            return false;
                        }
                    }
                }
            }
        }
        return true;
    }
}
// @lc code=end

