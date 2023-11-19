/*
 * @lc app=leetcode id=103 lang=java
 *
 * [103] Binary Tree Zigzag Level Order Traversal
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
    // declare boolean value to trace zig zag facing
    boolean leftToRight = true;
    // declare list to hold answer
    List<List<Integer>> list = new ArrayList();
    public List<List<Integer>> zigzagLevelOrder(TreeNode root) {
        // check if we have not root:
        if(root == null) {
            // return empty list
            return list;
        }
        // declare queue
        Queue<TreeNode> que = new LinkedList();
        // add root to queue
        que.add(root);
        // do breadth first search until queu is not empty
        while(!que.isEmpty()) {
            // get current level length
            int len = que.size();
            // declare inner level list
            List<Integer> inner = new ArrayList();
            // iterate over nodes of current level
            for(int i = 0; i < len; i++) {
                // remove node from queue
                TreeNode node = que.remove();
                // check if node not equals null
                if(node != null) {
                    // if zigzag from left to rightL
                    if(leftToRight) {
                        // add node value from start of list
                        inner.add(0, node.val); 
                    } else {
                        // else add them at the end
                        inner.add(node.val);
                    }
                    // if node have left node:
                    if(node.right != null) {
                        // add left node to queue
                        que.add(node.right);
                    } 
                    // if node have right node:
                    if(node.left != null) {
                        // add right node to queue
                        que.add(node.left);
                    }
                }
            }
            // inverse zigzag facing
            leftToRight = !leftToRight;
            // add inner level list to result list
            list.add(inner);
        }
        // return list
        return list;
    }
}
// @lc code=end

