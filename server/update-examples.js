const mysql = require('mysql2/promise');

(async () => {
  try {
    const pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '123456',
      database: 'smart_coding_platform'
    });

    // 更新题目 1 - 两数之和
    const desc1 = `给定一个整数数组 \`nums\` 和一个整数目标值 \`target\`，请你在该数组中找出 **和为目标值 target** 的那两个整数，并返回它们的数组下标。

> **注意**：你可以假设每种输入只会对应一个答案。但是，数组中同一个元素在答案里不能重复出现。

---

### 📥 输入格式

- **第一行**：包含两个整数 \`n\` 和 \`target\`，表示数组长度和目标值
- **第二行**：包含 \`n\` 个整数，表示数组元素

### 📤 输出格式

输出两个整数，表示两个元素的下标（从 0 开始），用空格分隔。

---

### 📝 示例 1

**输入：**
\`\`\`
4 9
2 7 11 15
\`\`\`

**输出：**
\`\`\`
0 1
\`\`\`

> **解释**：\`nums[0] + nums[1] = 2 + 7 = 9\`，因此返回下标 \`[0, 1]\`

### 📝 示例 2

**输入：**
\`\`\`
3 6
3 2 4
\`\`\`

**输出：**
\`\`\`
1 2
\`\`\`

> **解释**：\`nums[1] + nums[2] = 2 + 4 = 6\`，因此返回下标 \`[1, 2]\``;

    await pool.execute(
      `UPDATE problems SET description = ? WHERE title = '两数之和'`,
      [desc1]
    );
    console.log('Updated 两数之和');

    // 更新题目 2 - 反转字符串
    const desc2 = `编写一个函数，其作用是将 **输入的字符串反转过来**。

---

### 📥 输入格式

输入一行字符串。

### 📤 输出格式

输出反转后的字符串。

---

### 📝 示例 1

**输入：**
\`\`\`
hello
\`\`\`

**输出：**
\`\`\`
olleh
\`\`\`

### 📝 示例 2

**输入：**
\`\`\`
world
\`\`\`

**输出：**
\`\`\`
dlrow
\`\`\``;

    await pool.execute(
      `UPDATE problems SET description = ? WHERE title = '反转字符串'`,
      [desc2]
    );
    console.log('Updated 反转字符串');

    // 更新题目 3 - 有效的括号
    const desc3 = `给定一个只包括括号字符的字符串，判断字符串是否 **有效**。

**有效字符串需满足：**

1. 左括号必须用相同类型的右括号闭合
2. 左括号必须以正确的顺序闭合
3. 每个右括号都有一个对应的相同类型的左括号

> 括号类型包括：\`()\`、\`[]\`、\`{}\`

---

### 📥 输入格式

输入一行包含括号的字符串。

### 📤 输出格式

如果字符串有效，输出 \`true\`；否则输出 \`false\`。

---

### 📝 示例 1

**输入：**
\`\`\`
()[]{}
\`\`\`

**输出：**
\`\`\`
true
\`\`\`

> **解释**：所有括号都正确匹配

### 📝 示例 2

**输入：**
\`\`\`
([)]
\`\`\`

**输出：**
\`\`\`
false
\`\`\`

> **解释**：括号没有按正确顺序闭合`;

    await pool.execute(
      `UPDATE problems SET description = ? WHERE title = '有效的括号'`,
      [desc3]
    );
    console.log('Updated 有效的括号');

    await pool.end();
    console.log('All done');
  } catch (error) {
    console.error('Error:', error);
  }
})();
