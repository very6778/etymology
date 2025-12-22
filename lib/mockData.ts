export interface WordData {
    tdk?: {
        definition: string;
        type?: string;
    };
    nisanyan?: {
        origin: string;
        root: string;
        meaning: string;
        note?: string;
    };
    aksozluk?: {
        content: string;
    };
    etimolojitr?: {
        content: string;
    };
}

export const mockWords: Record<string, WordData> = {
    hürriyet: {
        tdk: {
            definition: "Serbestlik, bağımsızlık. İnsanın herhangi bir kısıtlamaya, zorlamaya bağlı olmaksızın istediğini yapabilme güç ve yetkisi, özgürlük.",
            type: "isim",
        },
        nisanyan: {
            origin: "Arapça",
            root: "حُرِّيَّة (ḥurriyya)",
            meaning: "Özgürlük, serbest olma durumu, esir veya köle olmama hali",
            note: "Arapça ḥurr (özgür, asil, serbest) kökünden türetilmiştir. Kökün Aramice ḥerūṯā ile bağlantısı tartışmalıdır.",
        },
        aksozluk: {
            content: "Osmanlıca'dan Türkçe'ye geçmiş Arapça kökenli bir kelimedir. Tanzimat döneminde 'liberté' kavramının karşılığı olarak yaygınlaşmıştır.",
        },
        etimolojitr: {
            content: "Arapça ḥurr (özgür) kelimesinden türetilmiştir. Osmanlı döneminde özellikle 19. yüzyıldan itibaren politik bir terim olarak kullanılmaya başlanmıştır.",
        },
    },
    kelime: {
        tdk: {
            definition: "Anlamlı ses veya ses birliği, söz, sözcük.",
            type: "isim",
        },
        nisanyan: {
            origin: "Arapça",
            root: "كَلِمَة (kalima)",
            meaning: "Söz, sözcük, laf",
            note: "Arapça klm (konuşmak) kökünden gelir. Türkçeye Osmanlıca aracılığıyla girmiştir.",
        },
        aksozluk: {
            content: "Arapça kökenli bir terim olup, dilde anlam taşıyan en küçük birim olarak tanımlanır.",
        },
        etimolojitr: {
            content: "Arapça kalima kelimesinden alınmıştır. Semitik dillerdeki k-l-m kökünden türer.",
        },
    },
    etimoloji: {
        tdk: {
            definition: "Köken bilimi, köken bilgisi.",
            type: "isim",
        },
        nisanyan: {
            origin: "Fransızca",
            root: "étymologie",
            meaning: "Kelimelerin kökenini ve tarihsel gelişimini inceleyen bilim dalı",
            note: "Yunanca ἔτυμον (étymon, gerçek anlam) + λόγος (lógos, söz, bilim) kelimelerinden oluşur.",
        },
        aksozluk: {
            content: "Batı dillerinden Türkçeye geçmiş, köken bilimi anlamında kullanılan akademik bir terimdir.",
        },
        etimolojitr: {
            content: "Fransızca étymologie kelimesinden alınmıştır. Antik Yunancada 'gerçek anlam' anlamına gelen etymon köküne dayanır.",
        },
    },
};

export function getWordData(word: string): WordData | null {
    const normalized = word.toLowerCase().trim();
    return mockWords[normalized] || null;
}
