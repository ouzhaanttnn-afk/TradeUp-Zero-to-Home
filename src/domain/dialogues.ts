import type { BuyerType, SellerKind } from "./models";
import type { Language } from "../i18n";

export type SellerDialogueContext = "greeting" | "inspected" | "counter" | "sold";
export type BuyerDialogueContext = "initial" | "counter" | "accept";

const sellerQuotes: Record<
  SellerKind,
  Record<SellerDialogueContext, Record<Language, string>>
> = {
  urgent: {
    greeting: {
      tr: "Kardeşim acil nakit lazım, bugün alırsan bu fiyata bırakırım!",
      en: "Need fast cash today, take it or leave it!",
      de: "Brauche heute dringend Bargeld, nimm es oder lass es!",
      es: "¡Necesito dinero rápido hoy, tómalo o déjalo!",
    },
    inspected: {
      tr: "Vaktim az, hemen karar ver de kapatalım bu işi.",
      en: "I'm in a rush, decide quickly and let's close the deal.",
      de: "Wenig Zeit, entscheide dich schnell für den Deal.",
      es: "Tengo prisa, decide rápido y cerramos el trato.",
    },
    counter: {
      tr: "Zaten dip fiyattayım ama nakit hatırına son bir güzellik yaptım.",
      en: "I'm already at rock bottom, but for cash in hand, one final discount.",
      de: "Bin schon am Limit, aber für Barzahlung ein allerletzter Rabatt.",
      es: "Ya estoy al mínimo, pero por efectivo en mano, último descuento.",
    },
    sold: {
      tr: "Hayırlı olsun, ilaç gibi geldi bu para.",
      en: "Pleasure doing business, needed this cash badly.",
      de: "Gute Geschäfte, das Geld kommt wie gerufen.",
      es: "Un placer hacer negocios, necesitaba mucho este dinero.",
    },
  },
  merchant: {
    greeting: {
      tr: "Piyasanın en temiz malı, tek kuruş inmem ama hayrını gör.",
      en: "Top grade goods on the market, firm price, enjoy it.",
      de: "Beste Ware auf dem Markt, Festpreis, viel Freude damit.",
      es: "El mejor artículo del mercado, precio firme, que lo disfrutes.",
    },
    inspected: {
      tr: "İstediğin testten geçer, malımın sonuna kadar arkasındayım.",
      en: "Passes any inspection, I stand by my goods 100%.",
      de: "Besteht jede Prüfung, ich stehe voll hinter der Ware.",
      es: "Pasa cualquier prueba, respondo al 100% por mi producto.",
    },
    counter: {
      tr: "Dükkanda kuraldır; ufak bir esnaf indirimi yaptım, fazlası kurtarmaz.",
      en: "Shop rule: small trader courtesy discount, cannot go lower.",
      de: "Händlerehre: kleiner Rabatt gewährt, tiefer rechnet es sich nicht.",
      es: "Cortesía comercial: pequeño descuento aplicado, no puedo bajar más.",
    },
    sold: {
      tr: "Bereket versin, müşterisi bol olsun.",
      en: "Deal sealed, happy trading with you.",
      de: "Handel besiegelt, gute Geschäfte weiterhin.",
      es: "Trato cerrado, que tengas excelentes ventas.",
    },
  },
  emotional: {
    greeting: {
      tr: "Gözüm gibi baktım, değerini bilecek birine gitsin isterim.",
      en: "Heirloom piece, I want it to go to someone who cares.",
      de: "Wie meinen Augapfel gehütet, soll in gute Hände kommen.",
      es: "Lo cuidé como un tesoro, quiero que vaya a buenas manos.",
    },
    inspected: {
      tr: "Tek bir çiziği bile hikaye; zamanında özenle seçmiştim.",
      en: "Every tiny detail has memories; selected with great care.",
      de: "Jedes Detail trägt Erinnerungen, damals mit Sorgfalt gewählt.",
      es: "Cada detalle tiene recuerdos, lo elegí con mucho cariño.",
    },
    counter: {
      tr: "Veda etmek zor ama hatırına ufak bir adım atıyorum.",
      en: "Hard to let go, but I'll make a small concession for you.",
      de: "Schwer loszulassen, aber ich komme dir einen Schritt entgegen.",
      es: "Cuesta despedirse, pero haré una pequeña concesión por ti.",
    },
    sold: {
      tr: "İyi günlerde kullan, ona iyi bak.",
      en: "Use it in good health, take good care of it.",
      de: "Nutze es mit Freude und pass gut darauf auf.",
      es: "Disfrútalo con salud y cuídalo mucho.",
    },
  },
  uninformed: {
    greeting: {
      tr: "Evde yer kaplıyordu, kaç para eder pek anlamam.",
      en: "Taking up space in the attic, not sure what it's worth.",
      de: "Stand nur im Weg, kenne den genauen Marktwert nicht.",
      es: "Ocupaba espacio en casa, no sé bien cuánto vale.",
    },
    inspected: {
      tr: "Göründüğü gibi işte, ben de kutusundan yeni çıkardım.",
      en: "It is what it is, just took it out of storage.",
      de: "So wie auf den Bildern, habe es gerade aus dem Schrank geholt.",
      es: "Es lo que se ve, lo acabo de sacar del armario.",
    },
    counter: {
      tr: "Arkadaşlar bu fiyattan aşağı verme dedi, ortası olsun.",
      en: "Friends told me not to give it away, let's meet in the middle.",
      de: "Freunde sagten, nicht verschenken; einigen wir uns in der Mitte.",
      es: "Mis amigos me dijeron que no lo regale, busquemos un término medio.",
    },
    sold: {
      tr: "Güzel oldu, yer açılmış oldu.",
      en: "Glad that's sorted, cleared some nice space.",
      de: "Gut geklappt, endlich wieder Platz daheim.",
      es: "Genial, por fin tengo espacio libre en casa.",
    },
  },
  risky: {
    greeting: {
      tr: "Garantisi yok ama canavar gibi çalışıyor, kaçırma derim.",
      en: "No warranty, but runs like a beast, don't miss out.",
      de: "Keine Garantie, aber läuft wie eine Eins, greif zu.",
      es: "Sin garantía, pero funciona como una bestia, no te lo pierdas.",
    },
    inspected: {
      tr: "Çok kurcalama usta, alıyorsan al, başkası da soruyor.",
      en: "Don't overthink it, buy or pass, other buyers are waiting.",
      de: "Nicht lange grübeln, nimm es oder der Nächste kriegt es.",
      es: "No le des vueltas, tómalo o el siguiente se lo lleva.",
    },
    counter: {
      tr: "Son fiyatım bu, işine gelirse.",
      en: "Final offer, take it or leave it.",
      de: "Mein letztes Wort, nimm es oder lass es.",
      es: "Mi último precio, si te conviene bien.",
    },
    sold: {
      tr: "Kaptın temiz malı, arkana bakma.",
      en: "You scored a bargain, don't look back.",
      de: "Schnäppchen gemacht, bereue nichts.",
      es: "Te llevaste una ganga, no mires atrás.",
    },
  },
  expert: {
    greeting: {
      tr: "Tüm bakımları eksiksiz yapıldı, piyasa değerini biliyorum.",
      en: "Fully serviced and tested, priced accurately to the market.",
      de: "Vollständig gewartet, marktgerecht und fair bepreist.",
      es: "Totalmente revisado y probado, precio justo de mercado.",
    },
    inspected: {
      tr: "Tüm belgeleri ve kanıtları net, şeffaf ticaret.",
      en: "Every evidence is transparent, no hidden surprises.",
      de: "Alle Nachweise transparent, keine bösen Überraschungen.",
      es: "Todas las evidencias son claras, cero sorpresas.",
    },
    counter: {
      tr: "Kondisyon ve emsal analizi ortada; makul bir esneme yaptım.",
      en: "Condition and comp values are clear; adjusted reasonably.",
      de: "Zustand und Vergleichswerte sprechen für sich; maßvoll angepasst.",
      es: "El estado y las referencias son claras; ajustado razonablemente.",
    },
    sold: {
      tr: "Bilinçli bir alıcıyla ticaret yapmak keyifti.",
      en: "Pleasure dealing with an educated buyer.",
      de: "Angenehm, mit einem sachkundigen Käufer zu handeln.",
      es: "Un placer hacer negocios con un comprador entendido.",
    },
  },
};

