/*
 * @lc app=leetcode id=412 lang=java
 *
 * [412] Fizz Buzz
 */

// @lc code=start

import java.util.ArrayList;
import java.util.List;

class Solution {
    public List<String> fizzBuzz(int n) {
        //compulsory for getting answer in ["","",""] in such format we use Array list
        List<String> answer = new ArrayList<>();
        //loop will run from 1 to n such that constraints is given 1 <= n <= 104
        for(int i = 1; i <= n; i++) {
            //if i is divisble by both 3 and 5 
            if(i % 3 == 0 && i % 5 == 0) {
                answer.add("FizzBuzz");
                //only divisble by 3
            } else if(i % 3 == 0) {
                answer.add("Fizz");
                //only divisible by 5
            } else if(i % 5 == 0) {
                answer.add("Buzz"); 
            } else {
                //none of them are valid so we will make no changes and return the same string
                answer.add(String.valueOf(i));
            }
        }
        return answer;
    }
}
// @lc code=end

