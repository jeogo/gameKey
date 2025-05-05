import { Bot } from "grammy";
import { MyContext } from "../types/session";

export function registerAdminHandlers(bot: Bot<MyContext>): void {
  // تم تعطيل جميع أوامر القبول والرفض وقائمة الانتظار لأن التسجيل تلقائي
}