const buyerQuotes: Record<
  BuyerType,
  Record<BuyerDialogueContext, Record<Language, string>>
> = {
  QUICK: {
    initial: {
      tr: "Hemen elden nakit alayım, akşam 7'de teslim alırım.",
      en: "Cash in hand today, I can pick it up by 7 PM.",
      de: "Barzahlung heute, kann es bis 19 Uhr abholen.",
      es: "Efectivo en mano hoy, paso a recogerlo a las 7.",
    },
    counter: {
      tr: "Hızlı teslimat için son teklifim budur, el sıkışalım.",
      en: "For immediate same-day pickup, here is my firm offer.",
      de: "Für sofortige Abholung heute mein finales Angebot.",
      es: "Para entrega inmediata hoy, esta es mi oferta final.",
    },
    accept: {
      tr: "Harika! Adresi yaz, hemen yola çıkıyorum.",
      en: "Awesome! Send the address, heading over now.",
      de: "Super! Schick die Adresse, mache mich auf den Weg.",
      es: "¡Genial! Pásame la dirección, voy para allá.",
    },
  },
  QUALITY: {
    initial: {
      tr: "Kondisyonu ve temizliği fotoğraftaki gibiyse teklifim budur.",
      en: "If condition and cleanliness match the photos, here is my offer.",
      de: "Wenn Zustand und Sauberkeit wie auf den Fotos sind, biete ich das.",
      es: "Si el estado y la limpieza coinciden con las fotos, esta es mi oferta.",
    },
    counter: {
      tr: "Kusursuz parça arıyorum; kondisyonuna güveniyorsan ortada buluşalım.",
      en: "Looking for prime condition; if confident, let's meet halfway.",
      de: "Suche Top-Zustand; wenn du sicher bist, treffen wir uns in der Mitte.",
      es: "Busco calidad impecable; si confías en el estado, negociemos a medias.",
    },
    accept: {
      tr: "Anlaştık, tam aradığım kalitede bir ürün.",
      en: "Agreed, exactly the quality standard I was looking for.",
      de: "Einverstanden, genau der Qualitätsstandard, den ich suchte.",
      es: "De acuerdo, justo el estándar de calidad que buscaba.",
    },
  },
  COLLECTOR: {
    initial: {
      tr: "Koleksiyonumun eksik parçasıydı, kaçırmak istemiyorum!",
      en: "The missing piece of my collection, don't want to miss it!",
      de: "Das fehlende Stück meiner Sammlung, darf ich nicht verpassen!",
      es: "¡La pieza que faltaba en mi colección, no puedo dejarla pasar!",
    },
    counter: {
      tr: "Koleksiyon bütçemi biraz zorlayabilirim, teklifimi güncelledim.",
      en: "I can stretch my collector budget a bit, updated my bid.",
      de: "Ich kann mein Sammlerbudget etwas dehnen, Gebot aktualisiert.",
      es: "Puedo estirar un poco mi presupuesto de coleccionista, subo la oferta.",
    },
    accept: {
      tr: "Mükemmel! Koleksiyonumun en değerli köşesine koyacağım.",
      en: "Perfect! It will take pride of place in my collection.",
      de: "Perfekt! Es bekommt einen Ehrenplatz in meiner Sammlung.",
      es: "¡Perfecto! Ocupará un lugar de honor en mi colección.",
    },
  },
  NEGOTIATOR: {
    initial: {
      tr: "Piyasası belli usta, bu fiyata hemen el sıkışalım.",
      en: "Market price is well known, let's shake hands on this.",
      de: "Marktpreis ist bekannt, schlagen wir gleich ein.",
      es: "El precio de mercado está claro, cerremos el trato ya.",
    },
    counter: {
      tr: "Esnaf adamız; ne senin dediğin ne benim, gel anlaşalım.",
      en: "We're fair traders; not your number, not mine, split the diff.",
      de: "Faire Kaufleute: weder deins noch meins, teilen wir den Unterschied.",
      es: "Somos negociantes; ni lo tuyo ni lo mío, punto medio y trato hecho.",
    },
    accept: {
      tr: "Güzel pazarlıktı, iki taraf da kazandı.",
      en: "Great negotiation, a win-win for both of us.",
      de: "Gute Verhandlung, eine Win-Win-Situation für beide.",
      es: "Gran negociación, salimos ganando los dos.",
    },
  },
  RISK_AVERSE: {
    initial: {
      tr: "Sorunsuz çalıştığına güvenerek makul bir teklif verdim.",
      en: "Offering reasonably, trusting that everything works as promised.",
      de: "Biete vernünftig im Vertrauen auf einwandfreie Funktion.",
      es: "Ofrezco un precio justo confiando en que todo funciona bien.",
    },
    counter: {
      tr: "Risk almak istemiyorum; bu fiyata verirsen alırım.",
      en: "Don't want to take risks; if you agree to this, I'm in.",
      de: "Möchte kein Risiko eingehen; zu diesem Preis nehme ich es.",
      es: "No quiero asumir riesgos; a este precio me lo quedo.",
    },
    accept: {
      tr: "Tamamdır, umarım uzun süre sorunsuz kullanırım.",
      en: "Alright, hoping it serves me reliably for a long time.",
      de: "Alles klar, hoffe auf langlebige, zuverlässige Nutzung.",
      es: "De acuerdo, espero que me dure mucho tiempo sin problemas.",
    },
  },
  BULK: {
    initial: {
      tr: "Ticaretini yapıyorum; makul bir pay bırakırsan hemen alırım.",
      en: "I flip these regularly; leave a modest margin and I'll buy now.",
      de: "Ich handle regelmäßig damit; lass mir etwas Marge und ich kaufe.",
      es: "Compro para revender; si me dejas un margen razonable me lo llevo ya.",
    },
    counter: {
      tr: "Sürümden kazanırsın, nakit para hazır.",
      en: "Fast turnover for you, ready cash waiting.",
      de: "Schneller Umsatz für dich, Bargeld liegt bereit.",
      es: "Rotación rápida para ti, dinero listo sobre la mesa.",
    },
    accept: {
      tr: "Anlaştık usta, bir dahaki malında da bana haber et.",
      en: "Deal! Let me know next time you have fresh inventory.",
      de: "Handel steht! Melde dich, wenn du wieder Ware hast.",
      es: "¡Trato hecho! Avísame cuando tengas más artículos.",
    },
  },
};

