import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function HomeMoodBubble({ mood }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Reset and animate
        fadeAnim.setValue(0);
        floatAnim.setValue(0);

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.loop(
                Animated.sequence([
                    Animated.timing(floatAnim, {
                        toValue: -10,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(floatAnim, {
                        toValue: 0,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ])
            ).start(),
        ]).start();
    }, [mood.message]);

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: floatAnim }]
                }
            ]}
        >
            <View style={[styles.bubble, { borderColor: mood.color + '40' }]}>
                <View style={[styles.iconContainer, { backgroundColor: mood.color + '15' }]}>
                    <MaterialCommunityIcons name={mood.icon} size={20} color={mood.color} />
                </View>
                <Text style={styles.message}>{mood.message}</Text>

                {/* Pointer Tip */}
                <View style={[styles.tip, { borderTopColor: 'white' }]} />
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: -10,
        right: -60,
        maxWidth: 150,
        zIndex: 100,
    },
    bubble: {
        backgroundColor: 'white',
        borderRadius: 18,
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        borderWidth: 1,
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 6,
    },
    message: {
        fontSize: 11,
        color: '#334155',
        fontWeight: '600',
        flexShrink: 1,
    },
    tip: {
        position: 'absolute',
        bottom: -8,
        left: 20,
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: 'white',
    }
});
