const { User, TokenTransaction } = require('../models');
const { addTokens, DEFAULT_REGISTER_TOKENS } = require('../controllers/tokenController');

const updateExistingUsers = async () => {
  try {
    console.log('开始更新现有用户的token余额...');
    
    const usersWithoutTokens = await User.findAll({
      where: {
        tokenBalance: 0
      }
    });

    console.log(`找到 ${usersWithoutTokens.length} 个需要更新的用户`);

    for (const user of usersWithoutTokens) {
      try {
        await addTokens(
          user.id,
          'REGISTER_BONUS',
          DEFAULT_REGISTER_TOKENS,
          '系统补发注册奖励tokens',
          { retroactive: true, updateDate: new Date() }
        );
        
        console.log(`✅ 已为用户 ${user.username} (${user.email}) 添加 ${DEFAULT_REGISTER_TOKENS} tokens`);
      } catch (error) {
        console.error(`❌ 为用户 ${user.username} 添加tokens失败:`, error.message);
      }
    }

    console.log('✅ 现有用户token余额更新完成！');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 更新现有用户token余额失败:', error);
    process.exit(1);
  }
};

updateExistingUsers();