/*
 * @lc app=leetcode id=117 lang=java
 *
 * [117] Populating Next Right Pointers in Each Node II
 */

// @lc code=start
/*
// Definition for a Node.
class Node {
    public int val;
    public Node left;
    public Node right;
    public Node next;

    public Node() {}
    
    public Node(int _val) {
        val = _val;
    }

    public Node(int _val, Node _left, Node _right, Node _next) {
        val = _val;
        left = _left;
        right = _right;
        next = _next;
    }
};
*/

class Solution {
    private boolean hasChildren(Node node) {
        return node.left != null || node.right != null;
    }
    private Node getNextParent(Node root) {
        Node next = root.next;
        while(next != null && !hasChildren(next)) next = next.next;
        return next;
    }
    private void connectCousins(Node root) {
        if(!hasChildren(root)) return;
        Node nextParent = getNextParent(root);
        if(nextParent == null) return;

        Node rootChild = root.right == null ? root.left : root.right;
        Node nextChild = nextParent.left == null ? nextParent.right : nextParent.left;
        if(rootChild != null) rootChild.next = nextChild;
        connectCousins(nextParent);
    }
    private void traverse(Node root) {
        if(root == null) return;
        if(root.left != null && root.left.next == null || root.right != null && root.right.next == null) connectCousins(root);
        traverse(root.left);
        traverse(root.right);
    }
    private void connectChildren(Node root) {
        if(root == null) return;
        if(root.left != null && root.right != null) root.left.next = root.right;
        connectChildren(root.left);
        connectChildren(root.right);
    }
    public Node connect(Node root) {
        connectChildren(root);
        traverse(root);
        return root;
    }
}
// @lc code=end

