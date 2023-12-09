/*
 * @lc app=leetcode id=129 lang=java
 *
 * [129] Sum Root to Leaf Numbers
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
class Solution {
    int result = 0;
    public void sum(TreeNode root, int num) {
        if(root == null) return;
        num = root.val + (10*num);

        if(root.left == null && root.right==null) {
            result += num;
        }
        sum(root.left,num);
        sum(root.right,num);
    }
    public int sumNumbers(TreeNode root) {
        sum(root,0);
        return result;
    }
}
// @lc code=end

