import { Bot } from 'grammy';
import { MyContext } from '../types/session';
import { registerStartCommand } from './start';

/**
 * Register essential bot commands - main navigation via reply keyboard buttons
 */
export function registerCommands(bot: Bot<MyContext>): void {
  // Register only essential commands
  registerStartCommand(bot);

  // Set minimal command menu - most navigation via reply keyboard
  bot.api.setMyCommands([{ command: 'start', description: 'Start GameKey Store' }]);
}
