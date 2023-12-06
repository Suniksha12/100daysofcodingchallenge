/*
 * @lc app=leetcode id=113 lang=java
 *
 * [113] Path Sum II
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
    public List<List<Integer>> pathSum(TreeNode root, int targetSum) {
        List<List<Integer>> res=new ArrayList<>();
        List<Integer> ls=new ArrayList<>();
        helper(root,targetSum,ls,res);
        return res;
    }

    void helper(TreeNode root,int sum,List<Integer> ls,List<List<Integer>> res) {
        if(root==null) return;
        
        ls.add(root.val);
        
        if(root.val==sum && root.left==null && root.right==null) {
            res.add(new ArrayList<>(ls));
        }


        helper(root.left,sum-root.val,ls,res);
        helper(root.right,sum-root.val,ls,res);
        ls.remove(ls.size()-1);
    }
}
// @lc code=end