export function getSellerQuote(
  sellerKind: SellerKind,
  context: SellerDialogueContext = "greeting",
  lang: Language = "tr",
): string {
  return (
    sellerQuotes[sellerKind]?.[context]?.[lang] ??
    sellerQuotes.merchant.greeting[lang] ??
    sellerQuotes.merchant.greeting.tr
  );
}

export function getBuyerQuote(
  buyerType: BuyerType = "QUICK",
  context: BuyerDialogueContext = "initial",
  lang: Language = "tr",
): string {
  return (
    buyerQuotes[buyerType]?.[context]?.[lang] ??
    buyerQuotes.QUICK.initial[lang] ??
    buyerQuotes.QUICK.initial.tr
  );
}

export type CharacterBadge = {
  icon: string;
  role: Record<Language, string>;
};

export const SELLER_BADGES: Record<SellerKind, CharacterBadge> = {
  urgent: {
    icon: "⚡",
    role: { tr: "Acilci Satıcı", en: "Urgent Seller", de: "Eiliger Verkäufer", es: "Vendedor Urgente" },
  },
  merchant: {
    icon: "🏪",
    role: { tr: "Esnaf Satıcı", en: "Merchant", de: "Händler", es: "Comerciante" },
  },
  emotional: {
    icon: "💖",
    role: { tr: "Duygusal Satıcı", en: "Sentimental Seller", de: "Emotionaler Verkäufer", es: "Vendedor Sentimental" },
  },
  uninformed: {
    icon: "📦",
    role: { tr: "Piyasasız Satıcı", en: "Uninformed Seller", de: "Ahnungsloser Verkäufer", es: "Vendedor Desinformado" },
  },
  risky: {
    icon: "🎲",
    role: { tr: "Riskli Satıcı", en: "Risky Seller", de: "Riskanter Verkäufer", es: "Vendedor Arriesgado" },
  },
  expert: {
    icon: "🔍",
    role: { tr: "Uzman Piyasacı", en: "Market Expert", de: "Markt-Experte", es: "Experto de Mercado" },
  },
};

