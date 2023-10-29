/*
 * @lc app=leetcode id=661 lang=java
 *
 * [661] Image Smoother
 */

// @lc code=start
class Solution {
    public int[][] imageSmoother(int[][] img) {
        int m = img.length;
        int n = img[0].length;
        int[][] ans = new int[m][n];

        for(int i=0;i<m; i++){
            for(int j =0; j<n; j++){
                int tempSum =0;
                int count =0;
                if(i>0 || i<m-1){
                    if(i>0){
                        tempSum += img[i-1][j];
                        count++;
                    }
                    if(i<m-1){
                        tempSum += img[i+1][j];
                        count++;
                    }
                }
                if(j>0 || j<n-1){
                    if(j>0){
                        tempSum += img[i][j-1];
                        count++;
                    }
                    if(j<n-1){
                        tempSum += img[i][j+1];
                        count++;
                    }
                }
                if(i>0&& j>0){
                    tempSum +=img[i-1][j-1];
                    count++;
                }
                if(i<m-1&& j>0){
                    tempSum +=img[i+1][j-1];
                    count++;
                }
                if(j<n-1&& i>0){
                    tempSum +=img[i-1][j+1];
                    count++;
                }
                if(j<n-1&& i<m-1){
                    tempSum +=img[i+1][j+1];
                    count++;
                }
                count++;
                tempSum+= img[i][j];
               // System.out.print( " "+ count + " " + tempSum + ",");
                ans[i][j] = tempSum/count;
                
            }
           // System.out.println();
        }
        return ans;
        
    }
}
// @lc code=end

