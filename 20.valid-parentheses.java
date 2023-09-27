/*
 * @lc app=leetcode id=20 lang=java
 *
 * [20] Valid Parentheses
 */

// @lc code=start

import java.util.Stack;

class Solution {
    public boolean isValid(String s) {
        //creating an empty stack for proper maintaineance of order
     Stack <Character> stack = new Stack<>();
     
     for(char x : s.toCharArray()){ //loop through each character in the string
        //performing the instructions as per given in the question looking for opening and closing brackets.
         if(x=='('){
             stack.push(')');
         } else if(x=='['){
             stack.push(']');
         } else if (x=='{'){
             stack.push('}');
         } else if(stack.isEmpty() || stack.pop()!=x){
             //if the stack is found to be empty or the string is not matching to opening or closing bracket then the string is not valid hence returning false.
             return false;
         }
     }
     return stack.isEmpty();
    }
}
// @lc code=end