export const BUYER_BADGES: Record<BuyerType, CharacterBadge> = {
  QUICK: {
    icon: "⚡",
    role: { tr: "Seri Alıcı", en: "Quick Buyer", de: "Schnellkäufer", es: "Comprador Rápido" },
  },
  QUALITY: {
    icon: "💎",
    role: { tr: "Kondisyoncu", en: "Condition Hunter", de: "Qualitätskäufer", es: "Cazador de Calidad" },
  },
  COLLECTOR: {
    icon: "🏆",
    role: { tr: "Koleksiyoncu", en: "Collector", de: "Sammler", es: "Coleccionista" },
  },
  NEGOTIATOR: {
    icon: "🤝",
    role: { tr: "Pazarlıkçı", en: "Hard Negotiator", de: "Verhandler", es: "Negociador" },
  },
  RISK_AVERSE: {
    icon: "🛡️",
    role: { tr: "Temkinli Alıcı", en: "Cautious Buyer", de: "Vorsichtiger Käufer", es: "Comprador Cauto" },
  },
  BULK: {
    icon: "📦",
    role: { tr: "Toptancı", en: "Bulk Trader", de: "Großhändler", es: "Mayorista" },
  },
};

export function getSellerBadge(seller: SellerKind): CharacterBadge {
  return SELLER_BADGES[seller] ?? {
    icon: "💬",
    role: { tr: "Satıcı", en: "Seller", de: "Verkäufer", es: "Vendedor" },
  };
}

export function getBuyerBadge(buyerType?: BuyerType): CharacterBadge {
  if (!buyerType) {
    return {
      icon: "💬",
      role: { tr: "Alıcı", en: "Buyer", de: "Käufer", es: "Comprador" },
    };
  }
  return BUYER_BADGES[buyerType] ?? {
    icon: "💬",
    role: { tr: "Alıcı", en: "Buyer", de: "Käufer", es: "Comprador" },
  };
}

