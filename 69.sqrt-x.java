/*
 * @lc app=leetcode id=69 lang=java
 *
 * [69] Sqrt(x)
 */

// @lc code=start
class Solution {
    public int mySqrt(int x) {
        // sqaure roont of 0 and 1 is 0 , 1 repectively 
        if (x<2)
            return x;
        int start = 1;
        int end = x;
        int mid = -1;

        while (start <= end) {
             mid = start + (end - start) / 2;

            if ((long) mid * mid > (long) x)
                end = mid - 1;
            else if (mid * mid == x)
                return mid;
            else
                start = mid + 1;
        }
        return Math.round(end);
    }
}
// @lc code=end

