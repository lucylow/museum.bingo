import { type AudioLanguage } from './AudioManager';

export interface VoiceMessage {
  key: string;
  defaultText: string;
  translations: Record<AudioLanguage, string>;
  priority: number;
  animation?: 'subtle' | 'normal' | 'celebratory';
}

export const VOICE_MESSAGES: Record<string, VoiceMessage> = {
  welcome: {
    key: 'welcome',
    defaultText: 'Welcome to Museum.Bingo! Point your camera at artworks to complete your bingo card.',
    translations: {
      en: 'Welcome to Museum.Bingo! Point your camera at artworks to complete your bingo card.',
      es: 'Bienvenido a Museum.Bingo. Apunta tu camara a las obras para completar tu carton.',
      fr: 'Bienvenue dans Museum.Bingo. Pointez votre appareil vers les oeuvres pour completer votre carte.',
      de: 'Willkommen bei Museum.Bingo. Richte die Kamera auf Kunstwerke, um die Bingokarte zu fullen.',
      zh: '欢迎来到 Museum.Bingo。将相机对准艺术品，完成你的宾果卡。',
      ar: 'مرحبا بك في Museum.Bingo. وجه الكاميرا نحو الاعمال الفنية لاكمال بطاقة البنغو.',
      ru: 'Добро пожаловать в Museum.Bingo. Наведите камеру на произведения искусства, чтобы заполнить карту.',
    },
    priority: 10,
  },
  scanInstruction: {
    key: 'scanInstruction',
    defaultText: 'Point your camera at an artwork to scan it.',
    translations: {
      en: 'Point your camera at an artwork to scan it.',
      es: 'Apunta tu camara a una obra para escanearla.',
      fr: 'Pointez votre appareil photo vers une oeuvre pour la scanner.',
      de: 'Richte die Kamera auf ein Kunstwerk, um es zu scannen.',
      zh: '将相机对准艺术品进行扫描。',
      ar: 'وجه الكاميرا نحو عمل فني لمسحه.',
      ru: 'Наведите камеру на произведение искусства, чтобы отсканировать его.',
    },
    priority: 5,
  },
  tileValidated: {
    key: 'tileValidated',
    defaultText: 'Tile validated. {points} points earned.',
    translations: {
      en: 'Tile validated. {points} points earned.',
      es: 'Casilla validada. {points} puntos ganados.',
      fr: 'Case validee. {points} points gagnes.',
      de: 'Feld bestaetigt. {points} Punkte erhalten.',
      zh: '格子已验证。获得 {points} 分。',
      ar: 'تم التحقق من المربع. تم كسب {points} نقطة.',
      ru: 'Ячейка подтверждена. Получено {points} очков.',
    },
    priority: 8,
  },
  streakBonus: {
    key: 'streakBonus',
    defaultText: 'Streak bonus. {streak} in a row. {bonus} extra points.',
    translations: {
      en: 'Streak bonus. {streak} in a row. {bonus} extra points.',
      es: 'Bonus por racha. {streak} seguidas. {bonus} puntos extra.',
      fr: 'Bonus de serie. {streak} de suite. {bonus} points supplementaires.',
      de: 'Serienbonus. {streak} in Folge. {bonus} Extrapunkte.',
      zh: '连胜奖励。连续 {streak} 次。额外 {bonus} 分。',
      ar: 'مكافاة سلسلة. {streak} على التوالي. {bonus} نقطة اضافية.',
      ru: 'Бонус за серию. {streak} подряд. Дополнительно {bonus} очков.',
    },
    priority: 9,
    animation: 'normal',
  },
  lineComplete: {
    key: 'lineComplete',
    defaultText: 'Line complete. You earned a {points} point bonus.',
    translations: {
      en: 'Line complete. You earned a {points} point bonus.',
      es: 'Linea completa. Ganaste un bonus de {points} puntos.',
      fr: 'Ligne completee. Vous avez gagne un bonus de {points} points.',
      de: 'Linie vollstaendig. Du hast {points} Bonuspunkte erhalten.',
      zh: '连线完成。你获得了 {points} 分奖励。',
      ar: 'اكتمل الخط. ربحت مكافاة قدرها {points} نقطة.',
      ru: 'Линия завершена. Вы получили бонус {points} очков.',
    },
    priority: 10,
    animation: 'celebratory',
  },
  bingoWin: {
    key: 'bingoWin',
    defaultText: 'Bingo. Congratulations. You earned {points} points.',
    translations: {
      en: 'Bingo. Congratulations. You earned {points} points.',
      es: 'Bingo. Felicidades. Ganaste {points} puntos.',
      fr: 'Bingo. Felicitations. Vous avez gagne {points} points.',
      de: 'Bingo. Glueckwunsch. Du hast {points} Punkte erhalten.',
      zh: '宾果。恭喜。你获得了 {points} 分。',
      ar: 'بنغو. تهانينا. ربحت {points} نقطة.',
      ru: 'Бинго. Поздравляем. Вы заработали {points} очков.',
    },
    priority: 10,
    animation: 'celebratory',
  },
  hintProvided: {
    key: 'hintProvided',
    defaultText: 'Hint: {hintText}',
    translations: {
      en: 'Hint: {hintText}',
      es: 'Pista: {hintText}',
      fr: 'Indice: {hintText}',
      de: 'Hinweis: {hintText}',
      zh: '提示：{hintText}',
      ar: 'تلميح: {hintText}',
      ru: 'Подсказка: {hintText}',
    },
    priority: 6,
    animation: 'subtle',
  },
  oneAway: {
    key: 'oneAway',
    defaultText: 'You are one tile away from completing a line.',
    translations: {
      en: 'You are one tile away from completing a line.',
      es: 'Estas a una casilla de completar una linea.',
      fr: 'Vous etes a une case de completer une ligne.',
      de: 'Du bist nur ein Feld von einer vollstaendigen Linie entfernt.',
      zh: '你还差一个格子就能完成连线。',
      ar: 'انت على بعد مربع واحد من اكمال خط.',
      ru: 'Вы в одной ячейке от завершения линии.',
    },
    priority: 7,
    animation: 'normal',
  },
  badgeUnlocked: {
    key: 'badgeUnlocked',
    defaultText: 'New badge unlocked: {badgeName}.',
    translations: {
      en: 'New badge unlocked: {badgeName}.',
      es: 'Nueva insignia desbloqueada: {badgeName}.',
      fr: 'Nouveau badge debloque: {badgeName}.',
      de: 'Neues Abzeichen freigeschaltet: {badgeName}.',
      zh: '解锁新徽章：{badgeName}。',
      ar: 'تم فتح شارة جديدة: {badgeName}.',
      ru: 'Новый значок разблокирован: {badgeName}.',
    },
    priority: 9,
    animation: 'celebratory',
  },
  scanError: {
    key: 'scanError',
    defaultText: 'Could not recognize this artwork. Try moving closer or adjusting the angle.',
    translations: {
      en: 'Could not recognize this artwork. Try moving closer or adjusting the angle.',
      es: 'No se pudo reconocer la obra. Acercate o ajusta el angulo.',
      fr: 'Impossible de reconnaitre l oeuvre. Rapprochez vous ou changez l angle.',
      de: 'Dieses Kunstwerk konnte nicht erkannt werden. Geh naeher heran oder veraendere den Winkel.',
      zh: '无法识别此艺术品。请靠近或调整角度。',
      ar: 'تعذر التعرف على هذا العمل الفني. اقترب او عدل الزاوية.',
      ru: 'Не удалось распознать произведение искусства. Подойдите ближе или измените угол.',
    },
    priority: 4,
    animation: 'subtle',
  },
  lowLight: {
    key: 'lowLight',
    defaultText: 'Low light detected. Try moving to a brighter area or using your phone flash.',
    translations: {
      en: 'Low light detected. Try moving to a brighter area or using your phone flash.',
      es: 'Se detecto poca luz. Ve a una zona mas iluminada o usa el flash.',
      fr: 'Faible luminosite detectee. Allez vers une zone plus eclairee ou utilisez le flash.',
      de: 'Wenig Licht erkannt. Gehe in einen helleren Bereich oder nutze den Blitz.',
      zh: '检测到光线不足。请前往更亮区域或使用闪光灯。',
      ar: 'تم اكتشاف اضاءة منخفضة. انتقل الى مكان اكثر سطوعا او استخدم الفلاش.',
      ru: 'Обнаружено низкое освещение. Перейдите в более светлое место или используйте вспышку.',
    },
    priority: 4,
    animation: 'subtle',
  },
};

export function formatMessage(
  message: VoiceMessage,
  language: AudioLanguage,
  variables: Record<string, string | number> = {},
): string {
  let text = message.translations[language] ?? message.defaultText;
  for (const [key, value] of Object.entries(variables)) {
    text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return text;
}
