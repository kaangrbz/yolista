import { StyleSheet } from 'react-native';

// Colors
export const Colors = {
  primary: '#1DA1F2',
  secondary: '#222222',
  background: '#ffffff',
  text: '#333333',
  lightText: '#666666',
  error: '#c00',
  success: '#4CAF50',
  border: '#eee',
  separator: '#eee',
  verified: '#1DA1F2',
};

// Typography
export const Typography = {
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  body: {
    fontSize: 16,
    color: Colors.text,
  },
  light: {
    fontSize: 16,
    color: Colors.lightText,
  },
  small: {
    fontSize: 14,
    color: Colors.text,
  },
};

// Spacing
export const Spacing = {
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
};

// Common Components
export const commonStyles = StyleSheet.create({
  // Buttons
  primaryButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.medium,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Text Inputs
  input: {
    backgroundColor: '#f5f5f5',
    padding: Spacing.medium,
    borderRadius: 8,
    fontSize: 16,
    marginVertical: Spacing.small,
  },

  // Cards
  card: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginVertical: Spacing.medium,
  },

  // Separators
  separator: {
    height: 1,
    backgroundColor: Colors.separator,
    marginVertical: Spacing.medium,
  },

  // Icons
  icon: {
    fontSize: 24,
    color: Colors.text,
  },

  // Menu Items
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
  },
  menuText: {
    fontSize: 16,
    color: Colors.text,
  },
  menuItemIcon: {
    marginRight: Spacing.medium,
  },
});

// Export all styles
export default {
  Colors,
  Typography,
  Spacing,
  commonStyles,
};
