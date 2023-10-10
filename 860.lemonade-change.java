/*
 * @lc app=leetcode id=860 lang=java
 *
 * [860] Lemonade Change
 */

// @lc code=start
class Solution {
    public boolean lemonadeChange(int[] bills) {
        int count5=0;
        int count10=0;
        for(int bill :bills){
            if(bill==5) count5 += 5;
            else if(bill == 10){
                if(count5>=5){
                    count5-=5;
                    count10+=10;
                }else return false;
            }else {
                if(count5>=5 && count10>=10){
                    count5-=5;
                    count10-=10;

                }else if(count5>=15){
                    count5-=15;
                }
                else return false;
            }
        }
        return true;
    }
}
// @lc code=end

