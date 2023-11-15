/*
 * @lc app=leetcode id=49 lang=java
 *
 * [49] Group Anagrams
 */

// @lc code=start

import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {
       List<List<String>> result = new ArrayList<>();
       HashMap<String,List<String>> map = new HashMap<>();
       
       for(String word:strs) {
        char[] charArray = word.toCharArray();

        Arrays.sort(charArray);

        String sortedWord = String.valueOf(charArray);

        if(!map.containsKey(sortedWord)) {
            map.put(sortedWord,new ArrayList<>());
        }
        map.get(sortedWord).add(word);
       }
       result.addAll(map.values());
       return result;
    }
}
// @lc code=end

