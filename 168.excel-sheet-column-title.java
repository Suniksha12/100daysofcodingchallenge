/*
 * @lc app=leetcode id=168 lang=java
 *
 * [168] Excel Sheet Column Title
 */

// @lc code=start
class Solution {
    public String convertToTitle(int colum) {
        String res="";
        while(colum>0){
            colum--;
            int val=colum%26;
            val+=65;
            res=((char)val+"")+""+res; // ->>reverse the string
            colum=colum/26;
            
           
        }
       
        return res;
        
    }
}
// @lc code=end

