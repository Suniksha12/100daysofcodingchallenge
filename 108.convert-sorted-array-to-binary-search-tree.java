/*
 * @lc app=leetcode id=108 lang=java
 *
 * [108] Convert Sorted Array to Binary Search Tree
 */

// @lc code=start

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
    public TreeNode sortedArrayToBST(int[] nums) {
      return CreateBST(nums , 0 ,nums.length-1); 
    }   
    /**
     * @param nums
     * @param l
     * @param r
     * @return
     */
    private TreeNode CreateBST(int nums[],int l , int r){
        if(l>r){ //base condition or recursion stoping condition
        return null;

        }
        //in this question we have to convert sorted array to height
        // balanced tree
        // so if we directly create tree in given sorted order it will become linked
        // list
        // so we have to take middle element as head value such it will become height
        // balanced tree
        int mid = l + (r - l) / 2; // this is the formula to find mid value
        TreeNode root = new TreeNode(nums[mid]); // mid value or median
        // assign the value for left of subtree that is l to mid -1 for given array
        root.left = CreateBST(nums, l, mid - 1);  
        // assign the value for right subtree that is mid+1 to r for given array             
        root.right = CreateBST(nums, mid + 1, r);

        return root;
    }    
}
// @lc code=end

