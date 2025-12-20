import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Button, Icon, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useHomeContext } from '../context/HomeContext';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const COLORS = {
    primary: "#F57C00",
    background: "#f8f9fa",
    textDark: "#111417",
    textGray: "#647487",
    white: "#FFFFFF",
    border: "#e5e7eb",
};

export default function HomeReportPage() {
    const router = useRouter();
    const { history, homeProfile } = useHomeContext();
    const [loading, setLoading] = useState(false);

    const homeInfo = {
        name: homeProfile?.title || "Evim",
        address: homeProfile?.address || "Adres Girilmemiş",
    };

    // All records are relevant for home report
    const reportRecords = history;

    // Categorize records
    const categorizeRecord = (item) => {
        if (item.type === 'bill') return 'Faturalar';
        if (item.type === 'warranty') return 'Garantiler/Eşyalar';
        if (item.type === 'doc') return 'Resmi Evraklar';
        return 'Diğer';
    };

    // Group records by category
    const groupedRecords = reportRecords.reduce((acc, item) => {
        const category = categorizeRecord(item);
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
    }, {});

    // Calculate totals
    const totalCost = reportRecords.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0);

    const processHistoryImages = async (originalHistory) => {
        const processed = await Promise.all(originalHistory.map(async (item) => {
            if (item.image) {
                try {
                    const base64 = await FileSystem.readAsStringAsync(item.image, { encoding: 'base64' });
                    return { ...item, image: 'data:image/jpeg;base64,' + base64 };
                } catch (e) {
                    console.log("Error reading image:", e);
                    return item;
                }
            }
            return item;
        }));
        return processed;
    };

    const generateHtml = (processedRecords) => {
        const today = new Date().toLocaleDateString('tr-TR');

        // Group processed records
        const grouped = processedRecords.reduce((acc, item) => {
            const category = categorizeRecord(item);
            if (!acc[category]) acc[category] = [];
            acc[category].push(item);
            return acc;
        }, {});

        // Generate sections for each category
        const categorySections = Object.keys(grouped).map(category => {
            const items = grouped[category];
            const categoryTotal = items.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0);

            const rows = items.map(item => `
                <tr>
                    <td>${item.date}</td>
                    <td>${item.description || item.subType || '-'}</td>
                    <td>${formatCurrency(item.cost)}</td>
                </tr>
            `).join('');

            return `
                <div class="category-section">
                    <h3>${category} <span class="category-total">${formatCurrency(categoryTotal)}</span></h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Tarih</th>
                                <th>Açıklama / Tür</th>
                                <th>Tutar</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </div>
            `;
        }).join('');

        // Generate image sections
        const imageSections = processedRecords
            .filter(item => item.image)
            .map(item => `
                <div class="image-section">
                    <h4>${item.date} - ${item.description || 'Belge'}</h4>
                    <img src="${item.image}" class="record-image" />
                </div>
            `).join('');

        const totalCostAll = processedRecords.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0);

        return `
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
                    h1 { color: #F57C00; border-bottom: 2px solid #F57C00; padding-bottom: 10px; font-size: 22px; }
                    h2 { color: #333; font-size: 18px; margin-top: 30px; }
                    .header-info { margin-bottom: 30px; font-size: 14px; color: #555; background: #f8f9fa; padding: 15px; border-radius: 8px; }
                    .summary-box { background: #F57C00; color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; text-align: center; }
                    .summary-box h2 { color: white; margin: 0 0 5px 0; font-size: 14px; font-weight: normal; }
                    .summary-box .amount { font-size: 28px; font-weight: bold; }
                    .category-section { margin-bottom: 25px; }
                    .category-section h3 { color: #F57C00; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; display: flex; justify-content: space-between; }
                    .category-total { color: #22c55e; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                    th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 12px; }
                    th { background-color: #f8f9fa; color: #333; font-weight: 600; }
                    tr:nth-child(even) { background-color: #fafafa; }
                    .image-section { page-break-inside: avoid; margin-bottom: 30px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; }
                    .image-section h4 { margin: 0 0 10px 0; color: #647487; font-size: 13px; }
                    .record-image { max-width: 100%; height: auto; border-radius: 8px; display: block; }
                    .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #999; }
                </style>
            </head>
            <body>
                <h1>🏠 Ev Raporu</h1>
                
                <div class="header-info">
                    <strong>Ev:</strong> ${homeInfo.name}<br>
                    <strong>Adres:</strong> ${homeInfo.address}<br>
                    <strong>Rapor Tarihi:</strong> ${today}
                </div>

                <div class="summary-box">
                    <h2>Toplam Harcama / Maliyet</h2>
                    <div class="amount">${formatCurrency(totalCostAll)}</div>
                </div>

                <h2>Kategori Bazlı Harcamalar</h2>
                ${categorySections || '<p style="color: #999;">Henüz kayıt bulunmuyor.</p>'}

                ${imageSections ? `<h2>Ekli Belgeler</h2>` + imageSections : ''}

                <div class="footer">
                    Bu rapor Dijital Çekmecem uygulaması ile oluşturulmuştur.
                </div>
            </body>
            </html>
        `;
    };

    const formatCurrency = (amount) => {
        if (!amount) return '-';
        return parseFloat(amount).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
    };

    const createAndSharePdf = async () => {
        try {
            setLoading(true);
            const processedHistory = await processHistoryImages(reportRecords);
            const html = generateHtml(processedHistory);
            const { uri } = await Print.printToFileAsync({ html, base64: false });
            await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error(error);
            Alert.alert('Hata', 'PDF oluşturulamadı veya paylaşılamadı.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top', 'left', 'right']}>
            {/* HEADER */}
            <View style={[styles.header, { backgroundColor: COLORS.surface, borderBottomColor: COLORS.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Icon source="arrow-left" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: COLORS.textDark }]}>Ev Raporu</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.infoBox}>
                    <Icon source="file-chart" size={48} color={COLORS.primary} />
                    <Text style={[styles.infoTitle, { color: COLORS.textDark }]}>Ev Raporu Oluştur</Text>
                    <Text style={[styles.infoText, { color: COLORS.textGray }]}>
                        Fatura, garanti ve evrak kayıtlarınızı PDF formatında raporlayın ve paylaşın.
                    </Text>
                </View>

                {/* Category Summary */}
                <View style={[styles.categoryList, { backgroundColor: COLORS.surface }]}>
                    {Object.keys(groupedRecords).map((category, index) => (
                        <View key={index} style={[styles.categoryItem, { borderBottomColor: COLORS.border }]}>
                            <Text style={[styles.categoryName, { color: COLORS.textDark }]}>{category}</Text>
                            <Text style={[styles.categoryCount, { color: COLORS.textGray }]}>{groupedRecords[category].length} kayıt</Text>
                        </View>
                    ))}
                    {Object.keys(groupedRecords).length === 0 && (
                        <Text style={[styles.emptyText, { color: COLORS.textGray }]}>Henüz kayıt yok</Text>
                    )}
                </View>

                <View style={styles.statsRow}>
                    <View style={[styles.statItem, { backgroundColor: COLORS.surface }]}>
                        <Text style={[styles.statLabel, { color: COLORS.textGray }]}>Toplam Kayıt</Text>
                        <Text style={[styles.statValue, { color: COLORS.primary }]}>{reportRecords.length}</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: COLORS.surface }]}>
                        <Text style={[styles.statLabel, { color: COLORS.textGray }]}>Toplam Tutar</Text>
                        <Text style={[styles.statValue, { fontSize: 18, color: COLORS.primary }]}>{formatCurrency(totalCost)}</Text>
                    </View>
                </View>

                <Button
                    mode="contained"
                    onPress={createAndSharePdf}
                    style={styles.exportButton}
                    contentStyle={{ height: 50 }}
                    loading={loading}
                    disabled={loading || reportRecords.length === 0}
                    icon="share-variant"
                    buttonColor={COLORS.primary}
                >
                    PDF Oluştur ve Paylaş
                </Button>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    closeButton: {
        padding: 8,
        marginLeft: -8,
    },
    content: {
        padding: 24,
        flexGrow: 1,
    },
    infoBox: {
        alignItems: 'center',
        marginBottom: 30,
    },
    infoTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 12,
    },
    infoText: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    categoryList: {
        marginBottom: 24,
        borderRadius: 12,
        padding: 16,
    },
    categoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    categoryName: {
        fontSize: 15,
        fontWeight: '500',
    },
    categoryCount: {
        fontSize: 14,
    },
    emptyText: {
        textAlign: 'center',
        paddingVertical: 20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    statLabel: {
        fontSize: 13,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '700',
    },
    exportButton: {
        width: '100%',
        borderRadius: 8,
    },
});
