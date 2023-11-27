/*
 * @lc app=leetcode id=57 lang=java
 *
 * [57] Insert Interval
 */

// @lc code=start

import java.util.ArrayList;
import java.util.List;

class Solution {
    public int[][] insert(int[][] intervals, int[] newInterval) {
      List<int[]> result = new ArrayList<>();
      int n = intervals.length;
      for(int i =0;i<n;i++) {
          int[] travel = intervals[i];
          if(travel[1] < newInterval[0]) {
              result.add(travel);
          } else if(travel[0] > newInterval[1]) {
              result.add(newInterval);
              newInterval = travel;
          } else {
              newInterval[0] = Math.min(travel[0],newInterval[0]);
              newInterval[1] = Math.max(travel[1],newInterval[1]);
          }
      }  
      result.add(newInterval);
      return result.toArray(new int[result.size()][]);
    }
}
// @lc code=end

