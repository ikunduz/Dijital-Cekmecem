export const getSeasonalTip = () => {
    const month = new Date().getMonth(); // 0 = Jan, 11 = Dec

    // Winter (Dec, Jan, Feb)
    if (month === 11 || month === 0 || month === 1) {
        return {
            title: "Kış Bakımı",
            text: "Radyatörlerin havasını almak ve kombi basıncını kontrol etmek %10 tasarruf sağlar.",
            icon: "snowflake"
        };
    }
    // Spring (Mar, Apr, May)
    if (month >= 2 && month <= 4) {
        return {
            title: "Bahar Hazırlığı",
            text: "Klima filtrelerini temizletmek ve çatı oluklarını kontrol etmek için harika bir zaman.",
            icon: "flower"
        };
    }
    // Summer (Jun, Jul, Aug)
    if (month >= 5 && month <= 7) {
        return {
            title: "Yaz Önlemleri",
            text: "Sıcaklar bastırmadan soğutma sistemlerini test edin ve haşere kontrolü yapın.",
            icon: "white-balance-sunny"
        };
    }
    // Autumn (Sep, Oct, Nov)
    if (month >= 8 && month <= 10) {
        return {
            title: "Sonbahar Kontrolü",
            text: "Kış gelmeden kombi bakımını yaptırın ve pencere yalıtımlarını gözden geçirin.",
            icon: "leaf"
        };
    }
    return {
        title: "Ev İpucu",
        text: "Evinizi düzenli havalandırmak nem oluşumunu engeller.",
        icon: "lightbulb-on"
    };
};

export const analyzeBillTrends = (transactions) => {
    // Filter transactions by category 'bill'
    const bills = transactions
        .filter(t => t.category === 'bill')
        .sort((a, b) => {
            // Parse dates DD.MM.YYYY
            const parse = (d) => {
                if (!d) return 0;
                const parts = d.split('.');
                return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
            };
            return parse(b.date) - parse(a.date);
        });

    if (bills.length < 2) return null;

    const latest = bills[0];
    const previous = bills[1];

    const latestCost = parseFloat(latest.cost);
    const previousCost = parseFloat(previous.cost);

    if (!latestCost || !previousCost) return null;

    // Check for increase
    const percentChange = ((latestCost - previousCost) / previousCost) * 100;

    if (percentChange > 20) {
        return {
            title: "Fatura Uyarısı",
            text: `Son faturanız bir öncekine göre %${Math.round(percentChange)} artmış. Gereksiz kullanımları kontrol edebilirsiniz.`,
            icon: "trending-up",
            color: "#ef4444" // Red
        };
    }

    if (percentChange < -10) {
        return {
            title: "Tasarruf Başarısı",
            text: `Harika! Son faturanız bir öncekine göre %${Math.abs(Math.round(percentChange))} daha düşük.`,
            icon: "trending-down",
            color: "#22c55e" // Green
        };
    }

    return null;
};

export const getSmartTips = (transactions, history, financeStats) => {
    const tips = [];

    // 1. Seasonal Tip
    tips.push(getSeasonalTip());

    // 2. Bill Anomaly
    const billAnomalies = analyzeBillTrends(transactions || []);
    if (billAnomalies) tips.push(billAnomalies);

    // 3. Maintenance Tip (Random/Contextual)
    const maintenanceTasks = [
        { title: "Kombi Bakımı", text: "Kombini en son ne zaman kontrol ettin? Verimlilik için yıllık bakım şart.", icon: "radiator" },
        { title: "Güvenlik Kontrolü", text: "Duman dedektörü pillerini ve yangın tüpünü kontrol etmeyi unutma.", icon: "shield-alert" },
        { title: "Tasarruf İpucu", text: "Aydınlatmada LED ampul kullanarak elektrik faturanı %15 azaltabilirsin.", icon: "lightbulb-outline" }
    ];
    tips.push(maintenanceTasks[Math.floor(Math.random() * maintenanceTasks.length)]);

    // 4. Budget Warning
    if (financeStats && financeStats.balance < 0) {
        tips.push({
            title: "Bütçe Uyarısı",
            text: `Bu ay bütçeni ${Math.abs(financeStats.balance)} TL aştın. Harcamalarını gözden geçirmek isteyebilirsin.`,
            icon: "alert-circle",
            color: "#ef4444"
        });
    }

    return tips;
};

