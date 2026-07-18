import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { TransactionProvider } from './src/context/TransactionContext';
import { MaterialProvider } from './src/context/MaterialContext';
import { ActivityProvider } from './src/context/ActivityContext';
import { InventoryProvider } from './src/context/InventoryContext';
import { AgendaEventProvider } from './src/context/AgendaEventContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
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
  );
}
