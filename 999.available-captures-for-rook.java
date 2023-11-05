/*
 * @lc app=leetcode id=999 lang=java
 *
 * [999] Available Captures for Rook
 */

// @lc code=start
class Solution {
    public int numRookCaptures(char[][] board) {
        int x =-1,y=-1;
        for(int i=0;i<8;i++){
            for(int j =0;j<8;j++){
                if(board[i][j]=='R'){
                    x=i;
                    y =j;
                    break;
                }
            }
        }
        int s =0;
        for(int i =x;i<8;i++){
            if(board[i][y]=='p'){
                s++;
                break;
            }
            if(board[i][y]=='B') break;
        }
        for(int i =x;i>=0;i--){
            if(board[i][y]=='p'){
                s++;
                break;
            }
            if(board[i][y]=='B') break;
        }
        for(int j =y;j<8;j++){
            if(board[x][j]=='p'){
                s++;
                break;
            }
            if(board[x][j]=='B') break;
        }
        for(int j =y;j>=0;j--){
            if(board[x][j]=='p'){
                s++;
                break;
            }
            if(board[x][j]=='B') break;
        }
    return s;
    }
}
// @lc code=end

