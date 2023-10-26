/*
 * @lc app=leetcode id=257 lang=java
 *
 * [257] Binary Tree Paths
 */

// @lc code=start

import java.util.ArrayList;
import java.util.List;

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
    List<String> list = new ArrayList<>();
    public List<String> binaryTreePaths(TreeNode root) {
         binaryTreePaths(root,"");
         return list;
         }
    public void binaryTreePaths(TreeNode root,String str){
        if(root == null) return;

        str +=root.val+"->";

        binaryTreePaths(root.left,str);
        binaryTreePaths(root.right,str);

        if(root.left==null && root.right==null) list.add(str.substring(0,str.length()-2));
        return;
    }
    }
// @lc code=end

