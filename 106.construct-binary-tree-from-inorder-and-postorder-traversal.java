/*
 * @lc app=leetcode id=106 lang=java
 *
 * [106] Construct Binary Tree from Inorder and Postorder Traversal
 */

// @lc code=start

import java.util.HashMap;

import javax.swing.tree.TreeNode;

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
    public TreeNode buildTree(int[] inorder, int[] postorder) {
        Map<Integer , Integer> map = new HashMap<>();
        for(int i = 0;i<inorder.length;i++) {
            map.put(inorder[i],i);
        }
        return helper(inorder, postorder,0,inorder.length - 1,0,postorder.length-1,map);
    }
    private TreeNode helper(int[] inorder, int[] postorder , int inStart , int inEnd,int postStart , int postEnd , Map<Integer , Integer> map) {
        if(inStart > inEnd || postStart > postEnd) return null;

        TreeNode root = new TreeNode(postorder[postEnd]);

        int inRoot = map.get(root.val);

        root.left = helper(inorder,postorder,inStart,inRoot - 1,postStart , postEnd - (inEnd - inRoot)- 1 , map);
        root.right = helper(inorder,postorder,inRoot + 1, inEnd , postEnd-(inEnd - inRoot),postEnd - 1,map);

        return root;
    }
}
// @lc code=end

