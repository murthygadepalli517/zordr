import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Trophy, Flame, Coins } from 'lucide-react-native';
import { useStore } from '../context/StoreContext';
import { hapticFeedback } from '../utils/haptics';

const LoyaltyCard: React.FC = () => {
  const router = useRouter();
  const { stats } = useStore();

  const handlePress = () => {
    hapticFeedback.medium();
    router.push('/loyalty');
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.95}>
      {/* Background Decorations */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <View style={styles.content}>
        <View style={styles.leftContent}>
          <Text style={styles.label}>Current Rank</Text>
          <Text style={styles.rankName}>{stats.currentRank.name}</Text>

          <View style={styles.badges}>
            {/* Weekly Orders */}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{stats.weeklyOrders} Orders/Wk</Text>
            </View>

            {/* Streak */}
            {stats.streak > 0 && (
              <View style={styles.streakBadge}>
                <Flame size={12} color="#FED7AA" fill="#FED7AA" />
                <Text style={styles.streakText}>{stats.streak} Day Streak</Text>
              </View>
            )}

            {/* Z-Coins */}
            <View style={styles.coinsBadge}>
              <Coins size={12} color="#FEF3C7" fill="#FEF3C7" />
              <Text style={styles.coinsText}>{stats.zCoins}</Text>
            </View>
          </View>
        </View>

        <View style={styles.trophyContainer}>
          <Trophy size={28} color="#fff" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 32,
    padding: 24,
    backgroundColor: '#FF5500',
    shadowColor: '#FF5500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  bgCircle1: {
    position: 'absolute',
    top: -16,
    right: -16,
    width: 128,
    height: 128,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 64,
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -16,
    left: -16,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 40,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  leftContent: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  rankName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
  },
  streakText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  coinsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FEF3C7',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trophyContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default LoyaltyCard;
