import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Button, Icon, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCarContext } from '../context/CarContext';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const COLORS = {
    primary: "#1d72d3",
    background: "#f8f9fa",
    textDark: "#111417",
    textGray: "#647487",
    white: "#FFFFFF",
    border: "#e5e7eb",
};

export default function ReportPage() {
    const router = useRouter();
    const { history, carProfile } = useCarContext();
    const [loading, setLoading] = useState(false);

    const carInfo = {
        name: (carProfile?.make && carProfile?.model) ? `${carProfile.make} ${carProfile.model}` : "Belirtilmemiş",
        plate: carProfile?.plate || "Belirtilmemiş",
    };

    // Filter out fuel records - only service and doc records
    const reportRecords = history.filter(r => r.type === 'service' || r.type === 'doc');

    // Categorize records intelligently
    const categorizeRecord = (item) => {
        const desc = (item.description || '').toLowerCase();
        const subType = item.subType || '';

        // Periyodik Bakım
        if (desc.includes('periyodik') || desc.includes('yağ') || desc.includes('filtre') ||
            desc.includes('bakım') || item.isPeriodicMaintenance) {
            return 'Periyodik Bakım';
        }

        // Sigorta / Kasko / Muayene
        if (subType === 'insurance' || subType === 'kasko' || subType === 'inspection' ||
            desc.includes('sigorta') || desc.includes('kasko') || desc.includes('muayene') ||
            desc.includes('trafik') || desc.includes('zorunlu')) {
            return 'Sigorta & Belgeler';
        }

        // Satın Alımlar (Lastik, Akü, Parça vb.)
        if (desc.includes('lastik') || desc.includes('akü') || desc.includes('fren') ||
            desc.includes('balata') || desc.includes('disk') || desc.includes('amortisör') ||
            desc.includes('parça') || desc.includes('yedek')) {
            return 'Satın Alımlar';
        }

        // Arıza / Tamir
        if (desc.includes('arıza') || desc.includes('tamir') || desc.includes('onarım') ||
            desc.includes('değişim') || desc.includes('bozuk')) {
            return 'Arıza & Onarım';
        }

        // Default: Servis for service type, Belge for doc type
        return item.type === 'service' ? 'Diğer Bakımlar' : 'Belgeler';
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
    const recordsWithImages = reportRecords.filter(r => r.image).length;

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
                    <td>${item.description || '-'}</td>
                    <td>${item.km || '-'}</td>
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
                                <th>Açıklama</th>
                                <th>KM</th>
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
                    h1 { color: #1d72d3; border-bottom: 2px solid #1d72d3; padding-bottom: 10px; font-size: 22px; }
                    h2 { color: #333; font-size: 18px; margin-top: 30px; }
                    .header-info { margin-bottom: 30px; font-size: 14px; color: #555; background: #f8f9fa; padding: 15px; border-radius: 8px; }
                    .summary-box { background: #1d72d3; color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; text-align: center; }
                    .summary-box h2 { color: white; margin: 0 0 5px 0; font-size: 14px; font-weight: normal; }
                    .summary-box .amount { font-size: 28px; font-weight: bold; }
                    .category-section { margin-bottom: 25px; }
                    .category-section h3 { color: #1d72d3; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; display: flex; justify-content: space-between; }
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
                <h1>🚗 Araç Bakım Raporu</h1>
                
                <div class="header-info">
                    <strong>Araç:</strong> ${carInfo.name}<br>
                    <strong>Plaka:</strong> ${carInfo.plate}<br>
                    <strong>Rapor Tarihi:</strong> ${today}
                </div>

                <div class="summary-box">
                    <h2>Toplam Harcama</h2>
                    <div class="amount">${formatCurrency(totalCostAll)}</div>
                </div>

                <h2>Kategori Bazlı Harcamalar</h2>
                ${categorySections || '<p style="color: #999;">Henüz kayıt bulunmuyor.</p>'}

                ${imageSections ? `<h2>Ekli Belgeler</h2>` + imageSections : ''}

                <div class="footer">
                    Bu rapor Dijital Torpido uygulaması ile oluşturulmuştur.
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
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Icon source="arrow-left" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Bakım Raporu</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.infoBox}>
                    <Icon source="file-chart" size={48} color={COLORS.primary} />
                    <Text style={styles.infoTitle}>Bakım Raporu</Text>
                    <Text style={styles.infoText}>
                        Servis kayıtları, belgeler ve harcamalarınızı kategorilere ayrılmış şekilde PDF olarak dışa aktarın.
                    </Text>
                </View>

                {/* Category Summary */}
                <View style={styles.categoryList}>
                    {Object.keys(groupedRecords).map((category, index) => (
                        <View key={index} style={styles.categoryItem}>
                            <Text style={styles.categoryName}>{category}</Text>
                            <Text style={styles.categoryCount}>{groupedRecords[category].length} kayıt</Text>
                        </View>
                    ))}
                    {Object.keys(groupedRecords).length === 0 && (
                        <Text style={styles.emptyText}>Henüz bakım/belge kaydı yok</Text>
                    )}
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Toplam Kayıt</Text>
                        <Text style={styles.statValue}>{reportRecords.length}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Toplam Harcama</Text>
                        <Text style={[styles.statValue, { fontSize: 18 }]}>{formatCurrency(totalCost)}</Text>
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
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textDark,
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
        color: COLORS.textDark,
        marginTop: 16,
        marginBottom: 12,
    },
    infoText: {
        fontSize: 15,
        color: COLORS.textGray,
        textAlign: 'center',
        lineHeight: 22,
    },
    categoryList: {
        marginBottom: 24,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 16,
    },
    categoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    categoryName: {
        fontSize: 15,
        fontWeight: '500',
        color: COLORS.textDark,
    },
    categoryCount: {
        fontSize: 14,
        color: COLORS.textGray,
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.textGray,
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
        backgroundColor: COLORS.background,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    statLabel: {
        fontSize: 13,
        color: COLORS.textGray,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.primary,
    },
    exportButton: {
        width: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
});
