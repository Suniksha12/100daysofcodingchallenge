/*
 * @lc app=leetcode id=1337 lang=java
 *
 * [1337] The K Weakest Rows in a Matrix
 */

// @lc code=start

import java.util.Arrays;
import java.util.Comparator;

class Solution {

    public int[] kWeakestRows(int[][] mat, int k) {
        RowNum[] array = new RowNum[mat.length];
        for (int i = 0; i < mat.length; i++) {
            int count = 0;
            for (int j = 0; j < mat[i].length; j++) {
                count += mat[i][j];
            }
            array[i] = new RowNum(i, count * mat.length + i);
        }
        Arrays.sort(array, Comparator.comparing(RowNum::getNum));
        int[] result = new int[k];
        for (int i = 0; i < k; i++) {
            result[i] = array[i].getRow();
        }
        return result;
    }

    static class RowNum {
        private int row;
        private int num;

        public RowNum(int row, int num) {
            this.row = row;
            this.num = num;
        }

        public int getRow() {
            return row;
        }

        public int getNum() {
            return num;
        }
    }
}
// @lc code=end

