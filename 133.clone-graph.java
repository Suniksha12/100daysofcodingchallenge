/*
 * @lc app=leetcode id=133 lang=java
 *
 * [133] Clone Graph
 */

// @lc code=start
/*
// Definition for a Node.
class Node {
    public int val;
    public List<Node> neighbors;
    public Node() {
        val = 0;
        neighbors = new ArrayList<Node>();
    }
    public Node(int _val) {
        val = _val;
        neighbors = new ArrayList<Node>();
    }
    public Node(int _val, ArrayList<Node> _neighbors) {
        val = _val;
        neighbors = _neighbors;
    }
}
*/

import java.util.HashMap;

import javafx.scene.Node;

class Solution {
    public void dfs(Node node, HashMap<Node , Node> dict) {
        for(Node nd : node.neighbors) {
            if(!dict.containsKey(nd))
               dict.put(nd, new Node(nd.val));
            dict.get(node).neighbors.add(dict.get(nd));
        }
        for(Node nd: node.neighbors) {
            if(dict.get(nd).neighbors.size()==0)
               dfs(nd,dict);
        }
    }
    public Node cloneGraph(Node node) {
        HashMap<Node,Node> dict = new HashMap<>();
        if(node != null) {
            dict.put(node,new Node(node.val));
            dfs(node,dict);
            return dict.get(node);
        }
        return null;
    }
}
// @lc code=end

