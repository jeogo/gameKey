import { Keyboard } from "grammy";

/**
 * Creates a persistent keyboard menu that stays at the bottom of the chat
 */
export function createMainMenu(): Keyboard {
  return new Keyboard()
    .text("🛍️ Products").text("🧾 My Orders").row()
    .text("ℹ️ Help").text("📞 Support").row()
    .text("🏠 Main Menu")
    .resized();
}

/**
 * Creates a keyboard for removing the persistent menu
 */
export function createHideKeyboardMarkup(): { remove_keyboard: true } {
  return { remove_keyboard: true };
}
