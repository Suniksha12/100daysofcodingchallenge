/*
 * @lc app=leetcode id=199 lang=java
 *
 * [199] Binary Tree Right Side View
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
    int maxlevel = 0;
    public List<Integer> rightSideView(TreeNode root) {
        List<Integer> list = new ArrayList<>();
        right(root,1,list);
        return list;
    }
    void right(TreeNode root, int level , List<Integer> list) {
        if(root==null) {
            return;
        }
        if(maxlevel<level) {
            list.add(root.val);
            maxlevel = level;
        }
        right(root.right,level+1,list);
        right(root.left,level+1,list);
    }
}
// @lc code=end

