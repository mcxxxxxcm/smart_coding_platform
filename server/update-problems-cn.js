const mysql = require('mysql2/promise');

(async () => {
  try {
    const pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '123456',
      database: 'smart_coding_platform'
    });

    // 更新题目名称和描述
    await pool.execute("UPDATE problems SET title = '两数之和', description = '给定一个整数数组 nums 和一个整数目标值 target，请你在该数组中找出和为目标值 target 的那两个整数，并返回它们的数组下标。你可以假设每种输入只会对应一个答案。但是，数组中同一个元素在答案里不能重复出现。', input_format = '第一行：n 和 target，第二行：n 个整数', output_format = '输出两个下标，用空格分隔' WHERE title = 'Two Sum'");
    console.log('Updated Two Sum');

    await pool.execute("UPDATE problems SET title = '反转字符串', description = '编写一个函数，其作用是将输入的字符串反转过来。', input_format = '输入一个字符串', output_format = '输出反转后的字符串' WHERE title = 'Reverse String'");
    console.log('Updated Reverse String');

    await pool.execute("UPDATE problems SET title = '有效的括号', description = '给定一个只包括括号字符的字符串，判断字符串是否有效。有效字符串需满足：左括号必须用相同类型的右括号闭合；左括号必须以正确的顺序闭合；每个右括号都有一个对应的相同类型的左括号。', input_format = '输入一个包含括号的字符串', output_format = '输出 true 或 false' WHERE title = 'Valid Parentheses'");
    console.log('Updated Valid Parentheses');

    await pool.end();
    console.log('All done');
  } catch (error) {
    console.error('Error:', error);
  }
})();
