/*
 * @lc app=leetcode id=2844 lang=java
 *
 * [2844] Minimum Operations to Make a Special Number
 */

// @lc code=start
class Solution {
    public int minimumOperations(String num) {
        int len=num.length();
        int ind=num.lastIndexOf("5");
        int ind1=num.lastIndexOf("0");
        int ans=len;
        if(ind1!=-1)
        {
            for(int i=ind1-1;i>=0;i--)
            {
                char c=num.charAt(i);
                if(c=='0' || c=='5')
                {
                    int val=len-(ind1+1);
                    val=val+(ind1-(i+1));
                    ans=Math.min(ans,val);
                }
            }
            ans=Math.min(ans,len-1);
        }
        if(ind!=-1)
        {
            for(int i=ind-1;i>=0;i--)
            {
                char c=num.charAt(i);
                if(c=='2' || c=='7')
                {
                    int val=len-(ind+1);
                    val=val+(ind-(i+1));
                    ans=Math.min(ans,val);
                }
            }
            ans=Math.min(ans,len);
        }
        return Math.min(ans,len);
    }
}
// @lc code=end

