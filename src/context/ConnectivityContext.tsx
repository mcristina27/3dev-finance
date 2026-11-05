import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { bold, boldBorder, hardShadow } from '../theme/boldTheme';

interface OfflineOptions {
  title?: string;
  message?: string;
}

interface ConnectivityContextType {
  /** Muestra el modal de "sin conexión". Opcionalmente personaliza el texto. */
  showOffline: (opts?: OfflineOptions) => void;
}

const ConnectivityContext = createContext<ConnectivityContextType | null>(null);

const DEFAULT_TITLE = 'Sin conexión';
const DEFAULT_MESSAGE =
  'Parece que no tienes internet ahora mismo. Revisa tu conexión y vuelve a intentar — no perdiste nada de lo que escribiste. 💛';

export function ConnectivityProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  const showOffline = useCallback((opts?: OfflineOptions) => {
    setTitle(opts?.title ?? DEFAULT_TITLE);
    setMessage(opts?.message ?? DEFAULT_MESSAGE);
    setVisible(true);
  }, []);

  return (
    <ConnectivityContext.Provider value={{ showOffline }}>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.backdrop}>
          <View style={[styles.card, boldBorder, hardShadow(6)]}>
            <Text style={styles.emoji}>📡</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            <TouchableOpacity
              style={[styles.btn, boldBorder, hardShadow(3)]}
              onPress={() => setVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ConnectivityContext.Provider>
  );
}

export function useConnectivity() {
  const ctx = useContext(ConnectivityContext);
  if (!ctx) throw new Error('useConnectivity must be used inside ConnectivityProvider');
  return ctx;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(23,20,18,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: bold.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 44,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: bold.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 21,
    color: bold.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  btn: {
    backgroundColor: bold.yellow,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '800',
    color: bold.black,
  },
});
