/*
 * @lc app=leetcode id=79 lang=java
 *
 * [79] Word Search
 */

// @lc code=start
class Solution {
    public boolean exist(char[][] board, String word) {
        int m = board.length;
        int n = board[0].length;
        StringBuilder s = new StringBuilder();
        boolean[][] vis = new boolean[m][n];
        for(int r = 0;r<m;r++) {
            for(int c = 0;c<n;c++) {
                if(dfs(board,vis,word,r,c,s)) return true;
            }
        }
        return false;
    }
    private boolean dfs(char[][] board,boolean[][] vis, String word, int row , int col, StringBuilder s) {
        s.append(board[row][col]);
        vis[row][col] = true;

        if(s.length() == word.length()) {
            boolean hasFound = s.toString().equals(word);
            s.deleteCharAt(s.length()-1);
            vis[row][col] = false;
            return hasFound;
        }
        int m = board.length;
        int n = board[0].length;
        int[][] dirs = new int[][]{{1,0},{-1,0},{0,1},{0,-1}};
        for(int[] dir: dirs) {
            int newRow = row+dir[0];
            int newCol = col + dir[1];

            if(newRow >= 0 && newRow < m && newCol >=0 && newCol < n && !vis[newRow][newCol]){
                if(dfs(board,vis,word,newRow,newCol,s)) {
                    return true;
                }
            }
        }
        s.deleteCharAt(s.length()-1);
        vis[row][col] = false;
        return false;
    }
}
// @lc code=end

