class Solution {
    public int[][] matrixReshape(int[][] nums, int r, int c) {
        int rows = nums.length;
        int columns = nums[0].length;
        if((rows*columns)!=(r*c))
        return nums;
        int[][] output_array = new int[r][c];
        int row_num =0;
        int column_num =0;
        for(int i =0;i<rows;i++){
            for(int j =0;j<columns;j++) {
                output_array[row_num][column_num] = nums[i][j];
                column_num++;
                if(column_num ==c){
                    column_num=0;
                    row_num++;
                }
            }
        }
        return output_array;
    }
}