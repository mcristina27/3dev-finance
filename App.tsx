import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ConnectivityProvider } from './src/context/ConnectivityContext';
import { AuthProvider } from './src/context/AuthContext';
import { TransactionProvider } from './src/context/TransactionContext';
import { MaterialProvider } from './src/context/MaterialContext';
import { ActivityProvider } from './src/context/ActivityContext';
import { InventoryProvider } from './src/context/InventoryContext';
import { AgendaEventProvider } from './src/context/AgendaEventContext';
import { RecipeProvider } from './src/context/RecipeContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { migrateStorageKeys } from './src/services/migrateStorageKeys';
import { bold } from './src/theme/boldTheme';

export default function App() {
  const [migrated, setMigrated] = useState(false);

  useEffect(() => {
    migrateStorageKeys().finally(() => setMigrated(true));
  }, []);

  if (!migrated) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={bold.pink} />
      </View>
    );
  }

  return (
    <ConnectivityProvider>
      <AuthProvider>
      <RecipeProvider>
      <TransactionProvider>
        <MaterialProvider>
          <InventoryProvider>
            <AgendaEventProvider>
              <ActivityProvider>
                <StatusBar style="dark" />
                <AppNavigator />
              </ActivityProvider>
            </AgendaEventProvider>
          </InventoryProvider>
        </MaterialProvider>
      </TransactionProvider>
      </RecipeProvider>
      </AuthProvider>
    </ConnectivityProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: bold.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
