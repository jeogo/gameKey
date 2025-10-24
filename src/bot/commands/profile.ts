import { MyContext } from '../types/session';
import * as UserRepository from '../../repositories/UserRepository';
import * as OrderRepository from '../../repositories/OrderRepository';
import { createBackKeyboard } from '../keyboards/persistentKeyboard';
import { formatMessage } from '../../config/botConfig';

/**
 * 👤 Professional User Profile Display
 * Enhanced with professional styling and comprehensive account overview
 */
async function showProfile(ctx: MyContext): Promise<void> {
  try {
    if (!ctx.from) return;

    // 🔍 Verify user account status
    const user = await UserRepository.findUserByTelegramId(ctx.from.id);

    if (!user) {
      await ctx.reply(
        `🔒 **Account Not Found**\n\n⚠️ Please use /start to create your VIP account first.\n\n🚀 **Quick Setup:** Takes only 30 seconds!`
      );
      return;
    }

    // 📊 Calculate professional account statistics
    const ordersResult = await OrderRepository.findOrdersByUserId(user._id!);
    const orders = ordersResult.orders;
    const completedOrders = orders.filter(
      order => order.status === 'delivered' || order.status === 'paid'
    );
    const totalSpent = completedOrders.reduce(
      (total, order) => total + (order.totalAmount || 0),
      0
    );

    // 🎨 Professional join date formatting
    const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // 🌟 Create VIP profile message with enhanced styling
    const profileMessage =
      formatMessage('PROFILE_HEADER') +
      formatMessage('PROFILE_INFO', {
        username: user.username || ctx.from.first_name || 'VIP Member',
        joinDate: joinDate,
        totalOrders: completedOrders.length.toString(),
        totalSpent: `$${totalSpent.toFixed(2)} USD`,
      });

    // Send simple profile message
    await ctx.reply(profileMessage, {
      reply_markup: createBackKeyboard(),
    });
  } catch (error) {
    console.error('Error showing profile:', error);
    await ctx.reply(formatMessage('ERROR_GENERIC'), { reply_markup: createBackKeyboard() });
  }
}

export { showProfile };
