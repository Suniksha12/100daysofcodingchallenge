/*
 * @lc app=leetcode id=2848 lang=java
 *
 * [2848] Points That Intersect With Cars
 */

// @lc code=start

import java.util.List;

class Solution {
    public int numberOfPoints(List<List<Integer>> nums) {
        //counter is intialized as zero as it will help us count that a point has a car on it or not.
        int count=0;
        //given in the constraints that 1 <= nums.length <= 100 so we choose an extra space 
        int[] points = new int[101];
        //this function is a builtin function for loop going till the end of nums
        for(List<Integer> list : nums){
            //we will start from the point
            int start = list.get(0);
            int end = list.get(1);
            //after starting adn ending we will run a loop from start till the end
            for(int i =start;i<=end;i++)
            {
                points[i]++;

            }   
        }
          for (int point :points){
              //if the point is not equal to zero we will kep on counting.
              if(point!=0){
                  count++;
              }
          }
          // and yes we get the answer as count as how many intersecting points are there.
          return count;        
    }
}
// @lc code=end

