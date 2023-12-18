/*
 * @lc app=leetcode id=173 lang=java
 *
 * [173] Binary Search Tree Iterator
 */

// @lc code=start
/**
 * Definition for a binary tree node.
 * public class TreeNode {
 *     int val;
 *     TreeNode left;
 *     TreeNode right;
 *     TreeNode() {}
 *     TreeNode(int val) { this.val = val; }
 *     TreeNode(int val, TreeNode left, TreeNode right) {
 *         this.val = val;
 *         this.left = left;
 *         this.right = right;
 *     }
 * }
 */
class BSTIterator {
     TreeNode temp;
     Stack<TreeNode> stk = new Stack<>();
    public BSTIterator(TreeNode root) {
        this.temp = root;
    }
    
    public int next() {
        int var =0;
        while(true) {
            if(temp != null) {
                stk.push(temp);
                temp = temp.left;
            } else if(stk.isEmpty() && temp == null) {
                break;
            } else {
                temp = stk.isEmpty() ? null : stk.pop();
                if(temp != null) var = temp.val;
                temp = temp.right;
                break;
            }
        }
        return var;
    }
    
    public boolean hasNext() {
       return temp != null || (temp == null && !stk.isEmpty()); 
    }
}
/**
 * Your BSTIterator object will be instantiated and called as such:
 * BSTIterator obj = new BSTIterator(root);
 * int param_1 = obj.next();
 * boolean param_2 = obj.hasNext();
 */
// @lc code=end

